"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsSpeaking } from "@livekit/components-react";
import { Participant } from "livekit-client";
import { Volume2, VolumeX } from "lucide-react";

interface GhostCursorProps {
  name: string;
  avatarUrl?: string;
  x: number;
  y: number;
  color?: string;
  participant?: Participant;
  volume?: number;
  onVolumeChange?: (v: number) => void;
}

const COLORS = [
  "#60a5fa", // light blue
  "#34d399", // emerald
  "#fbbf24", // amber
  "#f87171", // red
  "#a78bfa", // violet
  "#f472b6", // pink
  "#22d3ee", // cyan
];

// Helper component to safely use the LiveKit hook
function SpeakingRings({ participant }: { participant: Participant }) {
  const isSpeaking = useIsSpeaking(participant);
  
  return (
    <AnimatePresence>
      {isSpeaking && (
        <>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.3 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute w-20 h-20 rounded-full bg-blue-500"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.5 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="absolute w-20 h-20 rounded-full bg-blue-400"
          />
        </>
      )}
    </AnimatePresence>
  );
}

export function GhostCursor({ 
  name, 
  avatarUrl, 
  x, 
  y, 
  color, 
  participant, 
  volume = 1, 
  onVolumeChange 
}: GhostCursorProps) {
  const userColor = color || COLORS[name.length % COLORS.length];

  // Apply volume to remote tracks if participant is provided
  useEffect(() => {
    if (participant) {
      participant.audioTrackPublications.forEach((pub) => {
        if (pub.track && 'setVolume' in pub.track) {
          (pub.track as any).setVolume(volume);
        }
      });
    }
  }, [volume, participant]);

  return (
    <motion.div
      className="absolute pointer-events-none z-50 group/cursor"
      initial={false}
      animate={{ x, y }}
      transition={{ type: "spring", damping: 35, stiffness: 250, mass: 0.5 }}
    >
      <div className="relative">
        {/* Modern Minimalist Cursor */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` }}
        >
          <path
            d="M5.5 3.5L5.5 20.5L10.5 15.5H18.5L5.5 3.5Z"
            fill={userColor}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Minimalist Circular Badge - Offset from tip */}
        <motion.div 
          initial={{ opacity: 0, x: 10, y: 10 }}
          animate={{ opacity: 1, x: 14, y: 14 }}
          className="absolute top-0 left-0 flex items-center justify-center"
        >
          {/* Speaking Rings - only rendered if participant exists */}
          {participant && <SpeakingRings participant={participant} />}

          {/* Avatar Badge */}
          <div 
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden bg-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative z-10"
            style={{ borderColor: userColor }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-black text-white leading-none">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Volume Control - appears on hover */}
          {participant && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/cursor:opacity-100 transition-opacity bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-2xl pointer-events-auto">
              {volume === 0 ? <VolumeX size={10} className="text-red-400" /> : <Volume2 size={10} className="text-blue-400" />}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-12 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
