"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "@/lib/socket";
import { api } from "@/lib/api";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: string;
  sender: {
    name: string;
    avatarUrl?: string;
  };
}

export function useChat(roomId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      try {
        const data = await api.get<{ success: boolean; messages: ChatMessage[] }>(
          `/api/rooms/${roomId}/messages`
        );
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Socket listeners
  useEffect(() => {
    if (!roomId) return;
    const socket = socketService.getSocket();

    const onNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onUserTyping = ({ userId, name, isTyping }: { userId: string; name: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(userId, name);
        } else {
          next.delete(userId);
        }
        return next;
      });
    };

    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onUserTyping);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onUserTyping);
    };
  }, [roomId]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    socketService.getSocket().emit("send-message", { content });
  }, []);

  const emitTyping = useCallback((isTyping: boolean) => {
    socketService.getSocket().emit("typing", { isTyping });
  }, []);

  // Call this when user types
  const handleTyping = useCallback(() => {
    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1500);
  }, [emitTyping]);

  return {
    messages,
    sendMessage,
    typingUsers: Array.from(typingUsers.values()),
    handleTyping,
  };
}
