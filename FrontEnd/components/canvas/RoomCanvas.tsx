"use client";

import React from "react";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useCursors } from "@/hooks/useCursors";
import { useWidgets } from "@/hooks/useWidgets";
import { GhostCursor } from "./GhostCursor";
import { Widget } from "./Widget";

interface RoomCanvasProps {
  roomId: string;
}

export function RoomCanvas({ roomId }: RoomCanvasProps) {
  const otherCursors = useCursors(roomId);
  const { widgets, placeWidget, moveWidget, focusWidget } = useWidgets(roomId);

  const handleCanvasClick = (worldX: number, worldY: number) => {
    // Center the widget on the click point
    placeWidget(worldX - 80, worldY - 50);
  };

  return (
    <InfiniteCanvas onCanvasClick={handleCanvasClick}>
      {/* Widgets — rendered in world space inside the transformed container */}
      {widgets.map((widget) => (
        <Widget
          key={widget.id}
          widget={widget}
          onMove={moveWidget}
          onFocus={focusWidget}
        />
      ))}

      {/* Other users' ghost cursors — also in world space */}
      {otherCursors.map((cursor) => (
        <GhostCursor
          key={cursor.userId}
          name={cursor.name}
          avatarUrl={cursor.avatarUrl}
          x={cursor.x}
          y={cursor.y}
        />
      ))}
    </InfiniteCanvas>
  );
}
