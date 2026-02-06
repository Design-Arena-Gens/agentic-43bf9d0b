"use client";

import { useGameStore } from "../providers/GameStoreProvider";

const controls = [
  { label: "Move", keys: "W A S D / Arrow Keys" },
  { label: "Jump", keys: "Space" },
  { label: "Dash", keys: "Shift" },
  { label: "Glide Focus", keys: "F" },
  { label: "Look", keys: "Mouse" }
];

export default function TopPanel() {
  const mission = useGameStore((state) => state.mission);

  return (
    <div className="panel">
      <h1>SkyRealms Chronicles</h1>
      <p>{mission.description}</p>
      <ul>
        {controls.map((control) => (
          <li key={control.label}>
            <span>{control.label[0]}</span>
            <strong>{control.label}:</strong> {control.keys}
          </li>
        ))}
      </ul>
      <div className="map-legend">
        <div>
          <span style={{ background: "#66b3ff" }} />
          Resonance Isle
        </div>
        <div>
          <span style={{ background: "#5fcc6b" }} />
          Evergreen Gardens
        </div>
        <div>
          <span style={{ background: "#d6c6ff" }} />
          Crystal Archives
        </div>
      </div>
    </div>
  );
}
