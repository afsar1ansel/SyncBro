"use client";

import { useEffect } from "react";
import { RemoteParticipant, Track } from "livekit-client";
import { useCanvas } from "@/context/CanvasContext";

const MAX_AUDIBLE_DISTANCE = 1200; // World units

export function useSpatialAudio(
  remoteParticipants: RemoteParticipant[],
  otherCursors: { userId: string; x: number; y: number }[],
  volumeMultipliers: Record<string, number> = {}
) {
  const { localWorldPos } = useCanvas();

  useEffect(() => {
    remoteParticipants.forEach((participant) => {
      const cursor = otherCursors.find((c) => c.userId === participant.identity);
      if (!cursor) return;

      const dx = localWorldPos.x - cursor.x;
      const dy = localWorldPos.y - cursor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Simple linear dropoff
      const spatialVolume = Math.max(0, 1 - distance / MAX_AUDIBLE_DISTANCE);
      
      // Apply manual multiplier (default 1.0)
      const multiplier = volumeMultipliers[participant.identity] ?? 1;
      const finalVolume = spatialVolume * multiplier;

      // Apply volume to all audio tracks of this participant
      participant.audioTrackPublications.forEach((pub) => {
        if (pub.track && pub.kind === Track.Kind.Audio) {
          (pub.track as any).setVolume(finalVolume);
        }
      });
    });
  }, [remoteParticipants, otherCursors, localWorldPos, volumeMultipliers]);
}
