"use client";

import React from "react";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useCursors } from "@/hooks/useCursors";
import { useWidgets } from "@/hooks/useWidgets";
import { GhostCursor } from "./GhostCursor";
import { Widget } from "./Widget";
import { VoiceOrb } from "../voice/VoiceOrb";
import { VoiceBar } from "../voice/VoiceBar";
import { useRemoteParticipants, RoomAudioRenderer } from "@livekit/components-react";
import { useSpatialAudio } from "@/hooks/useSpatialAudio";
import { MousePointer2, Square, StickyNote } from "lucide-react";

interface RoomCanvasProps {
  roomId: string;
  isVoiceActive?: boolean;
  onLeaveVoice?: () => void;
}

export function RoomCanvas({ roomId, isVoiceActive, onLeaveVoice }: RoomCanvasProps) {
  const otherCursors = useCursors(roomId);
  const { widgets, placeWidget, moveWidget, focusWidget, updateWidgetData } = useWidgets(roomId);
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
        <div className="absolute bottom-8 left-8 flex flex-col gap-4 pointer-events-none">
          {/* Controls hint moved here to be part of the "text" in bottom left */}
          <div className="flex flex-col gap-1 text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
            <span className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Scroll</span> Zoom
            </span>
            <span className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Space + Drag</span> Pan
            </span>
          </div>

          {/* Floating Toolbar */}
          <div className="flex flex-row gap-2 p-1.5 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto">
            <ToolButton 
              active={activeTool === "select"} 
              onClick={() => setActiveTool("select")} 
              icon={<MousePointer2 size={20} />} 
              label="Select" 
            />
            <div className="w-px h-8 bg-white/5 my-auto" />
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

      {/* Voice Layer — only rendered when voice is active and inside LiveKitRoom */}
      {isVoiceActive && (
        <VoiceLayer otherCursors={otherCursors} onLeaveVoice={onLeaveVoice} />
      )}

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

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
    </button>
  );
}

// Separate component to safely use LiveKit hooks only when in a Room context
function VoiceLayer({ 
  otherCursors, 
  onLeaveVoice 
}: { 
  otherCursors: any[], 
  onLeaveVoice?: () => void 
}) {
  const remoteParticipants = useRemoteParticipants();
  
  // Enable spatial audio
  useSpatialAudio(remoteParticipants, otherCursors);

  return (
    <>
      {remoteParticipants.map((p) => {
        const cursor = otherCursors.find((c) => c.userId === p.identity);
        if (!cursor) return null;
        return (
          <VoiceOrb
            key={p.sid}
            participant={p}
            x={cursor.x}
            y={cursor.y}
          />
        );
      })}
      {onLeaveVoice && <VoiceBar onLeave={onLeaveVoice} />}
      <RoomAudioRenderer />
    </>
  );
}
