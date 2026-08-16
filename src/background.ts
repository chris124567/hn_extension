import type {
  FetchViolationsRequest,
  FetchViolationsResult,
  Violation,
  ViolationsResponse,
} from "./api.ts";
import { MIN_THRESHOLD } from "./settings.ts";

const API_BASE_URL = "https://classify.stylometry.net";
const REQUEST_TIMEOUT_MS = 15_000;

async function fetchViolations(itemId: number): Promise<Violation[]> {
  const url = new URL(`/violations/${itemId}`, API_BASE_URL);
  url.searchParams.set("threshold", String(MIN_THRESHOLD));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-cache",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    const body = (await response.json()) as ViolationsResponse;
    return body.violations;
  } finally {
    clearTimeout(timeout);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "AbortError"
      ? "API request timed out"
      : error.message;
  }
  return "API request failed";
}

chrome.runtime.onMessage.addListener(
  (
    message: FetchViolationsRequest,
    _sender,
    sendResponse: (result: FetchViolationsResult) => void,
  ): boolean => {
    if (message.type !== "fetch-violations") {
      return false;
    }
    fetchViolations(message.itemId)
      .then((violations) => sendResponse({ ok: true, violations }))
      .catch((error: unknown) =>
        sendResponse({ ok: false, error: errorMessage(error) }),
      );
    // Keep the message channel open for the async response.
    return true;
  },
);

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    void chrome.runtime.openOptionsPage();
  }
});
