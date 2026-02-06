"use client";

import { useMemo } from "react";
import { useGameStore } from "../providers/GameStoreProvider";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function HeadsUpDisplay() {
  const health = useGameStore((state) => state.health);
  const mana = useGameStore((state) => state.mana);
  const energy = useGameStore((state) => state.energy);
  const mission = useGameStore((state) => state.mission);

  const missionSubtitle = useMemo(() => {
    if (!mission.target) return " attune the Resonance Core to unlock the portal.";
    return ` recover ${mission.target} to empower the Skyforge.`;
  }, [mission]);

  return (
    <div className="bottom-overlay">
      <div className="hud-bar">
        <div>
          <div
            className="hud-fill hud-health"
            style={{ width: `${clamp01(health) * 100}%` }}
          />
        </div>
        <div>
          <div
            className="hud-fill hud-mana"
            style={{ width: `${clamp01(mana) * 100}%` }}
          />
        </div>
        <div>
          <div
            className="hud-fill hud-energy"
            style={{ width: `${clamp01(energy) * 100}%` }}
          />
        </div>
      </div>
      <div className="mission-callout">
        <h2>{mission.title}</h2>
        <p>
          {mission.description}
          <strong>{missionSubtitle}</strong>
        </p>
      </div>
    </div>
  );
}
