import { useEffect, useRef } from "react";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { jammedErrorBoard } from "../engine/errorState";
import { MONKEYTYPE_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT } from "./appIcons";

interface Params {
  active: boolean;
  username: string;
  onUpdate: (raw: string[]) => void;
}

/**
 * MonkeyType's public profile endpoint needs no auth at all — confirmed
 * against their API docs, which show this specific route without the
 * Authorization header every other endpoint requires. The exact response
 * shape wasn't independently verified against a live call, so the field
 * access below is a best-effort guess at the likely structure and may
 * need a small adjustment once tested against real data.
 */
export function useMonkeytypeModule({ active, username, onUpdate }: Params) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    const user = username.trim();
    if (!user) {
      onUpdate(composeIconTextBoard(["MONKEYTYPE", "SET USERNAME", "IN SETTINGS"], MONKEYTYPE_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      return;
    }
    if (cache.current && cache.current.key === user) {
      onUpdate(cache.current.raw);
      return;
    }

    let cancelled = false;
    fetch(`https://api.monkeytype.com/users/${encodeURIComponent(user)}/profile?isUid=false`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const stats = data?.data ?? data;
        const best60 =
          stats?.personalBests?.time?.["60"]?.[0]?.wpm ??
          stats?.typingStats?.bestWpm ??
          null;
        const line = best60 ? `BEST WPM ${Math.round(best60)}` : "NO STATS YET";
        const lines = ["MONKEYTYPE", `@${user}`, line];
        const raw = composeIconTextBoard(lines, MONKEYTYPE_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT);
        cache.current = { key: user, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(jammedErrorBoard("MONKEYTYPE"));
      });

    return () => {
      cancelled = true;
    };
  }, [active, username, onUpdate]);
}