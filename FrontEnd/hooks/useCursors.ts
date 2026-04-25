"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "@/lib/socket";
import { useCanvas } from "@/context/CanvasContext";

export interface CursorData {
  userId: string;
  name: string;
  avatarUrl?: string;
  x: number;
  y: number;
}

export function useCursors(roomId: string) {
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const { screenToWorld } = useCanvas();
  const lastEmitTime = useRef(0);
  const EMIT_THROTTLE = 33; // ~30fps

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - lastEmitTime.current < EMIT_THROTTLE) return;

    // We need the world coordinates for the canvas
    // Note: This hook assumes it's used within a CanvasProvider
    const world = screenToWorld(e.clientX, e.clientY);
    
    socketService.getSocket().emit("cursor-move", {
      x: world.x,
      y: world.y
    });

    lastEmitTime.current = now;
  }, [screenToWorld]);

  useEffect(() => {
    const socket = socketService.getSocket();

    const onCursorUpdate = (data: CursorData) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    };

    const onUserLeft = ({ userId }: { userId: string }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("cursor-update", onCursorUpdate);
    socket.on("user-left", onUserLeft);

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      socket.off("cursor-update", onCursorUpdate);
      socket.off("user-left", onUserLeft);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return Array.from(cursors.values());
}
