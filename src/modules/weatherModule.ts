import { useEffect, useRef } from "react";
import { writeSettings } from "../hooks/settings";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { jammedErrorBoard } from "../engine/errorState";
import { iconForWeatherCode, ICON_WIDTH, ICON_HEIGHT } from "./weatherIcons";

interface WeatherParams {
  active: boolean;
  lat: number | null;
  lon: number | null;
  unit: "celsius" | "fahrenheit";
  onUpdate: (raw: string[]) => void;
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "CLEAR SKY",
  1: "MOSTLY CLEAR",
  2: "PARTLY CLOUDY",
  3: "OVERCAST",
  45: "FOG",
  48: "FOG",
  51: "LIGHT DRIZZLE",
  53: "DRIZZLE",
  55: "HEAVY DRIZZLE",
  61: "LIGHT RAIN",
  63: "RAIN",
  65: "HEAVY RAIN",
  71: "LIGHT SNOW",
  73: "SNOW",
  75: "HEAVY SNOW",
  80: "RAIN SHOWERS",
  81: "RAIN SHOWERS",
  82: "VIOLENT SHOWERS",
  95: "THUNDERSTORM",
  96: "THUNDERSTORM",
  99: "THUNDERSTORM",
};

function detectLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("no geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        writeSettings({ weatherLat: lat, weatherLon: lon });
        resolve({ lat, lon });
      },
      (err) => reject(err),
      { maximumAge: 1000 * 60 * 60, timeout: 8000 }
    );
  });
}

export function useWeatherModule({ active, lat, lon, unit, onUpdate }: WeatherParams) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);
  const detecting = useRef(false);

  useEffect(() => {
    if (!active) return;

    if (lat == null || lon == null) {
      if (!detecting.current) {
        detecting.current = true;
        onUpdate(composeIconTextBoard(["LOCATING", "PLEASE ALLOW", "LOCATION ACCESS"], null, 0, 0));
        detectLocation()
          .catch(() => {
            onUpdate(composeIconTextBoard(["LOCATION", "PERMISSION", "NEEDED"], null, 0, 0));
          })
          .finally(() => {
            detecting.current = false;
          });
      }
      return;
    }

    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${unit}`;
    if (cache.current && cache.current.key === cacheKey) {
      onUpdate(cache.current.raw);
      return;
    }

    const tempUnit = unit === "fahrenheit" ? "fahrenheit" : "celsius";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${tempUnit}`;

    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const temp = Math.round(data?.current?.temperature_2m ?? 0);
        const code = data?.current?.weather_code ?? 0;
        const label = WEATHER_CODE_LABELS[code] ?? "UNKNOWN";
        const unitLabel = unit === "fahrenheit" ? "F" : "C";

        const icon = iconForWeatherCode(code);
        const raw = composeIconTextBoard(
          ["WEATHER", `${temp} DEG ${unitLabel}`, label],
          icon,
          ICON_WIDTH,
          ICON_HEIGHT
        );
        cache.current = { key: cacheKey, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(jammedErrorBoard("X"));
      });

    return () => {
      cancelled = true;
    };
  }, [active, lat, lon, unit, onUpdate]);
}