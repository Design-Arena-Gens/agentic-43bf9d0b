"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../providers/GameStoreProvider";

export default function CursorHint() {
  const locked = useGameStore((state) => state.locked);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (locked) {
      const timeout = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timeout);
    }
    setVisible(false);
    return undefined;
  }, [locked]);

  return <div className={`cursor-hint ${visible ? "active" : ""}`} />;
}
