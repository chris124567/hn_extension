import type {
  FetchViolationsRequest,
  FetchViolationsResult,
  Violation,
  ViolationsResponse,
} from "./api";
import { loadSettings, MIN_THRESHOLD } from "./settings";

async function fetchViolations(itemId: string): Promise<Violation[]> {
  const settings = await loadSettings();
  const base = settings.apiBaseUrl.endsWith("/")
    ? settings.apiBaseUrl
    : `${settings.apiBaseUrl}/`;
  const url = new URL(`violations/${itemId}`, base);
  url.searchParams.set("threshold", String(MIN_THRESHOLD));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API responded with ${response.status}`);
  }
  const body = (await response.json()) as ViolationsResponse;
  return body.violations;
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
        sendResponse({ ok: false, error: String(error) }),
      );
    // Keep the message channel open for the async response.
    return true;
  },
);
