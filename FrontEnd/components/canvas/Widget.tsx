"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useCanvas } from "@/context/CanvasContext";
import type { WidgetData } from "@/hooks/useWidgets";

interface WidgetProps {
  widget: WidgetData;
  onMove: (widgetId: string, x: number, y: number) => void;
  onFocus: (widgetId: string) => void;
}

export function Widget({ widget, onMove, onFocus }: WidgetProps) {
  const { zoom } = useCanvas();

  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, worldX: 0, worldY: 0 });
  const lastEmitTime = useRef(0);
  const DRAG_THROTTLE = 33; // ~30fps emit rate

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left mouse button
      if (e.button !== 0) return;
      e.stopPropagation(); // Don't fire canvas click
      e.preventDefault();

      isDragging.current = true;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        worldX: widget.x,
        worldY: widget.y,
      };

      // Bring to front
      onFocus(widget.id);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;

        const now = Date.now();
        const dxScreen = moveEvent.clientX - dragStart.current.mouseX;
        const dyScreen = moveEvent.clientY - dragStart.current.mouseY;

        // Convert screen-space delta to world-space delta
        const newX = dragStart.current.worldX + dxScreen / zoom;
        const newY = dragStart.current.worldY + dyScreen / zoom;

        // Throttle emit, but always update visually
        if (now - lastEmitTime.current > DRAG_THROTTLE) {
          onMove(widget.id, newX, newY);
          lastEmitTime.current = now;
        }
      };

      const onMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, widget.x, widget.y, zoom, onMove, onFocus]
  );

  return (
    <motion.div
      style={{
        position: "absolute",
        left: widget.x,
        top: widget.y,
        zIndex: widget.z,
        // Undo zoom on the widget itself so its size stays consistent in screen space
        width: 160,
        height: 100,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onMouseDown={onMouseDown}
      className="cursor-grab active:cursor-grabbing"
    >
      <div
        className="w-full h-full rounded-2xl border border-blue-500/30 bg-zinc-900/80 backdrop-blur-md shadow-xl flex flex-col select-none"
        style={{ boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.4)" }}
      >
        {/* Drag handle bar */}
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 border-b border-white/5">
          <div className="h-2 w-2 rounded-full bg-red-500/70" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <div className="h-2 w-2 rounded-full bg-green-500/70" />
          <span className="ml-auto text-[9px] text-zinc-600 font-mono">
            {Math.round(widget.x)}, {Math.round(widget.y)}
          </span>
        </div>

        {/* Widget body */}
        <div className="flex-1 flex items-center justify-center p-3">
          <span className="text-xs font-medium text-zinc-400">
            {(widget.data as any)?.label ?? "Box"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
