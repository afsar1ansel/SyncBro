"use client";

import { useEffect, useState, useCallback } from "react";
import { socketService } from "@/lib/socket";

export interface WidgetData {
  id: string;
  roomId: string;
  type: string;
  x: number;
  y: number;
  z: number;
  data?: { label?: string } | null;
}

export function useWidgets(roomId: string) {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);

  // Place a new widget at world coordinates
  const placeWidget = useCallback((x: number, y: number) => {
    socketService.getSocket().emit("widget-placed", { x, y });
  }, []);

  // Move a widget (called during drag)
  const moveWidget = useCallback((widgetId: string, x: number, y: number) => {
    socketService.getSocket().emit("widget-moved", { widgetId, x, y });
    // Optimistic update — apply locally immediately
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, x, y } : w))
    );
  }, []);

  // Bring widget to front
  const focusWidget = useCallback((widgetId: string) => {
    socketService.getSocket().emit("widget-focused", { widgetId });
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket();

    // Receive initial widgets when joining a room
    const onRoomJoined = ({ widgets: initialWidgets }: { widgets: WidgetData[] }) => {
      setWidgets(initialWidgets || []);
    };

    // A new widget was placed by anyone (including ourselves)
    const onWidgetAdded = ({ widget }: { widget: WidgetData }) => {
      setWidgets((prev) => {
        // Avoid duplicates
        if (prev.find((w) => w.id === widget.id)) return prev;
        return [...prev, widget];
      });
    };

    // A widget was moved by another user
    const onWidgetMoved = ({ widgetId, x, y }: { widgetId: string; x: number; y: number }) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, x, y } : w))
      );
    };

    // A widget z-index was updated
    const onWidgetFocused = ({ widgetId, z }: { widgetId: string; z: number }) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, z } : w))
      );
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("widget-added", onWidgetAdded);
    socket.on("widget-moved", onWidgetMoved);
    socket.on("widget-focused", onWidgetFocused);

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("widget-added", onWidgetAdded);
      socket.off("widget-moved", onWidgetMoved);
      socket.off("widget-focused", onWidgetFocused);
    };
  }, [roomId]);

  return { widgets, placeWidget, moveWidget, focusWidget };
}
