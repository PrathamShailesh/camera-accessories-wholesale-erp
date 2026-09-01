'use client';

// Shared client-side request cache for data that's fetched from multiple
// components on the same page (or across client-side navigations) but
// rarely changes within a session — the current user and company settings.
// Without this, Header/Sidebar/DepotAppShell and several pages each fired
// their own independent /api/auth/me and /api/settings requests.

type AuthMeResponse = { authenticated: boolean; user?: any } | null;

let userPromise: Promise<AuthMeResponse> | null = null;
let settingsPromise: Promise<any | null> | null = null;

export function fetchCurrentUserCached(force = false): Promise<AuthMeResponse> {
  if (force || !userPromise) {
    userPromise = fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return userPromise;
}

export function invalidateCurrentUser() {
  userPromise = null;
}

export function fetchSettingsCached(force = false): Promise<any | null> {
  if (force || !settingsPromise) {
    settingsPromise = fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return settingsPromise;
}

export function invalidateSettings() {
  settingsPromise = null;
}
