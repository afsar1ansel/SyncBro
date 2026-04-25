"use client";

import React, { useRef, useEffect, useCallback, ReactNode } from "react";
import { useCanvas } from "@/context/CanvasContext";

interface InfiniteCanvasProps {
  children?: ReactNode;
  onCanvasClick?: (worldX: number, worldY: number) => void;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const ZOOM_SENSITIVITY = 0.001;

export function InfiniteCanvas({ children, onCanvasClick }: InfiniteCanvasProps) {
  const { panOffset, zoom, setPanOffset, setZoom, screenToWorld } = useCanvas();

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const didPan = useRef(false); // tracks if we actually moved while panning

  // ── Pan: Middle-click drag OR Space + left-click drag ──────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1;
    const isSpacePan = e.button === 0 && e.currentTarget.dataset.spaceheld === "true";

    if (isMiddleClick || isSpacePan) {
      e.preventDefault();
      isPanning.current = true;
      didPan.current = false;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) didPan.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    [setPanOffset]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning.current) {
        isPanning.current = false;
        return; // don't treat a pan-release as a click
      }

      // Left click on the canvas background (not a widget) → fire onCanvasClick
      if (e.button === 0 && e.target === containerRef.current && onCanvasClick) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = screenToWorld(screenX, screenY);
        onCanvasClick(world.x, world.y);
      }
    },
    [onCanvasClick, screenToWorld]
  );

  // ── Zoom: scroll wheel centered on cursor ──────────────────────────────
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * (1 + delta)));

        // Adjust pan so the point under the cursor stays fixed
        setPanOffset((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom),
        }));

        return newZoom;
      });
    },
    [setZoom, setPanOffset]
  );

  // Attach wheel as non-passive so we can preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ── Space-key panning support ─────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        el.dataset.spaceheld = "true";
        el.style.cursor = "grab";
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        el.dataset.spaceheld = "false";
        el.style.cursor = "crosshair";
        isPanning.current = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-950 select-none"
      style={{ cursor: "crosshair" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { isPanning.current = false; }}
    >
      {/* Dot-grid background that moves with pan/zoom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${panOffset.x % (30 * zoom)}px ${panOffset.y % (30 * zoom)}px`,
          opacity: 0.6,
        }}
      />

      {/* World transform container – everything placed in world coords lives here */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "0 0",
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          willChange: "transform",
        }}
      >
        {children}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 font-mono pointer-events-none select-none backdrop-blur-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-[10px] text-zinc-600 pointer-events-none select-none">
        <span>Scroll to zoom</span>
        <span>·</span>
        <span>Middle-click drag to pan</span>
        <span>·</span>
        <span>Space + drag to pan</span>
      </div>
    </div>
  );
}
