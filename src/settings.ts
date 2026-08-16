import { RULES } from "./rules.ts";

/**
 * Violations are always fetched from the API at this threshold — the lowest a
 * user can configure — and then filtered against the per-rule thresholds
 * locally, so one request serves any combination of rule settings.
 */
export const MIN_THRESHOLD = 0.2;
export const MAX_THRESHOLD = 1.0;
export const DEFAULT_THRESHOLD = 0.5;

export function scoreMeetsThreshold(score: number, threshold: number): boolean {
  return threshold < MAX_THRESHOLD && score >= threshold;
}

export interface Settings {
  enabled: boolean;
  /** Per-rule collapse threshold in [MIN_THRESHOLD, MAX_THRESHOLD], keyed by rule id. */
  thresholds: Record<number, number>;
}

function defaultThresholds(): Record<number, number> {
  return Object.fromEntries(RULES.map((rule) => [rule.id, DEFAULT_THRESHOLD]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeSettings(value: unknown): Settings {
  const stored = isRecord(value) ? value : undefined;
  const storedThresholds = isRecord(stored?.["thresholds"])
    ? stored["thresholds"]
    : undefined;
  const thresholds = defaultThresholds();
  for (const rule of RULES) {
    const threshold = storedThresholds?.[String(rule.id)];
    if (
      typeof threshold === "number" &&
      Number.isFinite(threshold) &&
      threshold >= MIN_THRESHOLD &&
      threshold <= MAX_THRESHOLD
    ) {
      thresholds[rule.id] = threshold;
    }
  }
  const storedEnabled = stored?.["enabled"];
  return {
    // Work immediately after installation. Preserve a valid stored preference;
    // corrupt values fail closed instead of silently re-enabling a prior opt-out.
    enabled: storedEnabled === undefined ? true : storedEnabled === true,
    thresholds,
  };
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get("settings");
  return normalizeSettings(stored["settings"]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings: normalizeSettings(settings) });
}
