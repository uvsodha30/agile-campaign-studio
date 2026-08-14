import type { SavedCampaign } from "./types";

const KEY = "acbs.campaigns.v2";

export function loadCampaigns(): SavedCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCampaign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCampaigns(list: SavedCampaign[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

const WORKING_KEY = "acbs.working.v2";

export function loadWorking<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORKING_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function persistWorking(state: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKING_KEY, JSON.stringify(state));
}

export function clearWorking() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WORKING_KEY);
}

export function newId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
