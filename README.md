# Solo Queue Practice System

A free, 30-day deliberate-practice program for League of Legends solo queue —
drills and templates you print or use on-screen, no account required.

Live at [lol-practice-system.com](https://lol-practice-system.com).

## Development

```
npm install
npm run build:all   # writes the print pack, PDFs, and web site to dist/
npm test             # unit tests
npm run visual-qa -- dist/index.html   # screenshots + a Lighthouse summary
```

Static output only — no server-side code, no database, no account system.

## Third-party origins

Every origin loaded by the live site, and why:

- `pagead2.googlesyndication.com` — Google AdSense, the site's ad script.
- `gc.zgo.at` — GoatCounter, privacy-friendly visit-count analytics (no
  cookies, no personal data collected).

Nothing else is fetched from a third-party origin at runtime.
