import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  readSettings,
  writeSettings,
  ALL_MODULES,
  MODULE_LABELS,
  THEME_ORDER,
  THEME_LABELS,
  type ModuleId,
  type Settings,
} from "../hooks/settings";

function useDebouncedSave(settings: Settings, loaded: boolean) {
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => writeSettings(settings), 350);
    return () => clearTimeout(t);
  }, [settings, loaded]);
}

type Tab = "modules" | "display";

export default function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [tab, setTab] = useState<Tab>("modules");
  const [expanded, setExpanded] = useState<ModuleId | null>(null);

  useEffect(() => {
    readSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  useDebouncedSave(settings, loaded);

  const enable = (id: ModuleId) => {
    setSettings((s) =>
      s.enabledModules.includes(id)
        ? s
        : { ...s, enabledModules: [...s.enabledModules, id] }
    );
    // jump straight to its config so it's obvious where to put a username/key
    setExpanded(id);
  };

  const disable = (id: ModuleId) => {
    setSettings((s) => ({
      ...s,
      enabledModules: s.enabledModules.filter((m) => m !== id),
    }));
    setExpanded((e) => (e === id ? null : e));
  };

  const move = (id: ModuleId, direction: -1 | 1) => {
    setSettings((s) => {
      const idx = s.enabledModules.indexOf(id);
      const swapWith = idx + direction;
      if (idx < 0 || swapWith < 0 || swapWith >= s.enabledModules.length) return s;
      const next = [...s.enabledModules];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return { ...s, enabledModules: next };
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((s) => ({
          ...s,
          weatherLat: pos.coords.latitude,
          weatherLon: pos.coords.longitude,
        }));
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  if (!loaded) return <div className="options-root" />;

  const disabledModules = ALL_MODULES.filter(
    (id) => !settings.enabledModules.includes(id)
  );

  // Each module's own config lives here, inline, rather than scattered
  // into far-away top-level sections — only ever rendered for a module
  // that's actually enabled and currently expanded.
  const renderModuleConfig = (id: ModuleId) => {
    switch (id) {
      case "greeting":
        return (
          <label className="field">
            Your name (optional)
            <input
              type="text"
              placeholder="Leave blank for just the greeting"
              value={settings.yourName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, yourName: e.target.value }))
              }
            />
          </label>
        );

      case "siteTracker":
        return (
          <>
            <p className="hint">
              Tracks how long the active tab spends on each site, entirely on
              your device — the data never leaves your browser, isn't sent to
              us or anyone else, and resets every day. This needs the
              extension to read tab URLs in the background, which is why
              it's off by default and requires this explicit opt-in.
            </p>
            <label className="module-row">
              <input
                type="checkbox"
                checked={settings.siteTrackerConsent}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    siteTrackerConsent: e.target.checked,
                  }))
                }
              />
              Enable time-on-sites tracking
            </label>
          </>
        );

      case "weather":
        return (
          <>
            <p className="hint">
              Location is detected automatically from your browser the first
              time this module is shown. You'll get a one-time permission
              prompt.
            </p>
            <div className="field-row">
              <button onClick={detectLocation} disabled={locating}>
                {locating ? "Locating…" : "Re-detect my location"}
              </button>
            </div>
            {settings.weatherLat != null && settings.weatherLon != null && (
              <p className="status ok">
                Using {settings.weatherLat.toFixed(2)}, {settings.weatherLon.toFixed(2)}
              </p>
            )}
            <label className="field">
              Units
              <select
                value={settings.weatherUnit}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    weatherUnit: e.target.value as Settings["weatherUnit"],
                  }))
                }
              >
                <option value="celsius">Celsius</option>
                <option value="fahrenheit">Fahrenheit</option>
              </select>
            </label>
          </>
        );

      case "github":
        return (
          <label className="field">
            Username
            <input
              type="text"
              placeholder="e.g. epsilon003"
              value={settings.githubUsername}
              onChange={(e) =>
                setSettings((s) => ({ ...s, githubUsername: e.target.value }))
              }
            />
          </label>
        );

      case "chess":
        return (
          <label className="field">
            Username
            <input
              type="text"
              value={settings.chessUsername}
              onChange={(e) =>
                setSettings((s) => ({ ...s, chessUsername: e.target.value }))
              }
            />
          </label>
        );

      case "wakatime":
        return (
          <>
            <p className="hint">
              Find your API key at wakatime.com/settings/api-key. Stored only
              in your Chrome profile, used only to call WakaTime directly
              from your browser.
            </p>
            <label className="field">
              API key
              <input
                type="text"
                value={settings.wakatimeApiKey}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, wakatimeApiKey: e.target.value }))
                }
              />
            </label>
          </>
        );

      case "steam":
        return (
          <>
            <p className="hint">
              Needs a Steam Web API key (steamcommunity.com/dev/apikey) and
              your 64-bit Steam ID. Your Steam profile's game details must be
              set to public for this to return data.
            </p>
            <label className="field">
              API key
              <input
                type="text"
                value={settings.steamApiKey}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, steamApiKey: e.target.value }))
                }
              />
            </label>
            <label className="field">
              Steam ID (64-bit)
              <input
                type="text"
                value={settings.steamId}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, steamId: e.target.value }))
                }
              />
            </label>
          </>
        );

      case "monkeytype":
        return (
          <label className="field">
            Username
            <input
              type="text"
              value={settings.monkeytypeUsername}
              onChange={(e) =>
                setSettings((s) => ({ ...s, monkeytypeUsername: e.target.value }))
              }
            />
          </label>
        );
    }
  };

  return (
    <div className="options-root">
      <h1>Split Flap Display Settings</h1>

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${tab === "modules" ? "active" : ""}`}
          onClick={() => setTab("modules")}
        >
          Modules
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "display" ? "active" : ""}`}
          onClick={() => setTab("display")}
        >
          Display
        </button>
      </div>

      {tab === "modules" && (
        <>
          <section>
            <h2>Board modules</h2>
            <p className="hint">
              This order is the rotation order. Click a module to configure
              it. The clock and date are always shown separately, pinned to
              the top-left corner.
            </p>
            <div className="module-list">
              {settings.enabledModules.map((id, i) => {
                const isOpen = expanded === id;
                return (
                  <div key={id} className={`module-card ${isOpen ? "open" : ""}`}>
                    <div className="module-row reorder-row">
                      <div className="reorder-buttons">
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={i === 0}
                          onClick={() => move(id, -1)}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={i === settings.enabledModules.length - 1}
                          onClick={() => move(id, 1)}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        className="module-name-btn"
                        onClick={() => setExpanded(isOpen ? null : id)}
                        aria-expanded={isOpen}
                      >
                        <span className={`chevron ${isOpen ? "open" : ""}`}>›</span>
                        {MODULE_LABELS[id]}
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => disable(id)}
                      >
                        Remove
                      </button>
                    </div>
                    {isOpen && (
                      <div className="module-config">{renderModuleConfig(id)}</div>
                    )}
                  </div>
                );
              })}
            </div>
            {disabledModules.length > 0 && (
              <>
                <p className="hint" style={{ marginTop: 14 }}>
                  Add to rotation:
                </p>
                <div className="chip-row">
                  {disabledModules.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="chip"
                      onClick={() => enable(id)}
                    >
                      + {MODULE_LABELS[id]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <section>
            <h2>Rotation &amp; search</h2>
            <label className="field">
              Seconds per module
              <input
                type="number"
                min={5}
                max={120}
                value={settings.moduleDurationSec}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    moduleDurationSec: Number(e.target.value) || 15,
                  }))
                }
              />
            </label>
            <label className="module-row" style={{ marginTop: 14 }}>
              <input
                type="checkbox"
                checked={settings.searchModeEnabled}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, searchModeEnabled: e.target.checked }))
                }
              />
              Search mode (press <kbd>T</kbd> on the board, <kbd>Enter</kbd> to
              search or go to a URL, <kbd>Esc</kbd> to cancel)
            </label>
          </section>
        </>
      )}

      {tab === "display" && (
        <section>
          <h2>Display</h2>
          <label className="field">
            Frame finish
            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  theme: e.target.value as Settings["theme"],
                }))
              }
            >
              {THEME_ORDER.map((id) => (
                <option key={id} value={id}>
                  {THEME_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          {settings.theme === "custom" && (
            <label className="field">
              Accent color
              <input
                type="color"
                value={settings.customThemeColor}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, customThemeColor: e.target.value }))
                }
              />
            </label>
          )}
          <p className="hint">
            There's also a theme button in the top-right corner of the new tab
            page itself that cycles through finishes with a click.
          </p>
          <label className="module-row">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, soundEnabled: e.target.checked }))
              }
            />
            Flip sound
          </label>
          <label className="field">
            Sound volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.soundVolume}
              onChange={(e) =>
                setSettings((s) => ({ ...s, soundVolume: Number(e.target.value) }))
              }
            />
          </label>
          <p className="hint">
            There's also a floating volume button in the top-right corner of
            the new tab page itself for quick adjustments.
          </p>
          <label className="module-row">
            <input
              type="checkbox"
              checked={settings.use24h}
              onChange={(e) =>
                setSettings((s) => ({ ...s, use24h: e.target.checked }))
              }
            />
            24-hour clock
          </label>
          <label className="module-row">
            <input
              type="checkbox"
              checked={settings.tiltEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, tiltEnabled: e.target.checked }))
              }
            />
            Cursor tilt
          </label>
        </section>
      )}

      <p className="hint" style={{ textAlign: "center", marginTop: 24 }}>
        <a href="../privacy/index.html">Privacy Policy</a>
      </p>
    </div>
  );
}