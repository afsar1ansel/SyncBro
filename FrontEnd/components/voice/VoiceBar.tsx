"use client";

import React from "react";
import { Mic, MicOff, PhoneOff, Users } from "lucide-react";
import { useLocalParticipant } from "@livekit/components-react";

interface VoiceBarProps {
  onLeave: () => void;
}

export function VoiceBar({ onLeave }: VoiceBarProps) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50">
      <div className="flex items-center gap-3 pr-4 border-r border-white/10 text-zinc-400">
        <Users size={18} />
        <span className="text-sm font-medium">Voice Active</span>
      </div>

      <button
        onClick={toggleMic}
        className={`p-2.5 rounded-full transition-all ${
          isMicrophoneEnabled
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
        }`}
      >
        {isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      <button
        onClick={onLeave}
        className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
