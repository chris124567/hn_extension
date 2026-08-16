import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_THRESHOLD,
  normalizeSettings,
  scoreMeetsThreshold,
} from "../src/settings.ts";

test("settings start enabled and receive all default thresholds", () => {
  const settings = normalizeSettings(undefined);
  assert.equal(settings.enabled, true);
  assert.equal(Object.keys(settings.thresholds).length, 10);
  assert.equal(settings.thresholds[1], DEFAULT_THRESHOLD);
  assert.equal(settings.thresholds[10], DEFAULT_THRESHOLD);
});

test("settings normalization keeps only valid values", () => {
  const settings = normalizeSettings({
    enabled: "true",
    thresholds: {
      1: 0.2,
      2: Number.NaN,
      3: 1,
      4: 1.01,
      99: 0.4,
    },
  });

  assert.equal(settings.enabled, false);
  assert.equal(settings.thresholds[1], 0.2);
  assert.equal(settings.thresholds[2], DEFAULT_THRESHOLD);
  assert.equal(settings.thresholds[3], 1);
  assert.equal(settings.thresholds[4], DEFAULT_THRESHOLD);
  assert.equal(settings.thresholds[99], undefined);
});

test("only a valid stored boolean controls the default-on setting", () => {
  assert.equal(normalizeSettings({ enabled: false }).enabled, false);
  assert.equal(normalizeSettings({ enabled: true }).enabled, true);
  assert.equal(normalizeSettings({ enabled: "true" }).enabled, false);
});

test("a threshold of 1.00 disables a rule", () => {
  assert.equal(scoreMeetsThreshold(0.5, 0.5), true);
  assert.equal(scoreMeetsThreshold(0.49, 0.5), false);
  assert.equal(scoreMeetsThreshold(1, 1), false);
});
