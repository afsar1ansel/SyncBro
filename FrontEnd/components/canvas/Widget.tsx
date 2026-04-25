"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useCanvas } from "@/context/CanvasContext";
import type { WidgetData } from "@/hooks/useWidgets";

interface WidgetProps {
  widget: WidgetData;
  onMove: (widgetId: string, x: number, y: number, w: number, h: number) => void;
  onFocus: (widgetId: string) => void;
}

export function Widget({ widget, onMove, onFocus }: WidgetProps) {
  const { zoom } = useCanvas();

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeDir = useRef<string | null>(null);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, worldX: 0, worldY: 0, worldW: 0, worldH: 0 });
  const lastEmitTime = useRef(0);
  const DRAG_THROTTLE = 33; // ~30fps emit rate

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      isDragging.current = true;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        worldX: widget.x,
        worldY: widget.y,
        worldW: widget.width || 200,
        worldH: widget.height || 150,
      };

      onFocus(widget.id);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const now = Date.now();
        const dxScreen = moveEvent.clientX - dragStart.current.mouseX;
        const dyScreen = moveEvent.clientY - dragStart.current.mouseY;

        const newX = dragStart.current.worldX + dxScreen / zoom;
        const newY = dragStart.current.worldY + dyScreen / zoom;

        if (now - lastEmitTime.current > DRAG_THROTTLE) {
          onMove(widget.id, newX, newY, dragStart.current.worldW, dragStart.current.worldH);
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
    [widget.id, widget.x, widget.y, widget.width, widget.height, zoom, onMove, onFocus]
  );

  const onResizeStart = useCallback(
    (e: React.MouseEvent, dir: string) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing.current = true;
      resizeDir.current = dir;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        worldX: widget.x,
        worldY: widget.y,
        worldW: widget.width || 200,
        worldH: widget.height || 150,
      };

      onFocus(widget.id);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const now = Date.now();
        const dxScreen = moveEvent.clientX - dragStart.current.mouseX;
        const dyScreen = moveEvent.clientY - dragStart.current.mouseY;

        const dxWorld = dxScreen / zoom;
        const dyWorld = dyScreen / zoom;

        let newX = widget.x;
        let newY = widget.y;
        let newW = widget.width;
        let newH = widget.height;

        if (dir.includes("e")) newW = Math.max(100, dragStart.current.worldW + dxWorld);
        if (dir.includes("s")) newH = Math.max(60, dragStart.current.worldH + dyWorld);
        if (dir.includes("w")) {
          const delta = Math.min(dragStart.current.worldW - 100, dxWorld);
          newX = dragStart.current.worldX + delta;
          newW = dragStart.current.worldW - delta;
        }
        if (dir.includes("n")) {
          const delta = Math.min(dragStart.current.worldH - 60, dyWorld);
          newY = dragStart.current.worldY + delta;
          newH = dragStart.current.worldH - delta;
        }

        if (now - lastEmitTime.current > DRAG_THROTTLE) {
          onMove(widget.id, newX, newY, newW, newH);
          lastEmitTime.current = now;
        }
      };

      const onMouseUp = () => {
        isResizing.current = false;
        resizeDir.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, widget.x, widget.y, widget.width, widget.height, zoom, onMove, onFocus]
  );

  return (
    <motion.div
      style={{
        position: "absolute",
        left: widget.x,
        top: widget.y,
        zIndex: widget.z,
        width: widget.width || 200,
        height: widget.height || 150,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onMouseDown={onMouseDown}
      className="group cursor-grab active:cursor-grabbing"
    >
      <div
        className="w-full h-full rounded-2xl border border-blue-500/30 bg-zinc-900/80 backdrop-blur-md shadow-xl flex flex-col select-none relative overflow-hidden"
        style={{ boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.4)" }}
      >
        {/* Drag handle bar */}
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 border-b border-white/5">
          <div className="h-2 w-2 rounded-full bg-red-500/70" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <div className="h-2 w-2 rounded-full bg-green-500/70" />
          <span className="ml-auto text-[9px] text-zinc-600 font-mono">
            {Math.round(widget.width)}x{Math.round(widget.height)}
          </span>
        </div>

        {/* Widget body */}
        <div className="flex-1 flex items-center justify-center p-3">
          <span className="text-xs font-medium text-zinc-400">
            {(widget.data as any)?.label ?? "Box"}
          </span>
        </div>

        {/* Resize Handles */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edges */}
          <div className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "n")} />
          <div className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "s")} />
          <div className="absolute left-0 top-2 bottom-2 w-1 cursor-ew-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "w")} />
          <div className="absolute right-0 top-2 bottom-2 w-1 cursor-ew-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "e")} />
          
          {/* Corners */}
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "nw")} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "ne")} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "sw")} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, "se")} />
        </div>
      </div>
    </motion.div>
  );
}
