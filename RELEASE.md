# Chrome Web Store release guide

This checklist follows the current
[publishing guide](https://developer.chrome.com/docs/webstore/publish/),
[image requirements](https://developer.chrome.com/docs/webstore/images), and
[program policies](https://developer.chrome.com/docs/webstore/program-policies/policies).
Chrome began enforcing its expanded disclosure policy on August 1, 2026, so do
not remove or weaken the listing disclosure, in-product notice, or privacy
declaration without reviewing the policy again.

## Release artifact

Run:

```sh
npm ci
npm run package
```

Upload `release/hn-guideline-collapser-1.0.0.zip`. The packaging script uses an
allowlist, checks that the package and manifest versions match, and excludes
source, tests, development metadata, and store-only artwork.

Before uploading, load this repository unpacked in a clean Chrome profile and
complete the manual test checklist below.

The source and packaged extension are released under the MIT License.

## Store listing copy

**Name:** HN Guideline Collapser

**Category:** Productivity

**Summary:** Automatically collapses Hacker News comments that a classifier
scores as violating the site guidelines, with per-rule thresholds.

**Detailed description:**

> HN Guideline Collapser automatically collapses Hacker News comments whose
> public guideline-classifier scores meet thresholds you choose.
>
> DATA DISCLOSURE: The extension is enabled by default. It sends the numeric ID
> of each Hacker News item page you visit to
> classify.stylometry.net over HTTPS to retrieve public comment scores. This
> request also exposes your IP address and standard request metadata to the
> service and its Cloudflare CDN. It does not send comment text, your Hacker
> News identity, votes, cookies, or activity from other sites. Your on/off
> preference and thresholds stay in local Chrome storage and are not synced by
> the extension. You can stop all requests from the extension settings.
>
> Features:
>
> - independent thresholds for ten Hacker News discussion guidelines;
> - native-feeling collapsed comments that can still be expanded normally;
> - score and rule details in each marked comment's collapse-control tooltip;
> - a true off setting and a 1.00 setting that disables any individual rule;
> - no ads, analytics, account, or remote executable code.
>
> This is an independent project and is not affiliated with or endorsed by
> Hacker News or Y Combinator. Classifier scores can be imperfect; the
> extension only changes your local view of a page and never flags, votes on,
> or reports a comment.

**Homepage:** `https://github.com/chris124567/hn_extension`

**Support URL:** `https://github.com/chris124567/hn_extension/issues`

**Privacy policy URL (after pushing this release):**
`https://classify.stylometry.net/privacy`

## Privacy practices tab

**Single purpose:** Automatically collapse Hacker News comments whose
precomputed guideline-classifier scores meet thresholds selected by the user.

**Permission justifications:**

- `storage`: Stores the user's on/off preference and ten score thresholds
  locally on the device. No extension settings are synced.
- `https://classify.stylometry.net/*`: Sends the current Hacker News item's
  numeric ID over HTTPS and retrieves the corresponding public classifier
  scores. No credentials, referrer, or comment text are sent.
- `https://news.ycombinator.com/item*`: Runs the local collapsing logic only on
  Hacker News item pages and reads comment-row IDs, indentation, and collapse
  controls needed to update the page.

**Remote code:** Select **No, I am not using remote code**. The extension
executes only JavaScript included in its ZIP. The classifier response is JSON
data and is strictly validated before use.

**Data usage:** Disclose **Web history** because the numeric Hacker News item ID
identifies an item page the user visited and is transmitted to the classifier
service. The store disclosure, options-page notice, and privacy policy must all
remain consistent with this answer. Certify the Limited Use statements only
while the service continues to use request data solely to provide, secure, and
operate this feature without advertising, sale, or unrelated profiling.

## Reviewer test instructions

1. Install the extension. Its settings page opens automatically.
2. Confirm that classification is enabled by default and review the disclosure.
3. Open a story with comments from `https://news.ycombinator.com/news`.
4. Comments scoring at least 0.50 for an enabled rule collapse automatically.
   Their collapse control is bold and its tooltip lists matching rules/scores.
5. Click a collapsed comment's control to verify that Hacker News expands it
   normally.
6. Click the toolbar icon to reopen settings. Set a threshold to 1.00 and verify
   that rule is disabled. Clear the main enable checkbox and verify that reloads
   no longer make classifier requests or collapse comments.

No test account or credentials are required.

## Required store assets

- Extension/store icon: `icons/icon-128.png` (128×128).
- Small promotional tile: `store/promo-small.png` (440×280).
- Actual-product screenshot: `store/screenshot-settings.png` (1280×800). A
  second screenshot of a real HN page with collapsed comments would strengthen
  the listing, but do not use a fabricated interface screenshot.
- Optional marquee tile: `store/promo-marquee.png` (1400×560).
- A YouTube demo is optional.

## Manual preflight

- Test install, default-on behavior, disabling, all ten sliders, reset, toolbar settings,
  comment expansion, a thread with nested comments, and an API outage.
- In DevTools, verify the only cross-origin request is the HTTPS classifier
  request documented above and that no request happens while disabled.
- Verify `https://classify.stylometry.net` is healthy and
  `https://classify.stylometry.net/privacy` is public.
- Review the generated ZIP contents and SHA-256 printed by `npm run package`.
- Commit and push the exact source corresponding to the ZIP; tag it `v1.0.0`.

## Submit

1. Register a Chrome Web Store developer account and complete the publisher
   profile and email verification. Choose the account email carefully because
   changing it later requires a new account and item transfer.
2. Declare whether the publisher is a Trader or Non-Trader. Every publisher
   must make this legal-status determination; Trader publishers must complete
   Google's identity and contact verification.
3. In the Developer Dashboard, choose **Add new item** and upload the ZIP.
4. Complete the listing, privacy, distribution, and test-instructions tabs with
   the copy above. Use public distribution only after testing an unlisted or
   private release if you want a staged launch.
5. Submit for review. Consider deferred publishing so approval does not make the
   listing public until you are ready.
6. Monitor the publisher email. Current review times can range from days to
   weeks.
