"use client";

import React, { useEffect, useState } from "react";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useCursors } from "@/hooks/useCursors";
import { useWidgets } from "@/hooks/useWidgets";
import { GhostCursor } from "./GhostCursor";
import { Widget } from "./Widget";
import { VoiceOrb } from "../voice/VoiceOrb";
import { VoiceBar } from "../voice/VoiceBar";
import { useRemoteParticipants, RoomAudioRenderer, useLocalParticipant } from "@livekit/components-react";
import { useSpatialAudio } from "@/hooks/useSpatialAudio";
import { MousePointer2, Square, StickyNote, MonitorUp, MonitorOff, Mic, MicOff } from "lucide-react";
import { useScreenShare } from "@/hooks/useScreenShare";
import { StreamWidget } from "./StreamWidget";

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
  onUpdateVolume
}: RoomCanvasProps) {
  const otherCursors = useCursors(roomId);
  const { widgets, placeWidget, moveWidget, focusWidget, updateWidgetData, removeWidget } = useWidgets(roomId);
  const [activeTool, setActiveTool] = React.useState<"select" | "box" | "sticky">("select");

  const handleCanvasClick = (worldX: number, worldY: number) => {
    if (activeTool === "box") {
      placeWidget(worldX - 100, worldY - 75, "STICKER", { label: "New Box" });
    } else if (activeTool === "sticky") {
      placeWidget(worldX - 125, worldY - 125, "STICKY", { text: "", color: "#fef08a" });
    }
  };

  return (
    <InfiniteCanvas 
      onCanvasClick={handleCanvasClick} 
      activeTool={activeTool}
      overlay={
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
                active={activeTool === "select"} 
                onClick={() => setActiveTool("select")} 
                icon={<MousePointer2 size={20} />} 
                label="Select" 
              />
              <ToolButton 
                active={activeTool === "box"} 
                onClick={() => setActiveTool("box")} 
                icon={<Square size={20} />} 
                label="Box" 
              />
              <ToolButton 
                active={activeTool === "sticky"} 
                onClick={() => setActiveTool("sticky")} 
                icon={<StickyNote size={20} />} 
                label="Sticky Note" 
              />
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* LiveKit / Media Section */}
            <LiveKitLayer 
              roomId={roomId}
              widgets={widgets}
              otherCursors={otherCursors}
              moveWidget={moveWidget}
              focusWidget={focusWidget}
              isMicEnabled={isMicEnabled}
              onToggleMic={onToggleMic}
              participantVolumes={participantVolumes}
              onUpdateVolume={onUpdateVolume}
            />
          </div>
        </div>
      }
    >
      {/* Widgets — rendered in world space inside the transformed container */}
      {widgets.map((widget) => (
        <Widget
          key={widget.id}
          widget={widget}
          onMove={moveWidget}
          onFocus={focusWidget}
          onUpdateData={updateWidgetData}
        />
      ))}

      {/* Other users' ghost cursors — also in world space */}
      {otherCursors.map((cursor) => (
        <GhostCursor
          key={cursor.userId}
          name={cursor.name}
          avatarUrl={cursor.avatarUrl}
          x={cursor.x}
          y={cursor.y}
        />
      ))}
    </InfiniteCanvas>
  );
}

function ToolButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  danger,
  success
}: { 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string,
  danger?: boolean,
  success?: boolean
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

// Refactored to handle both voice and screenshare
function LiveKitLayer({ 
  roomId,
  widgets,
  otherCursors,
  moveWidget,
  focusWidget,
  isMicEnabled,
  onToggleMic,
  participantVolumes,
  onUpdateVolume
}: { 
  roomId: string;
  widgets: any[];
  otherCursors: any[];
  moveWidget: any;
  focusWidget: any;
  isMicEnabled: boolean;
  onToggleMic: () => void;
  participantVolumes: Record<string, number>;
  onUpdateVolume: (userId: string, volume: number) => void;
}) {
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const { isScreenSharing, toggleScreenShare, mappedStreams } = useScreenShare(widgets);
  
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

  return (
    <>
      {/* Voice Orbs */}
      {remoteParticipants.map((p) => {
        const cursor = otherCursors.find((c) => c.userId === p.identity);
        if (!cursor) return null;
        return (
          <VoiceOrb
            key={p.sid}
            participant={p}
            x={cursor.x}
            y={cursor.y}
            volume={participantVolumes[p.identity] ?? 1}
            onVolumeChange={(v) => onUpdateVolume(p.identity, v)}
          />
        );
      })}

      {/* Screen Share Widgets (Live Tracks) */}
      {mappedStreams.map(({ trackReference, widget }) => {
        if (!widget) return null;
        return (
          <StreamWidget
            key={widget.id}
            widget={widget}
            trackReference={trackReference}
            onMove={moveWidget}
            onFocus={focusWidget}
          />
        );
      })}

      {/* Media Controls in Dock */}
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
          icon={isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
          label={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          success={isScreenSharing}
        />
      </div>

      <RoomAudioRenderer />
    </>
  );
}
