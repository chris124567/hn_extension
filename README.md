# HN Guideline Collapser

A Chrome extension that automatically collapses Hacker News comments when a
classifier scores them above your per-guideline thresholds.

The extension is independent and is not affiliated with or endorsed by Hacker
News or Y Combinator.

## How it works

On Hacker News item pages, the extension requests precomputed scores for the
page's public comments from `https://classify.stylometry.net`. It filters those
scores against ten configurable thresholds and applies the same DOM state that
Hacker News uses for its own comment-collapse control. You can expand or
re-collapse every comment normally.

The extension works immediately after installation. Its first-run settings page
clearly discloses the network request and provides an off switch. It never sends
comment text, Hacker News account data, votes, or cookies. Read the full [privacy
policy](PRIVACY.md).

## Development

Requirements: Node.js 22 or newer, npm, and Python 3 (only for creating the
release ZIP).

```sh
npm ci
npm run check
npm run build
```

Useful commands:

- `npm run format` formats source and documentation.
- `npm run check` checks formatting and types, runs tests, and audits packages.
- `npm run build` type-checks and bundles `src/` into `dist/`.
- `npm run package` runs all checks and creates the upload-ready ZIP in
  `release/`.

To test an unpacked build, open `chrome://extensions`, enable **Developer
mode**, choose **Load unpacked**, and select this repository. The settings page
opens on first install with classification enabled; review the disclosure, then
test an HN item page.

## Configuration

Each guideline has a threshold from 0.20 to 1.00:

- a comment is collapsed when its score meets or exceeds the selected value;
- lower values collapse more aggressively;
- 1.00 disables the rule;
- the default is 0.50.

The extension fetches scores at the lowest configurable threshold and filters
them locally, so one request supports every combination of rule settings.
Settings are stored only in `chrome.storage.local`.

## Release

See [RELEASE.md](RELEASE.md) for the Chrome Web Store copy, privacy declarations,
reviewer instructions, asset requirements, and the exact submission checklist.

## License

[MIT](LICENSE) © 2026 Christopher Tarry.
