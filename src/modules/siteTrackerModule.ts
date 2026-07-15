import { useEffect } from "react";
import type { Align } from "../types";

interface Params {
  active: boolean;
  /** the explicit consent flag, not just presence in the rotation list */
  consented: boolean;
  onUpdate: (lines: string[], align: Align) => void;
}

function todayKey(): string {
  const d = new Date();
  return `siteTime:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}H ${m}M`;
  return `${m}M`;
}

function buildLines(bucket: Record<string, number>): string[] {
  const entries = Object.entries(bucket)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (entries.length === 0) return ["TIME ON SITES", "NO DATA YET TODAY"];
  return [
    "TIME ON SITES TODAY",
    ...entries.map(([host, secs]) => {
      const name = host.length > 17 ? host.slice(0, 17) : host;
      const time = formatDuration(secs);
      const gap = Math.max(1, 20 - name.length - time.length);
      return `${name}${" ".repeat(gap)}${time}`;
    }),
  ];
}

/**
 * Reads today's accumulated per-site time (written by the background
 * service worker) and shows the top 5. Storage is keyed by date, so this
 * naturally resets at midnight with no explicit reset logic needed — a
 * fresh day just means an empty bucket for the new key. Refreshes every
 * minute while active both to catch that rollover promptly and to show
 * time accumulating live through the day.
 */
export function useSiteTrackerModule({ active, consented, onUpdate }: Params) {
  useEffect(() => {
    if (!active) return;

    if (!consented || typeof chrome === "undefined" || !chrome.storage?.local) {
      onUpdate(["TIME ON SITES", "ENABLE IN SETTINGS", "(OFF BY DEFAULT)"], "center");
      return;
    }

    const render = () => {
      const key = todayKey();
      chrome.storage.local.get({ [key]: {} }, (data) => {
        const bucket = (data[key] || {}) as Record<string, number>;
        onUpdate(buildLines(bucket), "left");
      });
    };

    render();
    const interval = setInterval(render, 60000);
    return () => clearInterval(interval);
  }, [active, consented, onUpdate]);
}
