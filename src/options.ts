import { RULES, type Rule } from "./rules.ts";
import {
  DEFAULT_THRESHOLD,
  loadSettings,
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  saveSettings,
  type Settings,
} from "./settings.ts";

let statusTimeout: number | undefined;

function byId<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof ctor)) {
    throw new Error(`missing element #${id}`);
  }
  return element;
}

function flashStatus(message: string, isError = false): void {
  const status = byId("status", HTMLSpanElement);
  if (statusTimeout !== undefined) {
    clearTimeout(statusTimeout);
  }
  status.textContent = message;
  status.classList.toggle("error", isError);
  statusTimeout = setTimeout(() => {
    if (status.textContent === message) {
      status.textContent = "";
      status.classList.remove("error");
    }
  }, 2500);
}

async function persist(settings: Settings): Promise<void> {
  try {
    await saveSettings(settings);
    flashStatus("Saved");
  } catch (error: unknown) {
    console.error("HN Guideline Collapser settings save:", error);
    flashStatus("Could not save", true);
  }
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

  const help = document.createElement("span");
  help.id = `rule-help-${rule.id}`;
  help.className = "visually-hidden";
  help.textContent = rule.text;
  slider.setAttribute("aria-describedby", help.id);

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

  row.append(label, slider, value, help);
  return { element: row, setThreshold };
}

async function main(): Promise<void> {
  const settings = await loadSettings();

  const enabledInput = byId("enabled", HTMLInputElement);
  enabledInput.checked = settings.enabled;
  enabledInput.addEventListener("change", () => {
    settings.enabled = enabledInput.checked;
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
