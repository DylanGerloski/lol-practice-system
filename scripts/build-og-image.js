'use strict';

/**
 * Local, one-off generator for the site's social-share image
 * (dist/og-image.png, 1200x630 -- spec Section 1.5/6 B4). One site-wide
 * image is acceptable at this size of site, referenced from every page's
 * og:image meta tag via src/site.js's absoluteUrl('og-image.png')
 * (see src/web/shell.js's documentHead()).
 *
 * Uses Playwright (already a devDependency) to render a small
 * self-contained HTML card and screenshot it. Reads its colors/type
 * straight out of src/web/tokens.css (parsed at runtime, not duplicated
 * here) and its mark straight out of src/web/shell.js's FAVICON_DATA_URI,
 * so this image can never drift from the design tokens or the favicon
 * actually shipping on every page.
 *
 * NOT part of `npm run build:site` / `npm run build:all` and never runs
 * automatically -- the main build must not depend on a browser being
 * available. Run it by hand whenever the tokens, site name, or tagline
 * change:
 *
 *   node scripts/build-og-image.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const site = require('../src/site.js');
const { FAVICON_DATA_URI } = require('../src/web/shell.js');
const { escapeHtml } = require('../src/render/html.js');

const TOKENS_PATH = path.join(__dirname, '..', 'src', 'web', 'tokens.css');
const DIST = path.join(__dirname, '..', 'dist');
const OUT_FILE = path.join(DIST, 'og-image.png');

/**
 * Parses `--name: value;` custom-property declarations out of tokens.css
 * into a plain object, so this script styles itself from the same single
 * source of truth as every page instead of duplicating hex/px values.
 * Deliberately minimal (no full CSS parser needed -- tokens.css only ever
 * contains flat `--name: value;` declarations inside one :root block).
 */
function parseTokens(cssSource) {
  const tokens = {};
  const re = /--([\w-]+):\s*([^;]+);/g;
  let match;
  while ((match = re.exec(cssSource)) !== null) {
    tokens[`--${match[1]}`] = match[2].trim();
  }
  return tokens;
}

/**
 * FAVICON_DATA_URI is a `data:image/svg+xml,<url-encoded markup>` string.
 * Decoding it recovers the exact same mark used for the inline favicon on
 * every page, so the og-image never carries a second, drifting brand mark.
 */
function decodeFaviconSvg() {
  const prefix = 'data:image/svg+xml,';
  if (!FAVICON_DATA_URI.startsWith(prefix)) {
    throw new Error('build-og-image: FAVICON_DATA_URI is not the expected data:image/svg+xml, format');
  }
  return decodeURIComponent(FAVICON_DATA_URI.slice(prefix.length));
}

function ogImageHtml(tokens) {
  const mark = decodeFaviconSvg();
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    position: relative;
    overflow: hidden;
    background: ${tokens['--paper']};
    font-family: ${tokens['--font-sans']};
  }
  .frame {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 96px;
    border-top: 14px solid ${tokens['--accent']};
  }
  .mark { width: 88px; height: 88px; margin-bottom: 32px; }
  .mark svg { display: block; width: 100%; height: 100%; }
  .wordmark {
    font-weight: ${tokens['--weight-head']};
    color: ${tokens['--ink']};
    font-size: 72px;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }
  .tagline {
    color: ${tokens['--muted']};
    font-size: 30px;
    line-height: 1.4;
    max-width: 900px;
    margin-top: 24px;
  }
</style></head>
<body>
  <div class="frame">
    <div class="mark">${mark}</div>
    <div class="wordmark">${escapeHtml(site.SITE_NAME)}</div>
    <div class="tagline">${escapeHtml(site.SITE_TAGLINE)}</div>
  </div>
</body></html>`;
}

async function main() {
  const tokens = parseTokens(fs.readFileSync(TOKENS_PATH, 'utf8'));
  fs.mkdirSync(DIST, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    try {
      await page.setContent(ogImageHtml(tokens), { waitUntil: 'networkidle' });
      await page.screenshot({ path: OUT_FILE, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`Wrote ${OUT_FILE} (1200x630)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('build-og-image failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { parseTokens, decodeFaviconSvg, ogImageHtml };
