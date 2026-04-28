"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useCanvas } from "@/context/CanvasContext";
import type { WidgetData } from "@/hooks/useWidgets";
import { X, Minus, GripHorizontal, Palette, Type, Check } from "lucide-react";
import { useState } from "react";

interface WidgetProps {
  widget: WidgetData;
  onMove: (
    widgetId: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  onFocus: (widgetId: string) => void;
  onUpdateData: (widgetId: string, data: any) => void;
  onRemove: (widgetId: string) => void;
}

export function Widget({
  widget,
  onMove,
  onFocus,
  onUpdateData,
  onRemove,
}: WidgetProps) {
  const { zoom } = useCanvas();

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeDir = useRef<string | null>(null);
  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    worldX: 0,
    worldY: 0,
    worldW: 0,
    worldH: 0,
  });
  const lastEmitTime = useRef(0);
  const DRAG_THROTTLE = 33; // ~30fps emit rate

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      // Don't drag if we're interacting with the textarea
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;

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
          onMove(
            widget.id,
            newX,
            newY,
            dragStart.current.worldW,
            dragStart.current.worldH,
          );
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
    [
      widget.id,
      widget.x,
      widget.y,
      widget.width,
      widget.height,
      zoom,
      onMove,
      onFocus,
    ],
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

        if (dir.includes("e"))
          newW = Math.max(100, dragStart.current.worldW + dxWorld);
        if (dir.includes("s"))
          newH = Math.max(60, dragStart.current.worldH + dyWorld);
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
    [
      widget.id,
      widget.x,
      widget.y,
      widget.width,
      widget.height,
      zoom,
      onMove,
      onFocus,
    ],
  );

  // Secondary safeguard: if a SCREENSHARE widget somehow gets here, don't render it.
  // SCREENSHARE is handled exclusively by StreamWidget.tsx
  if (widget.type === "SCREENSHARE") return null;

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
        style={{
          boxShadow:
            "0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Drag handle bar / Title Bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800/90 border-b border-white/5 cursor-grab active:cursor-grabbing group/title"
          onMouseDown={onMouseDown}
        >
          <div className="flex gap-1.5 mr-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(widget.id);
              }}
              className="h-3 w-3 rounded-full bg-red-500/40 hover:bg-red-500 transition-colors flex items-center justify-center group-hover/title:bg-red-500"
            >
              <X
                size={8}
                className="text-white opacity-0 group-hover/title:opacity-100"
              />
            </button>
            <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
            <div className="h-3 w-3 rounded-full bg-green-500/40" />
          </div>

          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest select-none flex items-center gap-2">
            {widget.type === "STICKY" ? (
              <Type size={10} />
            ) : (
              <Palette size={10} />
            )}
            {widget.type}
          </span>

          <span className="ml-auto text-[9px] text-zinc-600 font-mono">
            {Math.round(widget.width)}x{Math.round(widget.height)}
          </span>
        </div>

        {/* Widget body */}
        <div
          className="flex-1 flex flex-col p-0 overflow-hidden"
          style={{
            backgroundColor:
              widget.type === "STICKY"
                ? `${(widget.data as any)?.color || "#fef08a"}15`
                : "transparent",
          }}
        >
          {widget.type === "STICKY" ? (
            <>
              <textarea
                value={(widget.data as any)?.text ?? ""}
                onChange={(e) =>
                  onUpdateData(widget.id, { text: e.target.value })
                }
                onFocus={() => onFocus(widget.id)}
                placeholder="Type something..."
                className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-600 leading-relaxed scrollbar-hide"
                style={{
                  color: (widget.data as any)?.color || "#fef08a",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              {/* Color Bar for Sticky */}
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#ffffff"].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateData(widget.id, { color: c })}
                      className="w-4 h-4 rounded-full border border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ),
                )}
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center p-3 relative group/box"
              style={{
                border: `2px dashed ${(widget.data as any)?.color || "#3b82f6"}40`,
                backgroundColor: `${(widget.data as any)?.color || "#3b82f6"}08`,
              }}
            >
              <input
                value={(widget.data as any)?.label ?? "New Group"}
                onChange={(e) =>
                  onUpdateData(widget.id, { label: e.target.value })
                }
                onFocus={() => onFocus(widget.id)}
                className="bg-transparent text-center text-xs font-bold uppercase tracking-widest focus:outline-none placeholder:text-zinc-700"
                style={{ color: (widget.data as any)?.color || "#3b82f6" }}
              />

              {/* Controls for Box */}
              <div className="absolute bottom-2 flex gap-2 opacity-0 group-hover/box:opacity-100 transition-opacity">
                {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateData(widget.id, { color: c })}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resize Handles */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edges */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "s")}
          />
          <div
            className="absolute left-0 top-2 bottom-2 w-1 cursor-ew-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "w")}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-1 cursor-ew-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "e")}
          />

          {/* Corners */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize pointer-events-auto"
            onMouseDown={(e) => onResizeStart(e, "se")}
          />
        </div>
      </div>
    </motion.div>
  );
}

Widget.displayName = "Widget";
