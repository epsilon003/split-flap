import { useEffect, useRef } from "react";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { STEAM_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT } from "./appIcons";

interface Params {
  active: boolean;
  apiKey: string;
  steamId: string;
  onUpdate: (raw: string[]) => void;
}

interface SteamGame {
  name: string;
  playtime_forever: number;
}

export function useSteamModule({ active, apiKey, steamId, onUpdate }: Params) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    const key = apiKey.trim();
    const id = steamId.trim();
    if (!key || !id) {
      onUpdate(composeIconTextBoard(["STEAM", "SET API KEY", "AND STEAM ID"], STEAM_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      return;
    }
    const cacheKey = `${key}:${id}`;
    if (cache.current && cache.current.key === cacheKey) {
      onUpdate(cache.current.raw);
      return;
    }

    let cancelled = false;
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
      key
    )}&steamid=${encodeURIComponent(id)}&include_played_free_games=1&format=json`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("request failed");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const games: SteamGame[] = data?.response?.games ?? [];
        const totalMinutes = games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0);
        const hours = Math.round(totalMinutes / 60);
        const top = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever)[0];
        const lines = [
          "STEAM",
          `${hours} HRS TOTAL`,
          top ? top.name.toUpperCase().slice(0, 18) : "NO GAMES FOUND",
        ];
        const raw = composeIconTextBoard(lines, STEAM_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT);
        cache.current = { key: cacheKey, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(composeIconTextBoard(["STEAM", "UNAVAILABLE"], STEAM_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      });

    return () => {
      cancelled = true;
    };
  }, [active, apiKey, steamId, onUpdate]);
}