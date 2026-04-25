"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useCanvas } from "@/context/CanvasContext";
import { VideoTrack } from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-react";
import type { WidgetData } from "@/hooks/useWidgets";
import { Maximize2, Monitor, X } from "lucide-react";

interface StreamWidgetProps {
  widget: WidgetData;
  trackReference: TrackReference;
  onMove: (widgetId: string, x: number, y: number, w: number, h: number) => void;
  onFocus: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
}

export function StreamWidget({ widget, trackReference, onMove, onFocus, onRemove }: StreamWidgetProps) {
  const { zoom } = useCanvas();
  const containerRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, worldX: 0, worldY: 0, worldW: 0, worldH: 0 });
  const lastEmitTime = useRef(0);
  const DRAG_THROTTLE = 33;

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
        worldW: widget.width || 640,
        worldH: widget.height || 400,
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
    [widget.id, widget.x, widget.y, zoom, onMove, onFocus]
  );

  const onResizeStart = useCallback(
    (e: React.MouseEvent, dir: string) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing.current = true;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        worldX: widget.x,
        worldY: widget.y,
        worldW: widget.width || 640,
        worldH: widget.height || 400,
      };

      onFocus(widget.id);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const now = Date.now();
        const dxScreen = moveEvent.clientX - dragStart.current.mouseX;
        const dyScreen = moveEvent.clientY - dragStart.current.mouseY;

        const dxWorld = dxScreen / zoom;
        const dyWorld = dyScreen / zoom;

        let newW = Math.max(200, dragStart.current.worldW + dxWorld);
        let newH = Math.max(150, dragStart.current.worldH + dyWorld);

        if (now - lastEmitTime.current > DRAG_THROTTLE) {
          onMove(widget.id, widget.x, widget.y, newW, newH);
          lastEmitTime.current = now;
        }
      };

      const onMouseUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, widget.x, widget.y, zoom, onMove, onFocus]
  );

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: "absolute",
        left: widget.x,
        top: widget.y,
        zIndex: widget.z,
        width: widget.width || 640,
        height: widget.height || 400,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseDown={onMouseDown}
      className="group"
    >
      <div className="w-full h-full rounded-2xl border border-white/10 bg-black overflow-hidden shadow-2xl flex flex-col relative">
        {/* Header / Title Bar */}
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800/90 border-b border-white/5 cursor-grab active:cursor-grabbing group/title"
          onMouseDown={onMouseDown}
        >
          <div className="flex gap-1.5 mr-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
              className="h-3 w-3 rounded-full bg-red-500/40 hover:bg-red-500 transition-colors flex items-center justify-center group-hover/title:bg-red-500"
            >
              <X size={8} className="text-white opacity-0 group-hover/title:opacity-100" />
            </button>
            <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
            <div className="h-3 w-3 rounded-full bg-green-500/40" />
          </div>

          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 select-none">
            <Monitor size={12} className="text-blue-500" />
            {trackReference.participant.name || "Anonymous"}'s Screen
          </span>
          
          <div className="ml-auto flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Video Body */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center relative group/video">
          <VideoTrack 
            trackRef={trackReference} 
            className="w-full h-full object-contain"
          />
          
          {/* Overlay info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none p-4 flex flex-col justify-end">
            <p className="text-xs text-white/70 font-medium">Live Streaming via LiveKit SFU</p>
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => onResizeStart(e, "se")}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
        </div>
      </div>
    </motion.div>
  );
}
