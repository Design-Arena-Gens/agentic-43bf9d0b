"use client";

import { createContext, useContext, useRef } from "react";
import { StoreApi, UseBoundStore, create } from "zustand";
import type { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";

export type Mission = {
  title: string;
  description: string;
  target?: string;
  progress?: number;
};

export type GameStore = {
  health: number;
  mana: number;
  energy: number;
  locked: boolean;
  controls: PointerLockControlsImpl | null;
  playerPosition: [number, number, number];
  mission: Mission;
  setLocked: (locked: boolean) => void;
  setControls: (controls: PointerLockControlsImpl | null) => void;
  setPlayerPosition: (position: [number, number, number]) => void;
  tickVitals: (delta: number) => void;
  setMission: (mission: Mission) => void;
  applyDamage: (amount: number) => void;
  spendMana: (amount: number) => void;
  spendEnergy: (amount: number) => void;
};

const createGameStore = () =>
  create<GameStore>((set) => ({
    health: 1,
    mana: 1,
    energy: 1,
    locked: false,
    controls: null,
    playerPosition: [0, 0, 0],
    mission: {
      title: "Awaken on Skyreach Island",
      description:
        "Find the Resonance Crystal to attune the ancient portal. Gather prism shards and ignite the pylons scattered across the floating archipelago."
    },
    setLocked: (locked) => set({ locked }),
    setControls: (controls) => set({ controls }),
    setPlayerPosition: (position) => set({ playerPosition: position }),
    tickVitals: (delta) =>
      set((state) => ({
        mana: Math.min(1, state.mana + delta * 0.08),
        energy: Math.min(1, state.energy + delta * 0.12),
        health: Math.min(1, state.health + delta * 0.02)
      })),
    setMission: (mission) => set({ mission }),
    applyDamage: (amount) =>
      set((state) => ({ health: Math.max(0, state.health - amount) })),
    spendMana: (amount) =>
      set((state) => ({ mana: Math.max(0, state.mana - amount) })),
    spendEnergy: (amount) =>
      set((state) => ({ energy: Math.max(0, state.energy - amount) }))
  }));

const GameStoreContext = createContext<UseBoundStore<StoreApi<GameStore>> | null>(
  null
);

export default function GameStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<UseBoundStore<StoreApi<GameStore>>>();
  if (!storeRef.current) {
    storeRef.current = createGameStore();
  }
  return (
    <GameStoreContext.Provider value={storeRef.current}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error("useGameStore must be used within a GameStoreProvider");
  }
  return store(selector);
}
