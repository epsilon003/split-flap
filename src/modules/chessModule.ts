import { useEffect, useRef } from "react";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { CHESS_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT } from "./appIcons";

interface Params {
  active: boolean;
  username: string;
  onUpdate: (raw: string[]) => void;
}

export function useChessModule({ active, username, onUpdate }: Params) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    const user = username.trim();
    if (!user) {
      onUpdate(composeIconTextBoard(["CHESS.COM", "SET USERNAME", "IN SETTINGS"], CHESS_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      return;
    }
    if (cache.current && cache.current.key === user) {
      onUpdate(cache.current.raw);
      return;
    }

    let cancelled = false;
    fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/stats`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const rapid = data?.chess_rapid?.last?.rating;
        const blitz = data?.chess_blitz?.last?.rating;
        const bullet = data?.chess_bullet?.last?.rating;
        const ratingLine = rapid
          ? `RAPID ${rapid}`
          : blitz
          ? `BLITZ ${blitz}`
          : bullet
          ? `BULLET ${bullet}`
          : "NO RATED GAMES";
        const lines = ["CHESS.COM", `@${user}`, ratingLine];
        const raw = composeIconTextBoard(lines, CHESS_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT);
        cache.current = { key: user, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(composeIconTextBoard(["CHESS.COM", "UNAVAILABLE"], CHESS_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      });

    return () => {
      cancelled = true;
    };
  }, [active, username, onUpdate]);
}