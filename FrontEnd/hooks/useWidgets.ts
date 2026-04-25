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
  width: number;
  height: number;
  data?: { label?: string } | null;
}

export function useWidgets(roomId: string) {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);

  // Place a new widget at world coordinates
  const placeWidget = useCallback((x: number, y: number, type: string = "STICKER", data: any = null) => {
    socketService.getSocket().emit("widget-placed", { x, y, type, data });
  }, []);

  // Update specific data of a widget (like text in a sticky)
  const updateWidgetData = useCallback((widgetId: string, data: any) => {
    socketService.getSocket().emit("widget-data-updated", { widgetId, data });
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, data: { ...w.data, ...data } } : w))
    );
  }, []);

  // Move or Resize a widget
  const moveWidget = useCallback((widgetId: string, x: number, y: number, width: number, height: number) => {
    socketService.getSocket().emit("widget-moved", { widgetId, x, y, width, height });
    // Optimistic update — apply locally immediately
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, x, y, width, height } : w))
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

    // A widget was moved or resized by another user
    const onWidgetMoved = ({ widgetId, x, y, width, height }: { widgetId: string; x: number; y: number; width: number; height: number }) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, x, y, width, height } : w))
      );
    };

    // A widget z-index was updated
    const onWidgetFocused = ({ widgetId, z }: { widgetId: string; z: number }) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, z } : w))
      );
    };

    // A widget's data was updated
    const onWidgetDataUpdated = ({ widgetId, data }: { widgetId: string; data: any }) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, data: { ...w.data, ...data } } : w))
      );
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("widget-added", onWidgetAdded);
    socket.on("widget-moved", onWidgetMoved);
    socket.on("widget-focused", onWidgetFocused);
    socket.on("widget-data-updated", onWidgetDataUpdated);

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("widget-added", onWidgetAdded);
      socket.off("widget-moved", onWidgetMoved);
      socket.off("widget-focused", onWidgetFocused);
      socket.off("widget-data-updated", onWidgetDataUpdated);
    };
  }, [roomId]);

  return { widgets, placeWidget, moveWidget, focusWidget, updateWidgetData };
}
