"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocalParticipant, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { socketService } from "@/lib/socket";
import type { WidgetData } from "@/hooks/useWidgets";

export function useScreenShare(widgets: WidgetData[]) {
  const { localParticipant } = useLocalParticipant();
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Find remote screen share tracks (video and audio) and match them to widgets
  const screenTracks = useTracks(
    [Track.Source.ScreenShare, Track.Source.ScreenShareAudio], 
    { onlySubscribed: true }
  );

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const nextState = !localParticipant.isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(nextState, { audio: true });
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
  // We group by participant identity since a participant shares both video and audio
  const participantsSharing = Array.from(new Set(screenTracks.map(t => t.participant.identity)));
  
  const mappedStreams = participantsSharing.map((identity) => {
    const videoTrack = screenTracks.find(t => t.participant.identity === identity && t.source === Track.Source.ScreenShare);
    const audioTrack = screenTracks.find(t => t.participant.identity === identity && t.source === Track.Source.ScreenShareAudio);
    
    const widget = widgets.find(
      (w) => w.type === "SCREENSHARE" && (w.data as any)?.participantIdentity === identity
    );

    return {
      trackReference: videoTrack!, // The primary track for the widget is video
      audioTrack,
      widget,
    };
  }).filter(item => item.trackReference !== undefined);

  return {
    isScreenSharing,
    toggleScreenShare,
    mappedStreams,
  };
}
