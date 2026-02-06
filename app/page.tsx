"use client";

import dynamic from "next/dynamic";
import GameCanvas from "../components/GameCanvas";
import TopPanel from "../components/ui/TopPanel";
import MinimapPanel from "../components/ui/MinimapPanel";
import HeadsUpDisplay from "../components/ui/HeadsUpDisplay";
import StartOverlay from "../components/ui/StartOverlay";
import CursorHint from "../components/ui/CursorHint";

const GameScene = dynamic(() => Promise.resolve(GameCanvas), { ssr: false });

export default function HomePage() {
  return (
    <main>
      <GameScene />
      <div className="overlay">
        <TopPanel />
        <MinimapPanel />
      </div>
      <CursorHint />
      <HeadsUpDisplay />
      <StartOverlay />
    </main>
  );
}
