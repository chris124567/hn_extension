import { RULES } from "./rules";

/**
 * Violations are always fetched from the API at this threshold — the lowest a
 * user can configure — and then filtered against the per-rule thresholds
 * locally, so one request serves any combination of rule settings.
 */
export const MIN_THRESHOLD = 0.2;
export const MAX_THRESHOLD = 1.0;
export const DEFAULT_THRESHOLD = 0.5;

export const DEFAULT_API_BASE_URL = "https://classify.stylometry.net";

export interface Settings {
  apiBaseUrl: string;
  /** Per-rule collapse threshold in [MIN_THRESHOLD, MAX_THRESHOLD], keyed by rule id. */
  thresholds: Record<number, number>;
}

function defaultThresholds(): Record<number, number> {
  return Object.fromEntries(RULES.map((rule) => [rule.id, DEFAULT_THRESHOLD]));
}

export async function loadSettings(): Promise<Settings> {
  const stored = (await chrome.storage.sync.get("settings"))["settings"] as
    Partial<Settings> | undefined;
  return {
    apiBaseUrl: stored?.apiBaseUrl ?? DEFAULT_API_BASE_URL,
    // Merge over the defaults so rules added after settings were last saved
    // still get a threshold.
    thresholds: { ...defaultThresholds(), ...stored?.thresholds },
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}
