import type {
  FetchViolationsRequest,
  FetchViolationsResult,
  RuleScore,
  Violation,
} from "./api.ts";
import { ruleName } from "./rules.ts";
import {
  loadSettings,
  MAX_THRESHOLD,
  scoreMeetsThreshold,
  type Settings,
} from "./settings.ts";

async function fetchViolations(itemId: number): Promise<Violation[]> {
  const request: FetchViolationsRequest = { type: "fetch-violations", itemId };
  const result = (await chrome.runtime.sendMessage(
    request,
  )) as FetchViolationsResult;
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.violations;
}

/** The rules whose score meets the user's threshold for that rule. */
function exceededRules(violation: Violation, settings: Settings): RuleScore[] {
  return violation.rules.filter((rule) => {
    const threshold = settings.thresholds[rule.rule] ?? MAX_THRESHOLD;
    return scoreMeetsThreshold(rule.score, threshold);
  });
}

function describeRules(rules: RuleScore[]): string {
  return rules
    .map((r) => `${ruleName(r.rule)}: ${r.score.toFixed(2)}`)
    .join("\n");
}

/** The nesting depth HN records on each comment row's td.ind element. */
function indentOf(row: Element): number {
  return Number(row.querySelector("td.ind")?.getAttribute("indent"));
}

function nextCommentRow(row: Element): Element | null {
  for (
    let el = row.nextElementSibling;
    el !== null;
    el = el.nextElementSibling
  ) {
    if (el.classList.contains("comtr")) {
      return el;
    }
  }
  return null;
}

/**
 * Collapse one comment by applying the same DOM changes hn.js's
 * toggleCollapse/collstate/hidekids make — but not its `collapse?id=` request,
 * so nothing is persisted to the user's account. Because the resulting state
 * is exactly what hn.js produces, its [–]/[n more] toggle still expands and
 * re-collapses the comment normally. The violated rules and their scores go
 * in the toggle's tooltip, visible on hover both before and after collapsing.
 * The toggle is bolded to mark the comment as one we collapsed; since hn.js
 * only rewrites the toggle's text, the bolding survives expanding it again.
 */
function collapseComment(violation: Violation, exceeded: RuleScore[]): void {
  // The comment row and its toggle anchor share the same numeric id on HN, so
  // select the row explicitly instead of using getElementById.
  const row = document.querySelector(`tr.comtr[id="${violation.id}"]`);
  const toggle = row?.querySelector<HTMLAnchorElement>("a.togg");
  if (row == null || toggle == null) {
    return;
  }
  toggle.title = `Guideline violations:\n${describeRules(exceeded)}`;
  if (row.classList.contains("coll")) {
    return;
  }

  toggle.style.fontWeight = "bold";

  // collstate(tr, true)
  row.classList.add("coll");
  row.querySelector(".votelinks")?.classList.add("nosee");
  row.querySelector(".comment")?.classList.add("noshow");
  toggle.textContent = `[${toggle.getAttribute("n") ?? 1} more]`;

  // hidekids(tr); an absent indent makes indentOf NaN, which ends the walk,
  // exactly as hn.js's null does.
  const indent = indentOf(row);
  for (
    let next = nextCommentRow(row);
    next !== null && indentOf(next) > indent;
    next = nextCommentRow(next)
  ) {
    next.classList.add("noshow");
  }
}

async function main(): Promise<void> {
  const rawItemId = new URLSearchParams(window.location.search).get("id");
  if (rawItemId === null || !/^[1-9]\d*$/.test(rawItemId)) {
    return;
  }
  const itemId = Number(rawItemId);
  if (!Number.isSafeInteger(itemId)) {
    return;
  }

  const settings = await loadSettings();
  if (!settings.enabled) {
    return;
  }
  const violations = await fetchViolations(itemId);
  for (const violation of violations) {
    const exceeded = exceededRules(violation, settings);
    if (exceeded.length > 0) {
      collapseComment(violation, exceeded);
    }
  }
}

main().catch((error: unknown) => {
  console.warn("HN Guideline Collapser:", error);
});
