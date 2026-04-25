"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocalParticipant, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { socketService } from "@/lib/socket";
import type { WidgetData } from "@/hooks/useWidgets";

export function useScreenShare(widgets: WidgetData[]) {
  const { localParticipant } = useLocalParticipant();
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Find remote screen share tracks and match them to widgets
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: true });

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const nextState = !localParticipant.isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);

      if (nextState) {
        // Notify socket that we started sharing
        socketService.getSocket().emit("screen-share-started", {
          identity: localParticipant.identity,
        });
      } else {
        // Notify socket that we stopped
        socketService.getSocket().emit("screen-share-stopped");
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
      setIsScreenSharing(false);
    }
  }, [localParticipant]);

  // Clean up if unmounted or disconnected
  useEffect(() => {
    return () => {
      if (isScreenSharing) {
        socketService.getSocket().emit("screen-share-stopped");
      }
    };
  }, [isScreenSharing]);

  // Map tracks to their corresponding widgets
  const mappedStreams = screenTracks.map((trackReference) => {
    const participantIdentity = trackReference.participant.identity;
    const widget = widgets.find(
      (w) => w.type === "SCREENSHARE" && (w.data as any)?.participantIdentity === participantIdentity
    );
    return {
      trackReference,
      widget,
    };
  });

  return {
    isScreenSharing,
    toggleScreenShare,
    mappedStreams,
  };
}
