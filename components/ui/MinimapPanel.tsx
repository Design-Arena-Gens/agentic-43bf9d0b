"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "../providers/GameStoreProvider";
import { ISLANDS, terrainRadius } from "../../lib/world";

const MAP_SIZE = 200;

export default function MinimapPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const position = useGameStore((state) => state.playerPosition);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);
      ctx.fillStyle = "rgba(12, 17, 30, 0.9)";
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      ctx.translate(MAP_SIZE / 2, MAP_SIZE / 2);
      ctx.scale(1, 1);

      ctx.strokeStyle = "rgba(120, 148, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, terrainRadius * 1.8, 0, Math.PI * 2);
      ctx.stroke();

      ISLANDS.forEach((island, index) => {
        const radius = island.radius * 2.1;
        const gradient = ctx.createRadialGradient(
          island.center.x * 2,
          island.center.z * 2,
          radius * 0.1,
          island.center.x * 2,
          island.center.z * 2,
          radius
        );
        gradient.addColorStop(
          0,
          index === 0 ? "rgba(124, 195, 255, 0.9)" : "rgba(151, 255, 214, 0.8)"
        );
        gradient.addColorStop(
          1,
          index === 0 ? "rgba(60, 110, 220, 0.1)" : "rgba(60, 220, 150, 0.05)"
        );
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          island.center.x * 2,
          island.center.z * 2,
          radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      ctx.fillStyle = "#ffd480";
      ctx.beginPath();
      ctx.arc(position[0] * 2, position[2] * 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [position]);

  return (
    <div className="minimap">
      <h3>Skyreach Archipelago</h3>
      <canvas ref={canvasRef} width={MAP_SIZE} height={MAP_SIZE} />
    </div>
  );
}
