# AERA — site

Marketing + legal home for **AERA**, an iOS camera app that runs your phone's
camera through a simulated 2007 cameraphone. Static, no build step, no
dependencies. Bundle id `com.mosayyyed.aera`.

## Structure

```
index.html          /            the viewfinder — hero, spec strip, menu
manual/index.html   /manual/     M1 · Field Manual
support/index.html  /support/    M2 · Support & FAQ
privacy/index.html  /privacy/    M3 · Privacy Policy
terms/index.html    /terms/      M4 · Terms of Use
404.html                         no-signal page
assets/site.css                  the one committed world — dark viewfinder LCD
assets/site.js                   clock, film grain, shutter, view-transition helpers
```

Pages navigate with real paths and flip via cross-document **View Transitions**
where the browser supports them.

## Use these URLs in App Store Connect

| Field | URL |
|---|---|
| Privacy Policy URL | `https://<host>/privacy/` |
| EULA / Terms | `https://<host>/terms/` |
| Support URL | `https://<host>/support/` |
| Marketing URL | `https://<host>/` |

Then set the same two in the app's `Legal.swift`.

## Still to fill in

- **App Store link** — `index.html`, the `.cta` and softkey hrefs point at `id6806849273` — confirm it once the listing is public.
- **Support email** — currently `mohammed.sayed201638@gmail.com`; swap for a
  dedicated address if you want one.
- **Governing law** — `terms/` says Arab Republic of Egypt.

## Deploy

Any static host. Serves from the domain root cleanly.

- **Cloudflare Pages / Vercel / Netlify** — connect the repo, no settings needed.
- **GitHub Pages** — Settings → Pages → deploy from `main` / root. Served under
  `/<repo>/`; the pages use relative links so that path works.

Local preview: `python3 -m http.server` in this folder.

## Languages

Two locales, one per directory — no build step, no JS dependency, and every
page is crawlable in both:

```
/            /manual/     /support/     /privacy/     /terms/       en · ltr
/ar/         /ar/manual/  /ar/support/  /ar/privacy/  /ar/terms/    ar · rtl
```

`assets/` is shared. Each page carries `hreflang` alternates and a switch in
the footer. To add a language, copy `/ar/` to `/<code>/`, translate, set
`<html lang dir>`, and add the third `hreflang` line — nothing else changes.

**Type follows the app's `Typo.swift` rules.** The font list leads with the
Latin face (IBM Plex Mono / Sans, standing in for SF Mono) and keeps Almarai
right behind it, so `font-family` resolves per character: Latin always renders
in IBM Plex — identical on an English page and inside an Arabic sentence —
and only the Arabic letters fall to Almarai. Under `[dir="rtl"]` letter-spacing
and uppercasing are off (tracking severs Arabic's cursive joins; the script
has no case). The AERA wordmark is the exception: brand, so Latin with its
tracking in both.
