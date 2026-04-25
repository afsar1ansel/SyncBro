"use client";

import React from "react";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useCursors } from "@/hooks/useCursors";
import { useWidgets } from "@/hooks/useWidgets";
import { GhostCursor } from "./GhostCursor";
import { Widget } from "./Widget";
import { VoiceOrb } from "../voice/VoiceOrb";
import { VoiceBar } from "../voice/VoiceBar";
import { useRemoteParticipants } from "@livekit/components-react";
import { useSpatialAudio } from "@/hooks/useSpatialAudio";

interface RoomCanvasProps {
  roomId: string;
  isVoiceActive?: boolean;
  onLeaveVoice?: () => void;
}

export function RoomCanvas({ roomId, isVoiceActive, onLeaveVoice }: RoomCanvasProps) {
  const otherCursors = useCursors(roomId);
  const { widgets, placeWidget, moveWidget, focusWidget } = useWidgets(roomId);
  const remoteParticipants = useRemoteParticipants();

  // Enable spatial audio
  useSpatialAudio(remoteParticipants, otherCursors);

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

      {/* Voice Orbs — rendered in world space at participant cursor positions */}
      {isVoiceActive && remoteParticipants.map((p) => {
        const cursor = otherCursors.find(c => c.userId === p.identity);
        if (!cursor) return null;
        return (
          <VoiceOrb 
            key={p.sid} 
            participant={p} 
            x={cursor.x} 
            y={cursor.y} 
          />
        );
      })}

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

      {/* Voice controls */}
      {isVoiceActive && onLeaveVoice && <VoiceBar onLeave={onLeaveVoice} />}
    </InfiniteCanvas>
  );
}
