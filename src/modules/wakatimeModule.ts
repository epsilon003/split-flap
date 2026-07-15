import { useEffect, useRef } from "react";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { WAKATIME_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT } from "./appIcons";

interface Params {
  active: boolean;
  apiKey: string;
  onUpdate: (raw: string[]) => void;
}

export function useWakatimeModule({ active, apiKey, onUpdate }: Params) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    const key = apiKey.trim();
    if (!key) {
      onUpdate(composeIconTextBoard(["WAKATIME", "SET API KEY", "IN SETTINGS"], WAKATIME_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      return;
    }
    if (cache.current && cache.current.key === key) {
      onUpdate(cache.current.raw);
      return;
    }

    let cancelled = false;
    const auth = btoa(key);
    fetch("https://wakatime.com/api/v1/users/current/stats/last_7_days", {
      headers: { Authorization: `Basic ${auth}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const total = data?.data?.human_readable_total ?? "NO DATA";
        const lines = ["WAKATIME", "LAST 7 DAYS", total.toUpperCase()];
        const raw = composeIconTextBoard(lines, WAKATIME_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT);
        cache.current = { key, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(composeIconTextBoard(["WAKATIME", "UNAVAILABLE"], WAKATIME_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      });

    return () => {
      cancelled = true;
    };
  }, [active, apiKey, onUpdate]);
}