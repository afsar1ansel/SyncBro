"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

export function useLiveKit(roomId: string | undefined) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!roomId) return;
    try {
      setIsConnecting(true);
      const data = await api.post<{ success: boolean; token: string; serverUrl: string }>(
        `/api/rooms/${roomId}/livekit-token`
      );
      if (data.success) {
        setToken(data.token);
        setServerUrl(data.serverUrl);
      }
    } catch (err) {
      console.error("Failed to connect to LiveKit:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      connect();
    }
  }, [roomId, connect]);

  const disconnect = useCallback(() => {
    setToken(null);
    setServerUrl(null);
  }, []);

  return {
    token,
    serverUrl,
    isConnecting,
    connect,
    disconnect,
  };
}
