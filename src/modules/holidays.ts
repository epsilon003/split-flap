// Fixed-date (Gregorian) holidays — safe to hardcode, same date every year.
// A mix of globally common days and a few India/Tamil Nadu-relevant ones
// since that's this board's home turf.
const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "HAPPY NEW YEAR",
  "01-14": "HAPPY PONGAL",
  "01-26": "HAPPY REPUBLIC DAY",
  "02-14": "HAPPY VALENTINES",
  "03-17": "HAPPY ST PATRICKS",
  "04-01": "HAPPY APRIL FOOLS",
  "08-15": "HAPPY INDEPENDENCE DAY",
  "10-02": "GANDHI JAYANTI",
  "10-31": "HAPPY HALLOWEEN",
  "12-25": "MERRY CHRISTMAS",
  "12-31": "HAPPY NEW YEARS EVE",
};

// Lunar-calendar festivals shift every year and can't be hardcoded as a
// recurring MM-DD — this table only covers the specific years below and
// needs a yearly top-up (or swapping for a proper panchang calculation /
// calendar API) to stay accurate going forward.
const VARIABLE_HOLIDAYS: Record<string, string> = {
  "2026-03-04": "HAPPY HOLI",
  "2026-11-08": "HAPPY DIWALI",
};

export function holidayGreetingFor(date: Date): string | null {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();

  const variableKey = `${yyyy}-${mm}-${dd}`;
  if (VARIABLE_HOLIDAYS[variableKey]) return VARIABLE_HOLIDAYS[variableKey];

  const fixedKey = `${mm}-${dd}`;
  if (FIXED_HOLIDAYS[fixedKey]) return FIXED_HOLIDAYS[fixedKey];

  return null;
}
