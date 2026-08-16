/** One rule's score for a comment, as returned by the API. */
export interface RuleScore {
  rule: number;
  score: number;
}

/**
 * A comment with at least one rule scored above the requested threshold. The
 * comment text is not sent — the page already has it, and the id locates the
 * row to collapse.
 */
export interface Violation {
  id: number;
  rules: RuleScore[];
}

/** Response body of `GET /violations/<id>?threshold=<t>`. */
export interface ViolationsResponse {
  id: number;
  threshold: number;
  violations: Violation[];
}

/**
 * Message the content script sends to the background service worker, which
 * performs the actual API request (content scripts share the page's origin,
 * so a direct fetch to the API server would be blocked by CORS).
 */
export interface FetchViolationsRequest {
  type: "fetch-violations";
  itemId: number;
}

export type FetchViolationsResult =
  { ok: true; violations: Violation[] } | { ok: false; error: string };
