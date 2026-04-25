"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParticipantInfo } from "@livekit/components-react";
import { Participant } from "livekit-client";

interface VoiceOrbProps {
  participant: Participant;
  x: number;
  y: number;
}

export function VoiceOrb({ participant, x, y }: VoiceOrbProps) {
  const { isSpeaking } = useParticipantInfo({ participant });

  return (
    <motion.div
      className="absolute pointer-events-none z-40"
      initial={false}
      animate={{ x, y }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
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
                className="absolute w-12 h-12 rounded-full bg-blue-500"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0.5 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="absolute w-12 h-12 rounded-full bg-blue-400"
              />
            </>
          )}
        </AnimatePresence>

        {/* Avatar Orb */}
        <div className={`w-12 h-12 rounded-full border-2 bg-zinc-900 flex items-center justify-center overflow-hidden shadow-lg transition-colors ${
          isSpeaking ? "border-blue-500 shadow-blue-500/50" : "border-white/10"
        }`}>
          {participant.identity.charAt(0).toUpperCase()}
        </div>
      </div>
    </motion.div>
  );
}
