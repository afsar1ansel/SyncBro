"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsSpeaking } from "@livekit/components-react";
import { Participant } from "livekit-client";
import { Volume2, VolumeX } from "lucide-react";

interface VoiceOrbProps {
  participant: Participant;
  x: number;
  y: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function VoiceOrb({ participant, x, y, volume, onVolumeChange }: VoiceOrbProps) {
  const isSpeaking = useIsSpeaking(participant);

  // Apply volume to remote tracks
  useEffect(() => {
    participant.audioTrackPublications.forEach((pub) => {
      if (pub.track && 'setVolume' in pub.track) {
        (pub.track as any).setVolume(volume);
      }
    });
  }, [volume, participant]);

  return (
    <motion.div
      className="absolute pointer-events-auto z-40 group/orb"
      initial={false}
      animate={{ 
        x: x + 32, 
        y: y + 30 
      }}
      transition={{ type: "spring", damping: 35, stiffness: 250, mass: 0.5 }}
    >
      <div className="relative flex items-center justify-center">
        {/* Speaking Rings */}
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

        {/* Central invisible anchor for speaking rings */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center pointer-events-none" />

        {/* Volume Slider Popover */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/orb:opacity-100 transition-opacity bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xl pointer-events-auto">
          {volume === 0 ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} className="text-blue-400" />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-white/50 w-6 font-mono">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
