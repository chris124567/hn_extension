"use strict";
(() => {
  // src/settings.ts
  var MIN_THRESHOLD = 0.2;

  // src/background.ts
  var API_BASE_URL = "https://classify.stylometry.net";
  var REQUEST_TIMEOUT_MS = 15e3;
  async function fetchViolations(itemId) {
    const url = new URL(`/violations/${itemId}`, API_BASE_URL);
    url.searchParams.set("threshold", String(MIN_THRESHOLD));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        cache: "no-cache",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      const body = await response.json();
      return body.violations;
    } finally {
      clearTimeout(timeout);
    }
  }
  function errorMessage(error) {
    if (error instanceof Error) {
      return error.name === "AbortError" ? "API request timed out" : error.message;
    }
    return "API request failed";
  }
  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message.type !== "fetch-violations") {
        return false;
      }
      fetchViolations(message.itemId).then((violations) => sendResponse({ ok: true, violations })).catch(
        (error) => sendResponse({ ok: false, error: errorMessage(error) })
      );
      return true;
    }
  );
  chrome.action.onClicked.addListener(() => {
    void chrome.runtime.openOptionsPage();
  });
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      void chrome.runtime.openOptionsPage();
    }
  });
})();
