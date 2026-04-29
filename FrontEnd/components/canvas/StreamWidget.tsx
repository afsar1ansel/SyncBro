"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useCanvas } from "@/context/CanvasContext";
import { VideoTrack } from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-react";
import type { WidgetData } from "@/hooks/useWidgets";
import { Maximize2, Monitor, X, Volume2, VolumeX } from "lucide-react";

interface StreamWidgetProps {
  widget: WidgetData;
  trackReference: TrackReference;
  audioTrack?: TrackReference;
  onMove: (
    widgetId: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  onFocus: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
}

export function StreamWidget({
  widget,
  trackReference,
  audioTrack,
  onMove,
  onFocus,
  onRemove,
}: StreamWidgetProps) {
  const { zoom } = useCanvas();
  const containerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = React.useState(1);

  // Local motion values for smooth interaction
  const mvX = useMotionValue(widget.x);
  const mvY = useMotionValue(widget.y);
  const mvW = useMotionValue(widget.width || 640);
  const mvH = useMotionValue(widget.height || 400);

  const scale = useTransform([mvW, mvH], ([w, h]) => {
    return Math.min((w as number) / 640, (h as number) / 400);
  });

  const btnSize = useTransform(scale, (s) => 12 * s);
  const btnInnerSize = useTransform(scale, (s) => 8 * s);
  const titleFontSize = useTransform(scale, (s) => 10 * s);
  const iconSize = useTransform(scale, (s) => 12 * s);

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const skipNextLayoutSync = useRef(false);
  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    worldX: 0,
    worldY: 0,
    worldW: 0,
    worldH: 0,
  });

  // Sync motion values with props when the widget is not being manipulated locally.
  useEffect(() => {
    if (isDragging.current || isResizing.current) return;

    const nextWidth = widget.width || 640;
    const nextHeight = widget.height || 400;
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

        mvX.set(newX);
        mvY.set(newY);
      };

      const onMouseUp = () => {
        if (isDragging.current) {
          skipNextLayoutSync.current = true;
          onMove(widget.id, mvX.get(), mvY.get(), mvW.get(), mvH.get());
        }
        isDragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, zoom, onMove, onFocus, mvX, mvY, mvW, mvH],
  );

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing.current = true;
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
        let newW = Math.max(200, dragStart.current.worldW + dxWorld);
        let newH = Math.max(150, dragStart.current.worldH + dyWorld);

        newW = Math.min(WORKSPACE_SIZE - mvX.get(), newW);
        newH = Math.min(WORKSPACE_SIZE - mvY.get(), newH);

        mvW.set(newW);
        mvH.set(newH);
      };

      const onMouseUp = () => {
        if (isResizing.current) {
          skipNextLayoutSync.current = true;
          onMove(widget.id, mvX.get(), mvY.get(), mvW.get(), mvH.get());
        }
        isResizing.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [widget.id, zoom, onMove, onFocus, mvX, mvY, mvW, mvH],
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioTrack?.publication?.track) {
      (audioTrack.publication.track as any).setVolume(newVol);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: "absolute",
        left: mvX,
        top: mvY,
        zIndex: widget.z,
        width: mvW,
        height: mvH,
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
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(widget.id);
              }}
              style={{ width: btnSize, height: btnSize }}
              className="rounded-full bg-red-500/40 hover:bg-red-500 transition-colors flex items-center justify-center group-hover/title:bg-red-500"
            >
              <X
                style={{ width: btnInnerSize, height: btnInnerSize }}
                className="text-white opacity-0 group-hover/title:opacity-100"
              />
            </motion.button>
            <motion.div style={{ width: btnSize, height: btnSize }} className="rounded-full bg-yellow-500/40" />
            <motion.div style={{ width: btnSize, height: btnSize }} className="rounded-full bg-green-500/40" />
          </div>

          <motion.span 
            style={{ fontSize: titleFontSize }}
            className="font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 select-none"
          >
            <Monitor style={{ width: iconSize, height: iconSize }} className="text-blue-500" />
            {trackReference.participant.name || "Anonymous"}'s Screen
            {audioTrack ? (
              <div
                className="flex items-center gap-2 ml-2 bg-black/40 px-2 py-0.5 rounded-full border border-white/5 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Volume2 size={10} className="text-green-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-12 h-1 accent-green-500 cursor-pointer"
                />
              </div>
            ) : (
              <VolumeX size={10} className="text-zinc-600" />
            )}
          </motion.span>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
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
            <p className="text-xs text-white/70 font-medium">
              Live Streaming via LiveKit SFU
            </p>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={onResizeStart}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
        </div>
      </div>
    </motion.div>
  );
}

StreamWidget.displayName = "StreamWidget";
