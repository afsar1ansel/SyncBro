"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useCanvas } from "@/context/CanvasContext";
import { useCursors } from "@/hooks/useCursors";
import { useWidgets } from "@/hooks/useWidgets";
import { GhostCursor } from "./GhostCursor";
import { Widget } from "./Widget";
import { VoiceOrb } from "../voice/VoiceOrb";
import { VoiceBar } from "../voice/VoiceBar";
import {
  useRemoteParticipants,
  RoomAudioRenderer,
  useLocalParticipant,
} from "@livekit/components-react";
import { useSpatialAudio } from "@/hooks/useSpatialAudio";
import {
  MousePointer2,
  Square,
  StickyNote,
  MonitorUp,
  MonitorOff,
  Mic,
  MicOff,
  Smile,
  Trash2,
} from "lucide-react";
import { useScreenShare } from "@/hooks/useScreenShare";
import { StreamWidget } from "./StreamWidget";
import { GiphyPicker } from "./GiphyPicker";

interface RoomCanvasProps {
  roomId: string;
  isMicEnabled: boolean;
  onToggleMic: () => void;
  participantVolumes: Record<string, number>;
  onUpdateVolume: (userId: string, volume: number) => void;
}

export function RoomCanvas({
  roomId,
  isMicEnabled,
  onToggleMic,
  participantVolumes,
  onUpdateVolume,
}: RoomCanvasProps) {
  const otherCursors = useCursors(roomId);
  const {
    widgets,
    placeWidget,
    moveWidget,
    focusWidget,
    updateWidgetData,
    removeWidget,
  } = useWidgets(roomId);
  const { screenToWorld, worldToScreen } = useCanvas();
  const [showGiphy, setShowGiphy] = useState(false);
  const [isDraggingNearTrash, setIsDraggingNearTrash] = useState(false);

  const handleWidgetDrag = useCallback((x: number, y: number, w: number, h: number) => {
    if (x === -1) {
      setIsDraggingNearTrash(false);
      return;
    }

    const trashScreenX = window.innerWidth - 80;
    const trashScreenY = window.innerHeight - 80;
    const widgetCenterScreen = worldToScreen(x + w / 2, y + h / 2);

    const dist = Math.sqrt(
      Math.pow(widgetCenterScreen.x - trashScreenX, 2) + 
      Math.pow(widgetCenterScreen.y - trashScreenY, 2)
    );

    setIsDraggingNearTrash(dist < 300); // Show when within 300px
  }, [worldToScreen]);

  const handleMoveWidget = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    setIsDraggingNearTrash(false);
    // Trash area is roughly at bottom-right corner
    const trashScreenX = window.innerWidth - 80;
    const trashScreenY = window.innerHeight - 80;

    // Convert widget center to screen coordinates
    const widgetCenterScreen = worldToScreen(x + w / 2, y + h / 2);

    // Check distance in screen pixels
    const dist = Math.sqrt(
      Math.pow(widgetCenterScreen.x - trashScreenX, 2) + 
      Math.pow(widgetCenterScreen.y - trashScreenY, 2)
    );

    if (dist < 60) {
      removeWidget(id);
    } else {
      moveWidget(id, x, y, w, h);
    }
  }, [worldToScreen, moveWidget, removeWidget]);

  const handleSpawnBox = () => {
    const center = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const WORKSPACE_SIZE = 5000;
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    
    const x = clamp(center.x - 100, 0, WORKSPACE_SIZE - 200);
    const y = clamp(center.y - 75, 0, WORKSPACE_SIZE - 150);
    placeWidget(x, y, "STICKER", { label: "New Box" });
  };

  const handleSpawnSticky = () => {
    const center = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const WORKSPACE_SIZE = 5000;
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    
    const x = clamp(center.x - 125, 0, WORKSPACE_SIZE - 250);
    const y = clamp(center.y - 125, 0, WORKSPACE_SIZE - 250);
    placeWidget(x, y, "STICKY", {
      text: "",
      color: "#fef08a",
    });
  };

  const handleSpawnGif = (url: string) => {
    const center = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const WORKSPACE_SIZE = 5000;
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    
    const x = clamp(center.x - 150, 0, WORKSPACE_SIZE - 300);
    const y = clamp(center.y - 150, 0, WORKSPACE_SIZE - 300);
    
    // Use "IMAGE" type which is supported by the server's WidgetType enum
    placeWidget(x, y, "IMAGE", {
      url: url
    });
    setShowGiphy(false);
  };

  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const { isScreenSharing, toggleScreenShare, mappedStreams } =
    useScreenShare(widgets);

  // Sync mic state with LiveKit local participant
  useEffect(() => {
    const syncMic = async () => {
      if (localParticipant) {
        try {
          await localParticipant.setMicrophoneEnabled(isMicEnabled);
        } catch (err) {
          console.error("Failed to sync mic state:", err);
        }
      }
    };
    syncMic();
  }, [isMicEnabled, localParticipant]);

  // Enable spatial audio
  useSpatialAudio(remoteParticipants, otherCursors);

  const handleCanvasClick = (worldX: number, worldY: number) => {
    // Widgets are placed directly via the dock options
  };

  return (
    <InfiniteCanvas
      onCanvasClick={handleCanvasClick}
      activeTool="select"
      overlay={
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none w-full max-w-fit">
            {/* Controls hint — floating above the dock */}
            <div className="flex items-center gap-6 text-[10px] text-zinc-500 font-medium tracking-wider uppercase bg-zinc-950/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-sm">
              <span className="flex items-center gap-2">
                <span className="text-zinc-400">Scroll</span> Zoom
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-800" />
              <span className="flex items-center gap-2">
                <span className="text-zinc-400">Space + Drag</span> Pan
              </span>
            </div>

            {/* Unified Dock */}
            <div className="flex items-center gap-2 p-2 rounded-[24px] bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
              {/* Tool Section */}
              <div className="flex items-center gap-1.5 px-1">
                <ToolButton
                  active={true}
                  onClick={() => {}}
                  icon={<MousePointer2 size={20} />}
                  label="Select"
                />
                <ToolButton
                  active={false}
                  onClick={handleSpawnBox}
                  icon={<Square size={20} />}
                  label="Box"
                />
                <ToolButton
                  active={false}
                  onClick={handleSpawnSticky}
                  icon={<StickyNote size={20} />}
                  label="Sticky Note"
                />
                <div className="relative flex items-center">
                  <ToolButton
                    active={showGiphy}
                    onClick={() => setShowGiphy(!showGiphy)}
                    icon={<Smile size={20} />}
                    label="GIFs"
                  />
                  {showGiphy && (
                    <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2">
                      <GiphyPicker onSelect={handleSpawnGif} />
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-white/10 mx-1" />

              {/* Media Controls */}
              <div className="flex items-center gap-1.5 px-1">
                <ToolButton
                  active={true}
                  onClick={onToggleMic}
                  icon={isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                  label={isMicEnabled ? "Mute Mic" : "Unmute Mic"}
                  danger={!isMicEnabled}
                  success={isMicEnabled}
                />
                <ToolButton
                  active={isScreenSharing}
                  onClick={toggleScreenShare}
                  icon={
                    isScreenSharing ? (
                      <MonitorOff size={20} />
                    ) : (
                      <MonitorUp size={20} />
                    )
                  }
                  label={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                  success={isScreenSharing}
                />
              </div>
            </div>
          </div>

          {/* Trash Zone */}
          <AnimatePresence>
            {isDraggingNearTrash && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                className="absolute bottom-8 right-8 pointer-events-auto"
              >
                <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500/50 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110 flex items-center justify-center group">
                  <Trash2 size={28} className="group-hover:animate-bounce" />
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                    Drop to Delete
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      }
    >
      {/* Widgets — rendered in world space inside the transformed container */}
      {widgets
        .filter((w) => w.type !== "SCREENSHARE")
        .map((widget) => (
          <Widget
            key={widget.id}
            widget={widget}
            onMove={handleMoveWidget}
            onDrag={handleWidgetDrag}
            onFocus={focusWidget}
            onUpdateData={updateWidgetData}
            onRemove={removeWidget}
          />
        ))}

      {/* Other users' ghost cursors — unified visuals & voice */}
      {otherCursors.map((cursor) => {
        const participant = remoteParticipants.find(
          (p) => p.identity === cursor.userId,
        );
        return (
          <GhostCursor
            key={cursor.userId}
            name={cursor.name}
            avatarUrl={cursor.avatarUrl}
            x={cursor.x}
            y={cursor.y}
            participant={participant}
            volume={participantVolumes[cursor.userId] ?? 1}
            onVolumeChange={(v) => onUpdateVolume(cursor.userId, v)}
          />
        );
      })}

      {/* Screen Share Widgets — rendered in world space */}
      {mappedStreams.map(({ trackReference, audioTrack, widget }) => {
        if (!widget) return null;
        return (
          <StreamWidget
            key={widget.id}
            widget={widget}
            trackReference={trackReference}
            audioTrack={audioTrack}
            onMove={handleMoveWidget}
            onDrag={handleWidgetDrag}
            onFocus={focusWidget}
            onRemove={removeWidget}
          />
        );
      })}

      <RoomAudioRenderer />
    </InfiniteCanvas>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  label,
  danger,
  success,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  success?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-3 rounded-2xl transition-all duration-200 flex items-center justify-center relative group ${
        active
          ? danger
            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
            : success
              ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
              : "bg-white text-black shadow-lg shadow-white/10"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {/* Tooltip on hover */}
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/5 shadow-xl">
        {label}
      </span>
    </button>
  );
}
