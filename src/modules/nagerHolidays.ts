interface NagerHoliday {
  date: string; // YYYY-MM-DD
  localName: string;
  name: string;
}

const yearCache = new Map<string, NagerHoliday[]>();

function localISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function fetchHolidaysForYear(
  year: number,
  countryCode: string
): Promise<NagerHoliday[]> {
  const key = `${year}:${countryCode}`;
  const cached = yearCache.get(key);
  if (cached) return cached;

  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/${encodeURIComponent(countryCode)}`
  );
  if (!res.ok) throw new Error("nager fetch failed");
  const data: NagerHoliday[] = await res.json();
  yearCache.set(key, data);
  return data;
}

/** Returns today's public holiday name for the given country, or null if
 * today isn't one (or the country code is invalid/unsupported). */
export async function todaysHolidayName(
  countryCode: string,
  now: Date = new Date()
): Promise<string | null> {
  if (!countryCode.trim()) return null;
  const holidays = await fetchHolidaysForYear(now.getFullYear(), countryCode);
  const today = localISODate(now);
  const match = holidays.find((h) => h.date === today);
  return match?.name ?? null;
}