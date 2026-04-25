"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface PanOffset {
  x: number;
  y: number;
}

interface CanvasContextType {
  panOffset: PanOffset;
  zoom: number;
  maxZ: number;
  setPanOffset: React.Dispatch<React.SetStateAction<PanOffset>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  worldToScreen: (worldX: number, worldY: number) => { x: number; y: number };
  bringToFront: () => number;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const maxZRef = useRef(0);
  const [maxZ, setMaxZ] = useState(0);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => ({
      x: (screenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom,
    }),
    [panOffset, zoom]
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => ({
      x: worldX * zoom + panOffset.x,
      y: worldY * zoom + panOffset.y,
    }),
    [panOffset, zoom]
  );

  const bringToFront = useCallback(() => {
    maxZRef.current += 1;
    setMaxZ(maxZRef.current);
    return maxZRef.current;
  }, []);

  return (
    <CanvasContext.Provider
      value={{
        panOffset,
        zoom,
        maxZ,
        setPanOffset,
        setZoom,
        screenToWorld,
        worldToScreen,
        bringToFront,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}
