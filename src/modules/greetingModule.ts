import { useEffect } from "react";
import type { Align } from "../types";
import { holidayGreetingFor } from "./holidays";
import { todaysHolidayName } from "./nagerHolidays";

interface GreetingParams {
  active: boolean;
  name: string;
  holidayCountryCode: string;
  onUpdate: (lines: string[], align: Align) => void;
}

const GREETINGS: Record<"morning" | "afternoon" | "evening" | "night", string[]> = {
  morning: [
    "GOOD MORNING",
    "RISE AND SHINE",
    "MORNING",
    "SUN'S UP",
    "NEW DAY",
    "WAKEY WAKEY",
    "TOP OF THE MORNING",
    "TIME TO SPARK",
    "EARLY BIRD",
    "HELLO SUNSHINE",
    "FRESH START",
    "COFFEE FIRST",
    "BREAKFAST CLUB",
    "GO GET 'EM",
    "SEIZE THE DAY",
    "BRIGHT AND EARLY",
    "MORNING HUMAN",
    "BOOTING UP",
    "DAY ONE",
    "LET'S ROLL"
  ],

  afternoon: [
    "GOOD AFTERNOON",
    "AFTERNOON",
    "HIGH NOON",
    "MIDDAY MODE",
    "HALFWAY THERE",
    "LUNCH O'CLOCK",
    "POST-LUNCH",
    "KEEP GOING",
    "STRETCH BREAK?",
    "POWER THROUGH",
    "AFTERNOON VIBES",
    "SOLAR PEAK",
    "DON'T FADE NOW",
    "CRUISE CONTROL",
    "STILL STANDING",
    "FULL STEAM",
    "ONWARD",
    "SECOND WIND",
    "MIDDAY MAGIC",
    "KEEP THE MOMENTUM"
  ],

  evening: [
    "GOOD EVENING",
    "EVENING",
    "GOLDEN HOUR",
    "SUNSET MODE",
    "TWILIGHT TIME",
    "WINDING DOWN",
    "HOWDY EVENING",
    "NICE TO SEE YOU",
    "AFTER HOURS",
    "EVENING GLOW",
    "CHILL MODE",
    "TIME TO UNPLUG",
    "LIGHTS GETTING LOW",
    "SUN'S CLOCKING OUT",
    "THE DAY DELIVERS",
    "RELAX, YOU EARNED IT",
    "DUSK CALLING",
    "HELLO TWILIGHT",
    "COZY HOURS",
    "NIGHT IS WARMING UP"
  ],

  night: [
    "GOOD NIGHT",
    "BURNING THE MIDNIGHT OIL",
    "STILL UP?",
    "NIGHT OWL",
    "MIDNIGHT MODE",
    "THE MOON'S OUT",
    "LATE SHIFT",
    "MOONLIGHT HOURS",
    "SLEEP IS OPTIONAL",
    "ONE MORE THING",
    "STARS ARE ON",
    "THE WORLD IS QUIET",
    "NIGHT VIBES",
    "DARK MODE",
    "OWLS ONLY",
    "HELLO MOON",
    "REST WELL",
    "DON'T FORGET TO SLEEP",
    "CODING AFTER DARK",
    "PAST YOUR BEDTIME?",
    "THE NIGHT IS YOUNG",
    "INSOMNIA CLUB",
    "MIDNIGHT SNACK?",
    "QUIET HOURS",
    "SEE YOU TOMORROW"
  ],
};

function timeOfDayGreeting(hour: number): string {
  let band: keyof typeof GREETINGS;
  if (hour >= 5 && hour < 12) band = "morning";
  else if (hour >= 12 && hour < 17) band = "afternoon";
  else if (hour >= 17 && hour < 21) band = "evening";
  else band = "night";

  const options = GREETINGS[band];
  return options[Math.floor(Math.random() * options.length)];
}

function buildLines(greeting: string, name: string): string[] {
  return name.trim() ? [greeting, name.trim().toUpperCase()] : [greeting];
}

/**
 * holiday first — a fixed-date one (birthdays of the calendar, so to speak) or a variable lunar-calendar one from a small lookup table.
 * Falls back to the ordinary time-of-day greeting otherwise. Recomputed each time the module becomes active.
 */
export function useGreetingModule({
  active,
  name,
  holidayCountryCode,
  onUpdate,
}: GreetingParams) {
  useEffect(() => {
    if (!active) return;
    const now = new Date();

    const staticHoliday = holidayGreetingFor(now);
    if (staticHoliday) {
      onUpdate(buildLines(staticHoliday, name), "center");
      return;
    }

    // show the ordinary greeting immediately, then upgrade it if the
    // async Nager.Date lookup finds something before we're deactivated
    const fallback = timeOfDayGreeting(now.getHours());
    onUpdate(buildLines(fallback, name), "center");

    let cancelled = false;
    todaysHolidayName(holidayCountryCode, now)
      .then((holidayName) => {
        if (cancelled || !holidayName) return;
        onUpdate(buildLines(`HAPPY ${holidayName.toUpperCase()}`, name), "center");
      })
      .catch(() => {
        // network hiccup or unsupported country code — the time-of-day
        // greeting already showing is a perfectly fine fallback
      });

    return () => {
      cancelled = true;
    };
  }, [active, name, holidayCountryCode, onUpdate]);
}
