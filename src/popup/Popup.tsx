import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, readSettings, writeSettings, type Settings } from "../hooks/settings";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </label>
  );
}

export default function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeSettings(patch);
  };

  const openOptions = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  const openPrivacyPolicy = () => {
    if (typeof chrome !== "undefined" && chrome.tabs?.create && chrome.runtime?.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL("src/privacy/index.html") });
    }
  };

  if (!loaded) return <div className="popup-root" />;

  return (
    <div className="popup-root">
      <header className="popup-header">
        <div className="popup-title">SPLIT FLAP</div>
        <div className="popup-subtitle">Board settings</div>
      </header>

      <div className="popup-body">
        <Toggle
          label="Flip sound"
          checked={settings.soundEnabled}
          onChange={(v) => update({ soundEnabled: v })}
        />
        <Toggle
          label="24-hour clock"
          checked={settings.use24h}
          onChange={(v) => update({ use24h: v })}
        />
        <Toggle
          label="Cursor tilt"
          checked={settings.tiltEnabled}
          onChange={(v) => update({ tiltEnabled: v })}
        />
      </div>

      <button className="popup-cta" onClick={openOptions}>
        Modules, weather & more
      </button>

      <footer className="popup-footer">
        Open a new tab to see changes take effect.
        <br />
        <a href="#" className="popup-privacy-link" onClick={(e) => { e.preventDefault(); openPrivacyPolicy(); }}>
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}