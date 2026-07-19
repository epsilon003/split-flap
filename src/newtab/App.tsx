import { useCallback, useEffect, useMemo, useState } from "react";
import Frame from "../components/Frame";
import Board from "../components/Board";
import VolumeControl from "../components/VolumeControl";
import ThemeToggle from "../components/ThemeToggle";
import { useBoard } from "../hooks/useBoard";
import {
  DEFAULT_SETTINGS,
  onSettingsChanged,
  readSettings,
  type ModuleId,
  type Settings,
} from "../hooks/settings";
import { useModuleRotation } from "../engine/Scheduler";
import { usePermanentClock } from "../modules/clockModule";
import { useGreetingModule } from "../modules/greetingModule";
import { useWeatherModule } from "../modules/weatherModule";
import { useSiteTrackerModule } from "../modules/siteTrackerModule";
import { useGithubModule } from "../modules/githubModule";
import { useChessModule } from "../modules/chessModule";
import { useWakatimeModule } from "../modules/wakatimeModule";
import { useSteamModule } from "../modules/steamModule";
import { useMonkeytypeModule } from "../modules/monkeytypeModule";
import { useCryptoModule } from "../modules/cryptoModule";
import { useTypingModule } from "../modules/typingModule";
import { applyOverlay } from "../engine/overlay";
import { soundEngine } from "../engine/SoundEngine";
import { COLOR_TILES } from "../engine/CharacterWheel";
import { BOARD_SIZE } from "../engine/boardConfig";
import type { Align } from "../types";
import "../styles/board.css";
import "../styles/tile.css";
import "./App.css";

function sweepPattern(): string[] {
  const arr: string[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    arr.push(COLOR_TILES[i % COLOR_TILES.length]);
  }
  return arr;
}

export default function App() {
  const { grid, setLines, setRaw, clear } = useBoard();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [typingMode, setTypingMode] = useState(false);

  useEffect(() => {
    readSettings().then((s) => {
      setSettings(s);
      soundEngine.enabled = s.soundEnabled;
      soundEngine.volume = s.soundVolume;
    });
    return onSettingsChanged((s) => {
      setSettings(s);
      soundEngine.enabled = s.soundEnabled;
      soundEngine.volume = s.soundVolume;
    });
  }, []);

  useEffect(() => {
    const unlock = () => {
      soundEngine.unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // startup mechanical sweep, then hand off to rotation. Waiting on
  // document.fonts.ready first avoids the (small, but real) chance of a
  // font-swap reflow landing mid-animation if Space Mono hasn't finished
  // loading yet when the sweep would otherwise start immediately.
  useEffect(() => {
    let cancelled = false;
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;

    const begin = () => {
      if (cancelled) return;
      setRaw(sweepPattern());
      t1 = setTimeout(() => clear(), 2100);
      t2 = setTimeout(() => setReady(true), 2500);
    };

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(begin);
    } else {
      begin();
    }

    return () => {
      cancelled = true;
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // enter search mode with "T", exit with Escape (handled inside the module)
  useEffect(() => {
    if (!settings.searchModeEnabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "t" || e.key === "T") && !typingMode) {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        setTypingMode(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [settings.searchModeEnabled, typingMode]);

  // enabledModules IS the rotation order — user-controlled via Settings
  const poolForRotation = settings.enabledModules.length
    ? settings.enabledModules
    : (["weather"] as ModuleId[]);

  const rotationIndex = useModuleRotation(
    poolForRotation.length,
    settings.moduleDurationSec,
    typingMode || !ready
  );
  const activeModuleId = poolForRotation[rotationIndex];

  const handleModuleUpdate = useCallback(
    (lines: string[], align: Align) => {
      setLines(lines, align);
    },
    [setLines]
  );

  useGreetingModule({
    active: ready && activeModuleId === "greeting",
    name: settings.yourName,
    holidayCountryCode: settings.holidayCountryCode,
    onUpdate: handleModuleUpdate,
  });

  useSiteTrackerModule({
    active: ready && activeModuleId === "siteTracker",
    consented: settings.siteTrackerConsent,
    onUpdate: handleModuleUpdate,
  });

  useWeatherModule({
    active: ready && activeModuleId === "weather",
    lat: settings.weatherLat,
    lon: settings.weatherLon,
    unit: settings.weatherUnit,
    onUpdate: setRaw,
  });

  useGithubModule({
    active: ready && activeModuleId === "github",
    username: settings.githubUsername,
    onUpdate: setRaw,
  });

  useChessModule({
    active: ready && activeModuleId === "chess",
    username: settings.chessUsername,
    onUpdate: setRaw,
  });

  useWakatimeModule({
    active: ready && activeModuleId === "wakatime",
    apiKey: settings.wakatimeApiKey,
    onUpdate: setRaw,
  });

  useSteamModule({
    active: ready && activeModuleId === "steam",
    apiKey: settings.steamApiKey,
    steamId: settings.steamId,
    onUpdate: setRaw,
  });

  useMonkeytypeModule({
    active: ready && activeModuleId === "monkeytype",
    username: settings.monkeytypeUsername,
    onUpdate: setRaw,
  });

  useCryptoModule({
    active: ready && activeModuleId === "crypto",
    coinIds: settings.cryptoCoinIds,
    vsCurrency: settings.cryptoVsCurrency,
    onUpdate: setRaw,
  });

  const exitTyping = useCallback(() => setTypingMode(false), []);
  useTypingModule({
    active: typingMode,
    onUpdate: handleModuleUpdate,
    onExit: exitTyping,
  });

  const clock = usePermanentClock(settings.use24h);

  const displayGrid = useMemo(
    () => applyOverlay(grid, clock.time, clock.date),
    [grid, clock.time, clock.date]
  );

  return (
    <div className="app-root">
      <div className="page-controls">
        <ThemeToggle />
        <VolumeControl />
      </div>
      <div className="board-and-hint">
        <Frame
          tiltEnabled={settings.tiltEnabled}
          theme={settings.theme}
          customColor={settings.customThemeColor}
        >
          <Board grid={displayGrid} />
        </Frame>
        <div className="hint-row">
          {settings.searchModeEnabled && !typingMode && (
            <>
              <span className="page-hint">Press T to search</span>
              <span className="hint-sep">·</span>
            </>
          )}
          
          <a className="page-hint page-hint-link"
            href="../privacy/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}