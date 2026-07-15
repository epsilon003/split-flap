/* MV3 service worker. Two responsibilities:
  1. Seed default settings on first install.
  2. Track time-per-hostname for the "time on     sites" module —
  entirely local (chrome.storage.local),
  never transmitted anywhere,
  and gated behind an explicit opt-in flag (siteTrackerConsent) that defaults to false.
  
  Tracking logic lives here rather than in the New Tab page because it has to keep running across all browsing, not just while a New Tab happens to be open.
  */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      soundEnabled: true,
      use24h: false,
      tiltEnabled: true,
      siteTrackerConsent: false,
    });
  }
});

let currentHostname: string | null = null;
let segmentStart = Date.now();

function todayKey(): string {
  const d = new Date();
  return `siteTime:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function extractHostname(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith("http")) return null;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function isTrackingConsented(): Promise<boolean> {
  const { siteTrackerConsent } = await chrome.storage.sync.get({
    siteTrackerConsent: false,
  });
  return siteTrackerConsent === true;
}

/** Closes out the current segment (if any), banking its elapsed time
 * against the hostname it was for, then opens a new segment. */
async function flush(nextHostname: string | null) {
  const now = Date.now();
  if (currentHostname) {
    const elapsedSec = Math.round((now - segmentStart) / 1000);
    if (elapsedSec > 0 && (await isTrackingConsented())) {
      const key = todayKey();
      const stored = await chrome.storage.local.get({ [key]: {} });
      const bucket = stored[key] as Record<string, number>;
      bucket[currentHostname] = (bucket[currentHostname] || 0) + elapsedSec;
      await chrome.storage.local.set({ [key]: bucket });
    }
  }
  currentHostname = nextHostname;
  segmentStart = now;
}

async function syncToActiveTab() {
  if (!(await isTrackingConsented())) {
    await flush(null);
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  await flush(extractHostname(tab?.url));
}

chrome.tabs.onActivated.addListener(syncToActiveTab);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) syncToActiveTab();
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    flush(null); // browser itself lost focus
  } else {
    syncToActiveTab();
  }
});

// Periodic checkpoint: a tab left open for a long stretch wouldn't otherwise
// generate any tabs/windows events, and the service worker can be killed
// and restarted by Chrome at any time (MV3), so this also bounds data loss
// from a restart to under a minute.
chrome.alarms.create("siteTrackerHeartbeat", { periodInMinutes: 1 });

// Keep local storage from growing forever — only the last few days are
// ever shown (today), so prune anything older.
async function pruneOldDays() {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all)
    .filter((k) => k.startsWith("siteTime:"))
    .sort();
  if (keys.length > 3) {
    await chrome.storage.local.remove(keys.slice(0, keys.length - 3));
  }
}
chrome.alarms.create("siteTrackerPrune", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "siteTrackerHeartbeat") syncToActiveTab();
  if (alarm.name === "siteTrackerPrune") pruneOldDays();
});
