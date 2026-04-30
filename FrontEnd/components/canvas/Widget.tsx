"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useCanvas } from "@/context/CanvasContext";
import type { WidgetData } from "@/hooks/useWidgets";
import { X, Palette, Type, Image as ImageIcon } from "lucide-react";

interface WidgetProps {
  widget: WidgetData;
  onMove: (
    widgetId: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  onDrag?: (x: number, y: number, w: number, h: number) => void;
  onFocus: (widgetId: string) => void;
  onUpdateData: (widgetId: string, data: any) => void;
  onRemove: (widgetId: string) => void;
}

export function Widget({
  widget,
  onMove,
  onDrag,
  onFocus,
  onUpdateData,
  onRemove,
}: WidgetProps) {
  const { zoom } = useCanvas();

  const isCutout = widget.type === "IMAGE";
  const isGiphy = isCutout; // Alias for clarity in body

  // Local motion values for buttery smooth movement without re-renders
  const mvX = useMotionValue(widget.x);
  const mvY = useMotionValue(widget.y);
  const mvW = useMotionValue(widget.width || 200);
  const mvH = useMotionValue(widget.height || 150);

  const scale = useTransform([mvW, mvH], ([w, h]) => {
    const baseW = widget.type === "STICKY" ? 250 : isGiphy ? 300 : 200;
    const baseH = widget.type === "STICKY" ? 250 : isGiphy ? 300 : 150;
    return Math.min((w as number) / baseW, (h as number) / baseH);
  });

  const btnSize = useTransform(scale, (s) => 24 * s);
  const btnInnerSize = useTransform(scale, (s) => 12 * s);
  const titleFontSize = useTransform(scale, (s) => 10 * s);
  const timeFontSize = useTransform(scale, (s) => 9 * s);
  const textFontSize = useTransform(scale, (s) => 14 * s);
  const inputFontSize = useTransform(scale, (s) => 12 * s);
  const paddingSize = useTransform(scale, (s) => 16 * s);

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const skipNextLayoutSync = useRef(false);
  const resizeDir = useRef<string | null>(null);
  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    worldX: 0,
    worldY: 0,
    worldW: 0,
    worldH: 0,
  });

  // Sync local motion values with global state when NOT interacting
  useEffect(() => {
    if (isDragging.current || isResizing.current) return;

    const nextWidth = widget.width || 200;
    const nextHeight = widget.height || 150;
    const alreadyAtNextLayout =
      Math.abs(mvX.get() - widget.x) <= 0.5 &&
      Math.abs(mvY.get() - widget.y) <= 0.5 &&
      Math.abs(mvW.get() - nextWidth) <= 0.5 &&
      Math.abs(mvH.get() - nextHeight) <= 0.5;

    if (skipNextLayoutSync.current && alreadyAtNextLayout) {
      skipNextLayoutSync.current = false;
      return;
    }

    skipNextLayoutSync.current = false;
    if (Math.abs(mvX.get() - widget.x) > 0.5) mvX.set(widget.x);
    if (Math.abs(mvY.get() - widget.y) > 0.5) mvY.set(widget.y);
    if (Math.abs(mvW.get() - nextWidth) > 0.5) mvW.set(nextWidth);
    if (Math.abs(mvH.get() - nextHeight) > 0.5) mvH.set(nextHeight);
  }, [widget.x, widget.y, widget.width, widget.height, mvX, mvY, mvW, mvH]);

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
        worldX: mvX.get(),
        worldY: mvY.get(),
        worldW: mvW.get(),
        worldH: mvH.get(),
      };

      onFocus(widget.id);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const dxScreen = moveEvent.clientX - dragStart.current.mouseX;
        const dyScreen = moveEvent.clientY - dragStart.current.mouseY;

        const WORKSPACE_SIZE = 5000;
        const newX = Math.max(
          0,
          Math.min(
            WORKSPACE_SIZE - mvW.get(),
            dragStart.current.worldX + dxScreen / zoom,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(
            WORKSPACE_SIZE - mvH.get(),
            dragStart.current.worldY + dyScreen / zoom,
          ),
        );

        // Update local motion values instantly (no re-render, no API)
        mvX.set(newX);
        mvY.set(newY);

        if (onDrag) {
          onDrag(newX, newY, mvW.get(), mvH.get());
        }
      };

      const onMouseUp = () => {
        if (isDragging.current) {
          skipNextLayoutSync.current = true;
          // Commit the final position to global state and API
          onMove(widget.id, mvX.get(), mvY.get(), mvW.get(), mvH.get());
          if (onDrag) onDrag(-1, -1, 0, 0); // Special value to indicate drag end
        }
        isDragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, zoom, onMove, onDrag, onFocus, mvX, mvY, mvW, mvH],
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
        worldX: mvX.get(),
        worldY: mvY.get(),
        worldW: mvW.get(),
        worldH: mvH.get(),
      };

      onFocus(widget.id);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const dxScreen = moveEvent.clientX - dragStart.current.mouseX;
        const dyScreen = moveEvent.clientY - dragStart.current.mouseY;

        const dxWorld = dxScreen / zoom;
        const dyWorld = dyScreen / zoom;

        const WORKSPACE_SIZE = 5000;
        let newX = dragStart.current.worldX;
        let newY = dragStart.current.worldY;
        let newW = dragStart.current.worldW;
        let newH = dragStart.current.worldH;

        if (dir.includes("e")) {
          newW = Math.max(100, dragStart.current.worldW + dxWorld);
          newW = Math.min(WORKSPACE_SIZE - newX, newW);
        }
        if (dir.includes("s")) {
          newH = Math.max(60, dragStart.current.worldH + dyWorld);
          newH = Math.min(WORKSPACE_SIZE - newY, newH);
        }
        if (dir.includes("w")) {
          const delta = Math.min(dragStart.current.worldW - 100, dxWorld);
          newX = Math.max(0, dragStart.current.worldX + delta);
          newW = dragStart.current.worldX + dragStart.current.worldW - newX;
        }
        if (dir.includes("n")) {
          const delta = Math.min(dragStart.current.worldH - 60, dyWorld);
          newY = Math.max(0, dragStart.current.worldY + delta);
          newH = dragStart.current.worldY + dragStart.current.worldH - newY;
        }

        // Update local motion values instantly
        mvX.set(newX);
        mvY.set(newY);
        mvW.set(newW);
        mvH.set(newH);
      };

      const onMouseUp = () => {
        if (isResizing.current) {
          skipNextLayoutSync.current = true;
          // Commit the final size to global state and API
          onMove(widget.id, mvX.get(), mvY.get(), mvW.get(), mvH.get());
        }
        isResizing.current = false;
        resizeDir.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, zoom, onMove, onFocus, mvX, mvY, mvW, mvH],
  );

  // Secondary safeguard: if a SCREENSHARE widget somehow gets here, don't render it.
  // SCREENSHARE is handled exclusively by StreamWidget.tsx
  if (widget.type === "SCREENSHARE") return null;

  return (
    <motion.div
      style={{
        position: "absolute",
        left: mvX,
        top: mvY,
        zIndex: widget.z,
        width: mvW,
        height: mvH,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onMouseDown={onMouseDown}
      className="group cursor-grab active:cursor-grabbing"
    >
      <div
        className={`w-full h-full rounded-2xl flex flex-col select-none relative overflow-visible transition-all duration-300 ${
          isCutout 
            ? "bg-transparent border-none shadow-none group-hover:bg-white/5" 
            : "border border-blue-500/30 bg-zinc-900/80 backdrop-blur-md shadow-xl"
        }`}
        style={!isCutout ? {
          boxShadow:
            "0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.4)",
        } : {}}
      >
        {/* Drag handle bar / Title Bar (Hidden for cutouts) */}
        {!isCutout && (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/90 border-b border-white/5 cursor-grab active:cursor-grabbing group/title"
            onMouseDown={onMouseDown}
          >
            <div className="flex gap-1.5 mr-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(widget.id);
                }}
                style={{ width: btnSize, height: btnSize }}
                className="rounded-full bg-red-500/40 hover:bg-red-500 transition-colors flex items-center justify-center group-hover/title:bg-red-500"
              >
                <motion.div style={{ width: btnInnerSize, height: btnInnerSize }} className="flex items-center justify-center">
                  <X className="w-full h-full text-white opacity-0 group-hover/title:opacity-100" />
                </motion.div>
              </motion.button>
              <motion.div style={{ width: btnSize, height: btnSize }} className="rounded-full bg-yellow-500/40" />
              <motion.div style={{ width: btnSize, height: btnSize }} className="rounded-full bg-green-500/40" />
            </div>

            <motion.span 
              style={{ fontSize: titleFontSize }}
              className="text-zinc-400 font-bold uppercase tracking-widest select-none flex items-center gap-2"
            >
              {widget.type === "STICKY" ? (
                <Type size={10} />
              ) : isGiphy ? (
                <ImageIcon size={10} />
              ) : (
                <Palette size={10} />
              )}
              {widget.type}
            </motion.span>
          </div>
        )}

        {/* Sticker Delete Button (Floating) */}
        {isCutout && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(widget.id);
            }}
            initial={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-auto"
          >
            <X size={16} />
          </motion.button>
        )}

        {/* Widget body */}
        <div
          className={`flex-1 flex flex-col p-0 overflow-hidden ${isCutout ? "overflow-visible" : ""}`}
          style={{
            backgroundColor:
              widget.type === "STICKY"
                ? `${(widget.data as any)?.color || "#fef08a"}15`
                : "transparent",
          }}
        >
          {widget.type === "STICKY" ? (
            <>
              <motion.textarea
                value={(widget.data as any)?.text ?? ""}
                onChange={(e) =>
                  onUpdateData(widget.id, { text: e.target.value })
                }
                onFocus={() => onFocus(widget.id)}
                placeholder="Type something..."
                className="w-full h-full bg-transparent resize-none focus:outline-none text-zinc-200 placeholder:text-zinc-600 leading-relaxed scrollbar-hide"
                style={{
                  color: (widget.data as any)?.color || "#fef08a",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: textFontSize,
                  padding: paddingSize,
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
          ) : isGiphy ? (
            <div className={`flex-1 w-full h-full flex items-center justify-center ${isCutout ? "" : "p-2"}`}>
              <img 
                src={(widget.data as any)?.url} 
                alt="Giphy Content" 
                className={`max-w-full max-h-full object-contain pointer-events-none ${isCutout ? "" : "rounded-xl"}`} 
              />
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center p-3 relative group/box"
              style={{
                border: `2px dashed ${(widget.data as any)?.color || "#3b82f6"}40`,
                backgroundColor: `${(widget.data as any)?.color || "#3b82f6"}08`,
              }}
            >
              <motion.input
                value={(widget.data as any)?.label ?? "New Group"}
                onChange={(e) =>
                  onUpdateData(widget.id, { label: e.target.value })
                }
                onFocus={() => onFocus(widget.id)}
                className="bg-transparent text-center font-bold uppercase tracking-widest focus:outline-none placeholder:text-zinc-700"
                style={{ 
                  color: (widget.data as any)?.color || "#3b82f6",
                  fontSize: inputFontSize,
                }}
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
