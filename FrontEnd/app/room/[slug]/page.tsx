"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { CanvasProvider } from "@/context/CanvasContext";
import { RoomCanvas } from "@/components/canvas/RoomCanvas";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useChat } from "@/hooks/useChat";
import { useLiveKit } from "@/hooks/useLiveKit";
import { Loader2, Users, ArrowLeft, Share, Check, MessageSquare, Mic, MicOff, MonitorUp } from "lucide-react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  ownerId: string;
}

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { slug } = React.use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<"connecting" | "joined" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const socketRef = useRef(socketService.getSocket());

  // Chat hook
  const { messages, sendMessage, typingUsers, handleTyping } = useChat(room?.id);
  
  // LiveKit (Media) hook - connects automatically
  const { token, serverUrl } = useLiveKit(room?.id);
  
  // Local state for toggles (publishing tracks)
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  // Notification logic: track unread messages
  const prevMsgCount = useRef(messages.length);
  useEffect(() => {
    if (!isChatOpen && messages.length > prevMsgCount.current) {
      setHasUnread(true);
    }
    prevMsgCount.current = messages.length;
  }, [messages.length, isChatOpen]);

  // Clear unread when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setHasUnread(false);
    }
  }, [isChatOpen]);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Fetch room info from REST API
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchRoom = async () => {
      try {
        const data = await api.get<{ success: boolean; room: Room }>(`/api/rooms/${slug}`);
        if (data.success) {
          setRoom(data.room);
        }
      } catch (err: any) {
        setError(err.message || "Room not found or access denied.");
        setLoading(false);
      }
    };

    fetchRoom();
  }, [slug, user, authLoading, router]);

  // 2. Once we have the room, connect socket and join
  useEffect(() => {
    if (!room) return;
    const socket = socketRef.current;

    socketService.connect();

    const onRoomJoined = ({ roomId, role, onlineCount: count }: { roomId: string; role: string; onlineCount?: number }) => {
      console.log(`✅ Joined room ${roomId} as ${role}`);
      setSocketStatus("joined");
      if (count) setOnlineCount(count);
      setLoading(false);
    };

    const onError = ({ message }: { message: string }) => {
      setError(message);
      setSocketStatus("error");
      setLoading(false);
    };

    const onUserJoined = ({ onlineCount: count }: { onlineCount?: number }) => {
      if (count) {
        setOnlineCount(count);
      } else {
        setOnlineCount((c) => c + 1);
      }
    };

    const onUserLeft = ({ onlineCount: count }: { onlineCount?: number }) => {
      if (count) {
        setOnlineCount(count);
      } else {
        setOnlineCount((c) => Math.max(1, c - 1));
      }
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("error", onError);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);

    // If already connected, emit immediately; otherwise wait for connect event
    const emitJoin = () => socket.emit("join-room", { roomId: room.id });

    if (socket.connected) {
      emitJoin();
    } else {
      socket.once("connect", emitJoin);
    }

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("error", onError);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("connect", emitJoin);
      socketService.disconnect();
    };
  }, [room]);

  // ── Loading screen ─────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 flex-col gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-zinc-400 text-sm">
          {socketStatus === "connecting" ? "Connecting to room..." : "Loading..."}
        </p>
      </div>
    );
  }

  // ── Error screen ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 flex-col gap-4 text-center p-8">
        <div className="text-4xl">🚫</div>
        <h2 className="text-2xl font-bold text-white">Cannot join room</h2>
        <p className="text-zinc-400 max-w-sm">{error}</p>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Main room view ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* Top navigation bar */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-sm font-semibold text-white">{room?.name}</span>
          <span className="text-xs text-zinc-600 font-mono">/{slug}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Online indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <Users size={12} />
            <span>{onlineCount} online</span>
          </div>

          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            {copied ? <Check size={14} /> : <Share size={14} />}
            {copied ? "Copied!" : "Invite Friends"}
          </button>

          {/* Socket status badge */}
          <div
            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              socketStatus === "joined"
                ? "bg-green-500/10 text-green-400"
                : socketStatus === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {socketStatus === "joined" ? "Live" : socketStatus === "error" ? "Error" : "Connecting"}
          </div>

          {/* Chat Toggle Button */}
          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors relative ${
              isChatOpen
                ? "bg-blue-500/20 text-blue-400"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare size={18} />
            {hasUnread && !isChatOpen && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Canvas area */}
      <main className="flex-1 relative overflow-hidden">
        <CanvasProvider>
          {token && serverUrl && room ? (
            <LiveKitRoom
              token={token}
              serverUrl={serverUrl}
              connect={true}
              audio={false}
              video={false}
              className="w-full h-full"
            >
              <RoomCanvas roomId={room.id} isMicEnabled={isMicEnabled} onToggleMic={() => setIsMicEnabled(!isMicEnabled)} />
            </LiveKitRoom>
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-950 flex-col gap-4">
              <Loader2 className="animate-spin text-blue-500/50" size={32} />
              <p className="text-zinc-600 text-xs">Initializing Media Engine...</p>
            </div>
          )}
        </CanvasProvider>
      </main>

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        sendMessage={sendMessage}
        typingUsers={typingUsers}
        handleTyping={handleTyping}
      />
    </div>
  );
}
