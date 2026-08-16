# HN Guideline Collapser

Chrome extension that automatically collapses comments on Hacker News item
pages when the rule classifier's API scores them as violating the site
guidelines.

On a page like `https://news.ycombinator.com/item?id=24607896` it asks the
`serve` API for every violation in the item's subtree
(`GET /violations/24607896?threshold=0.2`), filters the scores against the
user's per-rule thresholds, and collapses each offending comment. Hovering
the toggle (the minus button, or the "n more" text once collapsed) shows
which rules were violated and their scores.

## Build

```sh
npm install
npm run build
```

This formats, type-checks, and bundles `src/` into `dist/`.

## Install

1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select this `extension/` directory.

By default the extension talks to the hosted API at
`https://classify.stylometry.net`, so it works without running anything
locally. To develop against your own instance, run the `serve` binary (which
in turn needs the model server), add its host to `host_permissions` in
`manifest.json` (e.g. `http://localhost/*`), and point the API server URL on
the options page at it, e.g. `http://localhost:3030`.

## Configure

Open the extension's options page (chrome://extensions → Details → Extension
options). Each of the ten guidelines has a threshold slider from 0.20 to 1.00:

- a comment is collapsed when its score for a rule **meets or exceeds** that
  rule's threshold;
- 1.00 effectively disables a rule; the default is 0.50;
- the API server URL is also configurable there.

Violations are always fetched from the API at threshold 0.2 (the lowest
configurable value) and filtered locally, so one request covers any
combination of per-rule settings. Settings live in `chrome.storage.sync`.

## Notes

- Collapsing applies the same DOM changes hn.js's own toggleCollapse makes
  (`coll` on the row, `noshow`/`nosee` on the body and descendants, "[n more]"
  toggle text) but skips its `collapse?id=` request, so nothing is persisted
  to the user's account. HN's toggle still expands the comment normally.
- `host_permissions` only covers `classify.stylometry.net`; if you point the
  extension at an API server on another host, add it to `manifest.json`.
