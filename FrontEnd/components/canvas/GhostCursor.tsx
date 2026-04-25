"use client";

import React from "react";
import { motion } from "framer-motion";

interface GhostCursorProps {
  name: string;
  avatarUrl?: string;
  x: number;
  y: number;
  color?: string;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function GhostCursor({ name, avatarUrl, x, y, color }: GhostCursorProps) {
  // Simple hash to pick a consistent color for the user
  const userColor = color || COLORS[name.length % COLORS.length];

  return (
    <motion.div
      className="absolute pointer-events-none z-50 flex flex-col items-start"
      initial={false}
      animate={{ x, y }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
    >
      {/* Cursor Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={userColor}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* Label */}
      <div 
        className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded-full border shadow-lg backdrop-blur-sm"
        style={{ 
          backgroundColor: `${userColor}20`, 
          borderColor: `${userColor}40` 
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-4 h-4 rounded-full border border-white/20" />
        ) : (
          <div 
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: userColor }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-[10px] font-semibold text-white whitespace-nowrap">
          {name}
        </span>
      </div>
    </motion.div>
  );
}
