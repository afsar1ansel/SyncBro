"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useVoice(roomId: string | undefined) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const joinVoice = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await api.post<{ success: boolean; token: string; serverUrl: string }>(
        `/api/rooms/${roomId}/livekit-token`
      );
      if (data.success) {
        setToken(data.token);
        setServerUrl(data.serverUrl);
        setIsJoined(true);
      }
    } catch (err) {
      console.error("Failed to join voice:", err);
    }
  }, [roomId]);

  const leaveVoice = useCallback(() => {
    setToken(null);
    setServerUrl(null);
    setIsJoined(false);
  }, []);

  return {
    token,
    serverUrl,
    isJoined,
    joinVoice,
    leaveVoice,
  };
}
