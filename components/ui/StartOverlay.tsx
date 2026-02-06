"use client";

import { useCallback } from "react";
import { useGameStore } from "../providers/GameStoreProvider";

export default function StartOverlay() {
  const locked = useGameStore((state) => state.locked);
  const controls = useGameStore((state) => state.controls);

  const handleStart = useCallback(() => {
    if (controls) {
      controls.lock();
      return;
    }
    const canvas = document.querySelector("canvas");
    if (canvas && "requestPointerLock" in canvas) {
      (canvas as HTMLCanvasElement).requestPointerLock();
    }
  }, [controls]);

  if (locked) return null;

  return (
    <div className="start-overlay">
      <div>
        <h1>SkyRealms Chronicles</h1>
        <p>
          The floating archipelago of Skyreach stirs awake. Harness the ancient
          Resonance Crystals, glide across etheric bridges, and restore balance
          to this shard of Hytale&apos;s dreamscape.
        </p>
        <button type="button" onClick={handleStart}>
          Enter Skyreach
        </button>
      </div>
    </div>
  );
}
