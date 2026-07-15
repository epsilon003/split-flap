import { useEffect, useRef, useState } from "react";
import { readSettings, writeSettings } from "../hooks/settings";
import { soundEngine } from "../engine/SoundEngine";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 9v6h4l5 5V4L8 9H4z"
        fill="currentColor"
      />
      {!muted && (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {!muted && (
        <path
          d="M19 6a9 9 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      )}
      {muted && (
        <path
          d="M17 9l4 6M21 9l-4 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function VolumeControl() {
  const [volume, setVolume] = useState(0.35);
  const [enabled, setEnabled] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readSettings().then((s) => {
      setVolume(s.soundVolume);
      setEnabled(s.soundEnabled);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const applyVolume = (v: number) => {
    setVolume(v);
    soundEngine.volume = v;
    writeSettings({ soundVolume: v });
    if (v === 0 && enabled) {
      setEnabled(false);
      soundEngine.enabled = false;
      writeSettings({ soundEnabled: false });
    } else if (v > 0 && !enabled) {
      setEnabled(true);
      soundEngine.enabled = true;
      writeSettings({ soundEnabled: true });
    }
  };

  const toggleMute = () => {
    const next = !enabled;
    setEnabled(next);
    soundEngine.enabled = next;
    writeSettings({ soundEnabled: next });
  };

  return (
    <div className="volume-control" ref={containerRef}>
      <button
        className="volume-btn"
        onClick={() => setExpanded((e) => !e)}
        aria-label="Click sound volume"
      >
        <SpeakerIcon muted={!enabled || volume === 0} />
      </button>
      {expanded && (
        <div className="volume-panel">
          <button className="volume-mute" onClick={toggleMute} aria-label="Mute">
            <SpeakerIcon muted={!enabled || volume === 0} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={enabled ? volume : 0}
            onChange={(e) => applyVolume(Number(e.target.value))}
            className="volume-slider"
          />
        </div>
      )}
    </div>
  );
}
