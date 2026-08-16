# HN Guideline Collapser Privacy Policy

**Effective and last updated:** August 16, 2026

## Summary

The extension is enabled by default. It sends only the numeric ID of a Hacker
News item page to a developer-operated classifier API so it can retrieve
precomputed, public comment scores. You can disable all requests in the
extension settings. It does not sell data, show ads, or run analytics.

## Data processed and why

When you open a `news.ycombinator.com/item` page while the extension is enabled,
it sends the page's numeric item ID and a fixed score threshold to
`https://classify.stylometry.net` over HTTPS. The item ID is web-browsing
activity. It is used only to select and return the public classifier scores
needed to collapse comments on that page.

The request omits credentials and referrer information. The extension does not
transmit Hacker News comment text, usernames, account data, votes, cookies, or
browsing activity from other sites.

## Sharing and service providers

Requests go to the developer-operated classifier service and pass through
Cloudflare, its content-delivery and security provider. As with an ordinary
HTTPS request, the service and Cloudflare receive the item ID, your IP address,
and standard request metadata. Cloudflare processes that information under its
own [privacy policy](https://www.cloudflare.com/privacypolicy/). Data is not
shared with advertising platforms or data brokers.

## Storage and retention

Your enabled/disabled preference and per-rule thresholds are stored locally on
your device using Chrome extension storage. They are not synced by the
extension. The extension does not retain a history of the item pages you visit,
and API responses exist only for the life of the page. Removing the extension
deletes its local settings.

The classifier service may retain ordinary infrastructure logs for security and
reliable operation. Its classifier database contains public Hacker News
comments gathered independently of extension use; opening a page in the
extension does not add comment content to that database.

## Limited use

Information handled by the extension is used only to provide and maintain its
single comment-collapsing purpose. The use of information received from Chrome
APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use
requirements.

## Your choices

You can stop all classifier requests at any time by clearing the enable checkbox
in the extension settings. You can also remove the extension.

## Changes and contact

Material changes to these practices will be disclosed before the changed data
handling begins. Questions can be sent to
[chrisjtarry@gmail.com](mailto:chrisjtarry@gmail.com) or filed in the project's
[GitHub issue tracker](https://github.com/chris124567/hn_extension/issues).
