import { useEffect, useRef } from "react";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { GITHUB_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT } from "./appIcons";

interface Params {
  active: boolean;
  username: string;
  onUpdate: (raw: string[]) => void;
}

export function useGithubModule({ active, username, onUpdate }: Params) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    const user = username.trim();
    if (!user) {
      onUpdate(composeIconTextBoard(["GITHUB", "SET USERNAME", "IN SETTINGS"], GITHUB_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      return;
    }
    if (cache.current && cache.current.key === user) {
      onUpdate(cache.current.raw);
      return;
    }

    let cancelled = false;
    fetch(`https://api.github.com/users/${encodeURIComponent(user)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const lines = ["GITHUB", `@${data.login}`, `${data.public_repos} REPOS  ${data.followers} FOLLOWERS`];
        const raw = composeIconTextBoard(lines, GITHUB_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT);
        cache.current = { key: user, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(composeIconTextBoard(["GITHUB", "UNAVAILABLE"], GITHUB_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT));
      });

    return () => {
      cancelled = true;
    };
  }, [active, username, onUpdate]);
}