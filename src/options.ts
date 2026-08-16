import { RULES, type Rule } from "./rules";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_THRESHOLD,
  loadSettings,
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  saveSettings,
  type Settings,
} from "./settings";

function byId<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof ctor)) {
    throw new Error(`missing element #${id}`);
  }
  return element;
}

function flashStatus(message: string): void {
  const status = byId("status", HTMLSpanElement);
  status.textContent = message;
  setTimeout(() => {
    if (status.textContent === message) {
      status.textContent = "";
    }
  }, 1500);
}

async function persist(settings: Settings): Promise<void> {
  await saveSettings(settings);
  flashStatus("Saved");
}

interface RuleRow {
  element: HTMLElement;
  setThreshold(value: number): void;
}

function buildRuleRow(
  rule: Rule,
  initial: number,
  onCommit: (value: number) => void,
): RuleRow {
  const row = document.createElement("div");
  row.className = "rule";

  const label = document.createElement("label");
  label.className = "rule-label";
  label.htmlFor = `rule-${rule.id}`;
  label.textContent = `${rule.id}. ${rule.name}`;
  label.title = rule.text;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.id = `rule-${rule.id}`;
  slider.min = String(MIN_THRESHOLD);
  slider.max = String(MAX_THRESHOLD);
  slider.step = "0.01";

  const value = document.createElement("output");
  value.htmlFor.add(slider.id);

  const setThreshold = (threshold: number): void => {
    slider.value = String(threshold);
    value.textContent = threshold.toFixed(2);
  };
  setThreshold(initial);

  // "input" fires continuously while dragging: update the readout only.
  // "change" fires once on release: persist then.
  slider.addEventListener("input", () => {
    value.textContent = Number(slider.value).toFixed(2);
  });
  slider.addEventListener("change", () => {
    onCommit(Number(slider.value));
  });

  row.append(label, slider, value);
  return { element: row, setThreshold };
}

async function main(): Promise<void> {
  const settings = await loadSettings();

  const apiInput = byId("api-base-url", HTMLInputElement);
  apiInput.value = settings.apiBaseUrl;
  apiInput.addEventListener("change", () => {
    settings.apiBaseUrl = apiInput.value.trim() || DEFAULT_API_BASE_URL;
    apiInput.value = settings.apiBaseUrl;
    void persist(settings);
  });

  const rulesContainer = byId("rules", HTMLDivElement);
  const rows = RULES.map((rule) => {
    const row = buildRuleRow(
      rule,
      settings.thresholds[rule.id] ?? DEFAULT_THRESHOLD,
      (threshold) => {
        settings.thresholds[rule.id] = threshold;
        void persist(settings);
      },
    );
    rulesContainer.append(row.element);
    return { rule, row };
  });

  byId("reset", HTMLButtonElement).addEventListener("click", () => {
    settings.apiBaseUrl = DEFAULT_API_BASE_URL;
    apiInput.value = DEFAULT_API_BASE_URL;
    for (const { rule, row } of rows) {
      settings.thresholds[rule.id] = DEFAULT_THRESHOLD;
      row.setThreshold(DEFAULT_THRESHOLD);
    }
    void persist(settings);
  });
}

main().catch((error: unknown) => {
  console.error("HN Guideline Collapser options:", error);
});
