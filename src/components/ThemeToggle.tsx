import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  onSettingsChanged,
  readSettings,
  writeSettings,
  THEME_ORDER,
  THEME_LABELS,
  type ThemeId,
} from "../hooks/settings";

const SWATCH_COLORS: Record<ThemeId, string> = {
  "matte-black": "#1f1f1f",
  "brushed-metal": "#b9bcc1",
  "modern-white": "#f2f0ec",
  walnut: "#5a331f",
  "transit-yellow": "#f4c430",
  custom: "#2a5ca8",
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_SETTINGS.theme);
  const [customColor, setCustomColor] = useState(DEFAULT_SETTINGS.customThemeColor);

  useEffect(() => {
    readSettings().then((s) => {
      setTheme(s.theme);
      setCustomColor(s.customThemeColor);
    });
    return onSettingsChanged((s) => {
      setTheme(s.theme);
      setCustomColor(s.customThemeColor);
    });
  }, []);

  const cycle = () => {
    const idx = THEME_ORDER.indexOf(theme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(next);
    writeSettings({ theme: next });
  };

  const swatch = theme === "custom" ? customColor : SWATCH_COLORS[theme];

  return (
    <button
      className="theme-toggle-btn"
      onClick={cycle}
      aria-label={`Frame finish: ${THEME_LABELS[theme]}. Click to cycle.`}
      title={THEME_LABELS[theme]}
    >
      <span className="theme-toggle-swatch" style={{ background: swatch }} />
    </button>
  );
}
