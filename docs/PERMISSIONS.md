# Lumio Guard extension — permissions

Every permission the extension asks Chrome for, why, and what it means for privacy.
Add a row here before adding any permission to `extension/static/manifest.json`.

| Permission | Asked when | Why | Chrome's install warning | Privacy note |
|---|---|---|---|---|
| `declarativeNetRequest` | Install | Lets Chrome's own engine block listed sites. The extension hands Chrome the lists; Chrome does the matching. | "Block content on any page" | The extension never sees which sites are visited. Chrome blocks them internally. |
| `storage` | Install | Saves settings (which groups are on) and the last status check, on this computer only. | none | No browsing data is stored. Erased when the extension is removed. |
| Site access to Google Search (187 country sites), Bing, DuckDuckGo and YouTube | Install | Safe Search. Chrome only lets an extension add the "safe" setting to a search address, or the Restricted Mode header to YouTube, on sites it has access to. | "Read and change your data on a number of websites" (Chrome lists them) | The extension has no code that runs on, reads or stores anything from these sites. It only gives Chrome fixed rules: "add `safe=active`", "add `adlt=strict`", "add `kp=1`", "send `YouTube-Restrict: Strict`". Search words are never seen by the extension. |
| `<all_urls>` (optional host access) | Only if the user ticks "Show Lumio Guard's friendly message" in Settings | Chrome only lets an extension swap a blocked page for its own message when it has access to all sites. | "Read and change all your data on all websites" | Used only for the swap. The block page never receives or shows the blocked address. Removing the tick gives the access back. |

Also declared (not permissions):

- `incognito: "spanning"` — the extension can work in Incognito windows **only if the user
  turns on "Allow in Incognito"** in Chrome. Chrome keeps that off by default. The pop-up warns
  when Incognito is unprotected.
- `web_accessible_resources: blocked.html, blocked.js, ui.css` — needed for the friendly block
  page. Side effect: a website can detect that Lumio Guard is installed by probing these files.
  Recorded as a known limitation; revisit with `use_dynamic_url` later.

Not used in v0 (and why): `tabs`, `webNavigation`, `history` (they expose browsing addresses),
content scripts (they need access to page content), any remote server.
