export type ModuleId =
  | "greeting"
  | "siteTracker"
  | "weather"
  | "github"
  | "chess"
  | "wakatime"
  | "steam"
  | "monkeytype";

export const ALL_MODULES: ModuleId[] = [
  "greeting",
  "siteTracker",
  "weather",
  "github",
  "chess",
  "wakatime",
  "steam",
  "monkeytype",
];

export const MODULE_LABELS: Record<ModuleId, string> = {
  greeting: "Greeting",
  siteTracker: "Time on sites",
  weather: "Weather",
  github: "GitHub stats",
  chess: "Chess.com rating",
  wakatime: "WakaTime coding time",
  steam: "Steam playtime",
  monkeytype: "MonkeyType WPM",
};

export type ThemeId =
  | "matte-black"
  | "brushed-metal"
  | "modern-white"
  | "walnut"
  | "transit-yellow"
  | "custom";

export const THEME_ORDER: ThemeId[] = [
  "matte-black",
  "brushed-metal",
  "modern-white",
  "walnut",
  "transit-yellow",
  "custom",
];

export const THEME_LABELS: Record<ThemeId, string> = {
  "matte-black": "Matte Black",
  "brushed-metal": "Brushed Metal",
  "modern-white": "Modern White",
  walnut: "Walnut",
  "transit-yellow": "Transit Yellow",
  custom: "Custom Color",
};

export interface Settings {
  soundEnabled: boolean;
  use24h: boolean;
  tiltEnabled: boolean;
  soundVolume: number; // 0..1
  /** Order IS the rotation order — this list is both "what's on" and "in what sequence." */
  enabledModules: ModuleId[];
  moduleDurationSec: number;
  weatherLat: number | null;
  weatherLon: number | null;
  weatherUnit: "celsius" | "fahrenheit";
  yourName: string;
  theme: ThemeId;
  customThemeColor: string;
  searchModeEnabled: boolean;
  /** Separate, explicit opt-in for background tab tracking — being present
   * in enabledModules only controls the display slot; this is the actual
   * data-collection consent flag, off by default. */
  siteTrackerConsent: boolean;
  githubUsername: string;
  chessUsername: string;
  wakatimeApiKey: string;
  steamApiKey: string;
  steamId: string;
  monkeytypeUsername: string;
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  use24h: false,
  tiltEnabled: true,
  soundVolume: 0.35,
  enabledModules: ["greeting", "siteTracker", "weather"],
  moduleDurationSec: 27,
  weatherLat: null,
  weatherLon: null,
  weatherUnit: "celsius",
  yourName: "",
  theme: "matte-black",
  customThemeColor: "#2a5ca8",
  searchModeEnabled: true,
  siteTrackerConsent: false,
  githubUsername: "",
  chessUsername: "",
  wakatimeApiKey: "",
  steamApiKey: "",
  steamId: "",
  monkeytypeUsername: "",
};

export function readSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      chrome.storage.sync.get(
        DEFAULT_SETTINGS as unknown as { [key: string]: unknown },
        (items) => {
          resolve(items as unknown as Settings);
        }
      );
    } else {
      resolve(DEFAULT_SETTINGS);
    }
  });
}

export function writeSettings(patch: Partial<Settings>) {
  if (typeof chrome !== "undefined" && chrome.storage?.sync) {
    chrome.storage.sync.set(patch as unknown as { [key: string]: unknown });
  }
}

export function onSettingsChanged(cb: (settings: Settings) => void): () => void {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
    return () => {};
  }
  const listener = (
    _changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName !== "sync") return;
    readSettings().then(cb);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
