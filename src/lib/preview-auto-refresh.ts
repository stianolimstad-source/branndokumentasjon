const PREVIEW_IDLE_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes
const MIN_REFRESH_GAP_MS = 2 * 60 * 1000;         // 2 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000;           // 1 minute
const WAKE_DRIFT_THRESHOLD_MS = 5 * 60 * 1000;    // 5 minutes
const LAST_REFRESH_KEY = "__lovable_preview_last_refresh__";
const REFRESH_PARAM = "__preview_refresh";

function isPreviewHost() {
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return host.includes("id-preview--") || host.includes("lovableproject.com");
}

function readLastRefreshAt() {
  try {
    return Number(window.sessionStorage.getItem(LAST_REFRESH_KEY) || "0");
  } catch {
    return 0;
  }
}

function writeLastRefreshAt(timestamp: number) {
  try {
    window.sessionStorage.setItem(LAST_REFRESH_KEY, String(timestamp));
  } catch {
    // Ignore storage errors in preview mode.
  }
}

export function enablePreviewAutoRefresh() {
  if (typeof window === "undefined" || !isPreviewHost()) return;

  let idleStartedAt = Date.now();
  let heartbeatAt = Date.now();

  const markIdle = () => {
    idleStartedAt = Date.now();
  };

  const refreshIfStale = (force = false) => {
    if (document.visibilityState !== "visible") return;

    const now = Date.now();
    const idleFor = now - idleStartedAt;
    const lastRefreshAt = readLastRefreshAt();

    if (!force && idleFor < PREVIEW_IDLE_THRESHOLD_MS) return;
    if (now - lastRefreshAt < MIN_REFRESH_GAP_MS) return;

    writeLastRefreshAt(now);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set(REFRESH_PARAM, String(now));
    window.location.replace(nextUrl.toString());
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      markIdle();
      return;
    }

    refreshIfStale();
  });

  window.addEventListener("blur", markIdle);
  window.addEventListener("pagehide", markIdle);
  window.addEventListener("focus", () => {
    refreshIfStale();
  });
  window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) {
      refreshIfStale();
    }
  });

  const heartbeatId = window.setInterval(() => {
    const now = Date.now();
    const drift = now - heartbeatAt;
    heartbeatAt = now;

    if (drift >= WAKE_DRIFT_THRESHOLD_MS) {
      refreshIfStale(true);
    }
  }, HEARTBEAT_INTERVAL_MS);

  window.addEventListener(
    "beforeunload",
    () => {
      window.clearInterval(heartbeatId);
    },
    { once: true },
  );
}
