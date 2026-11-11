# Lumio Guard v0 — try it yourself

A checklist to run in your own Google Chrome. It takes about 15 minutes and doubles as
the demo script. Tick each box. If a step does not behave as described, write down what
you saw and stop there.

The automated tests cover most of this in a test browser. They cannot cover real Google
Chrome or the real Google and YouTube sites, so those steps matter most (marked **★**).

## Part 1 — Install (once)

In a terminal, inside the `extension` folder:

```bash
npm install
```

```bash
npm run lists
```

```bash
npm run build
```

The last command must print `Lists: REAL blocklists`.

Then in Chrome:

- [ ] Open `chrome://extensions`.
- [ ] Turn on **Developer mode** (top right).
- [ ] Click **Load unpacked** and choose the folder `lumio-guard\extension\dist`.
- [ ] **★** Lumio Guard appears with a green shield icon and no red **Errors** button.
      (The first load can take up to a minute: Chrome is reading 1.29 million sites.)
- [ ] Click the puzzle-piece icon in Chrome's toolbar and pin Lumio Guard.

## Part 2 — Protect: harmful sites are blocked

- [ ] **★** Type `pornhub.com` in the address bar. Chrome shows "This page has been blocked by
      an extension". Nothing from the site appears.
- [ ] **★** Type `bet9ja.com`. Same blocked page.
- [ ] **★** Type `sportybet.com`. Same blocked page.
- [ ] Open `wikipedia.org`, `bible.com`, `jamb.gov.ng` and `bbc.com`. All open normally.
- [ ] **★** Browse two or three sites you use every day. Nothing looks broken.

## Part 3 — Protect: Safe Search stays on

- [ ] **★** Search for anything on `google.com`. The address ends up containing `safe=active`.
- [ ] **★** In the address bar, change `safe=active` to `safe=off` and press Enter. It changes
      back to `safe=active`.
- [ ] **★** On Google, open Settings → SafeSearch. It shows SafeSearch as on (filtering).
- [ ] **★** Search on `bing.com`. The address contains `adlt=strict`.
- [ ] **★** Open `youtube.com`, click your profile picture (or the three dots) → **Restricted
      Mode**. It is on and cannot be switched off. Comments under videos are hidden.

## Part 4 — Understand: the status pop-up

- [ ] Click the Lumio Guard icon. It says **Protection is on**, lists "Adult content",
      "Betting and gambling", "Safe Search" and "Break reminders", and shows your browsing
      time.
- [ ] It shows a notice that private (Incognito) windows are not protected.
- [ ] It lists what Lumio Guard cannot do yet.

## Part 5 — Interrupt and Redirect: break reminders

- [ ] Click **Settings**. Under **Break reminders**, change the three times to `1`, `2`
      and `3`. "Saved." appears.
- [ ] **★** Open `youtube.com` and keep using it. After about one minute (it can be up to a
      minute late) a small Lumio Guard card appears in the bottom-right corner of the page.
- [ ] Click **Keep going**. The card closes and the video carries on.
- [ ] **★** About a minute later a second card appears with different wording. Click **Take a
      break**. The tab changes to a page with three ideas.
- [ ] Click **Show me something else**. Three different ideas appear.
- [ ] **★** Open `wikipedia.org` and keep reading for a few minutes. The reminder arrives as a
      Windows notification instead (bottom-right of the screen). If none arrives, check that
      Windows "Do not disturb" is off.
- [ ] Put the times back to `15`, `30` and `60`.

## Part 6 — Settings switch things off and on

- [ ] In Settings, untick **Betting and gambling**. `bet9ja.com` now starts to load. The
      pop-up says **Some protection is off**.
- [ ] Tick it again. `bet9ja.com` is blocked again.
- [ ] Tick **Show Lumio Guard's friendly message on blocked pages**. Chrome asks for
      permission to "read and change all your data on all websites". Click **Allow**.
- [ ] Open `bet9ja.com`. Lumio Guard's own page appears: "This page isn't available".
      It does not show the blocked address.
- [ ] Untick the friendly message. Chrome's plain blocked page is back.

## Part 7 — Survives a restart, and privacy

- [ ] Close Chrome completely and open it again. `pornhub.com` is still blocked, and your
      settings are as you left them.
- [ ] **★** Nothing is sent anywhere: on `chrome://extensions`, click **service worker** under
      Lumio Guard, open the **Network** tab, then browse for a minute. The list stays empty.
- [ ] Nothing about your browsing is stored: in that same window open **Application** →
      **Storage** → **Extension storage** → **Local**. You see `settings`, `status` and
      `wellbeing` with numbers only. No site names.

## Known limits to say out loud in a demo

- It only protects this Chrome browser on this computer, not other browsers, apps or phones.
- It blocks sites on its lists. A new or unknown site can get through.
- It can be switched off from `chrome://extensions`, and Incognito is unprotected unless
  "Allow in Incognito" is turned on there.
- Break reminders count all browsing the same, schoolwork included.
- The lists are a snapshot from November 2026 and do not update themselves yet.
