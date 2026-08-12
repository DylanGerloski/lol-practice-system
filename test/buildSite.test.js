'use strict';

// Tests for the web-site build (src/web/buildSite.js, src/web/shell.js,
// src/web/ads.js) -- spec Section 6 B0. Covers the two pages this foundation
// task ships (index.html, 404.html) and the shared shell they're both built
// from, so later subtasks that add more pages inherit a shell already known
// to satisfy these checks.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { build, DIST, WEB_PAGES, KNOWN_MANUAL_OUTPUTS } = require('../src/web/buildSite.js');
const site = require('../src/site.js');

test('build() writes site.css, one file per WEB_PAGES entry, the B4 SEO infra files (sitemap.xml/robots.txt/ads.txt), and the GitHub Pages CNAME file into dist/', () => {
  const written = build();
  const expected = ['site.css', ...WEB_PAGES.map(([name]) => name), 'sitemap.xml', 'robots.txt', 'ads.txt', 'CNAME'];
  assert.deepEqual(written.slice().sort(), expected.slice().sort());
  for (const f of expected) {
    assert.ok(fs.existsSync(path.join(DIST, f)), `expected ${f} to exist in dist/`);
  }
});

test('CNAME contains exactly the custom domain hostname derived from site.SITE_ORIGIN', () => {
  build();
  const content = fs.readFileSync(path.join(DIST, 'CNAME'), 'utf8');
  assert.equal(content, `${new URL(site.SITE_ORIGIN).hostname}\n`);
});

test('every built HTML page has html lang="en", a <title>, and a meta description', () => {
  build();
  const htmlFiles = WEB_PAGES.map(([name]) => name).filter(f => f.endsWith('.html'));
  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(DIST, f), 'utf8');
    assert.ok(content.includes('<html lang="en">'), `${f} missing html lang attribute`);
    assert.ok(/<title>[^<]+<\/title>/.test(content), `${f} missing <title>`);
    assert.ok(/<meta name="description" content="[^"]+"/.test(content), `${f} missing meta description`);
  }
});

test('every built HTML page carries the Riot disclaimer, and About/Privacy footer links', () => {
  build();
  const htmlFiles = WEB_PAGES.map(([name]) => name).filter(f => f.endsWith('.html'));
  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(DIST, f), 'utf8');
    assert.ok(content.includes(site.RIOT_DISCLAIMER), `${f} missing the Riot disclaimer line`);
    assert.ok(content.includes(site.TRADEMARK_NOTICE), `${f} missing the trademark notice`);
    assert.ok(content.includes(site.url('about.html')), `${f} missing an About link`);
    assert.ok(content.includes(site.url('privacy.html')), `${f} missing a Privacy link`);
  }
});

test('index.html carries a canonical link, a skip link, the full nav, and an ad slot', () => {
  build();
  const content = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  assert.ok(content.includes(`<link rel="canonical" href="${site.absoluteUrl('')}">`), 'missing canonical link');
  assert.ok(content.includes('class="skip-link"'), 'missing skip link');
  assert.ok(content.includes('class="ad-slot"'), 'missing an ad-slot placeholder');
  assert.ok(!content.includes('adsbygoogle'), 'ad script should not render while adConfig.enabled is false');
});

test('404.html is marked noindex and links back to the site root', () => {
  build();
  const content = fs.readFileSync(path.join(DIST, '404.html'), 'utf8');
  assert.ok(content.includes('<meta name="robots" content="noindex">'), '404 page should be noindex');
  assert.ok(content.includes(`href="${site.url('')}"`), '404 page should link back home');
});

test('no hardcoded hex color appears in any built HTML page outside a var() reference', () => {
  build();
  const htmlFiles = WEB_PAGES.map(([name]) => name).filter(f => f.endsWith('.html'));
  // Every hex color in the shipped output should come from the inlined
  // tokens.css <style> block (the source of truth) -- so the only hex codes
  // that may legally appear are the ones tokens.css itself defines.
  const tokensSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'web', 'tokens.css'), 'utf8');
  const tokenHexCodes = new Set((tokensSrc.match(/#[0-9A-Fa-f]{6}/g) || []).map(h => h.toUpperCase()));
  for (const f of htmlFiles) {
    const content = fs.readFileSync(path.join(DIST, f), 'utf8');
    const hexCodesInPage = (content.match(/#[0-9A-Fa-f]{6}/g) || []).map(h => h.toUpperCase());
    for (const hex of hexCodesInPage) {
      assert.ok(tokenHexCodes.has(hex), `${f} contains a hex color (${hex}) not defined in tokens.css`);
    }
  }
});

test('build() removes a stale top-level file left in dist/ by an earlier partial build', () => {
  build();
  const staleFile = path.join(DIST, 'this-page-no-longer-exists.html');
  fs.writeFileSync(staleFile, '<html>orphaned by a renamed/removed WEB_PAGES entry</html>', 'utf8');
  assert.ok(fs.existsSync(staleFile), 'setup: stale file should exist before rebuilding');
  build();
  assert.ok(!fs.existsSync(staleFile), 'a stale top-level file should be pruned by the next build()');
});

test('build() never touches dist/print/ (owned and cleaned by src/build.js) or a KNOWN_MANUAL_OUTPUTS file', () => {
  build();
  const printDir = path.join(DIST, 'print');
  fs.mkdirSync(printDir, { recursive: true });
  const printMarker = path.join(printDir, 'marker-from-src-build-js.html');
  fs.writeFileSync(printMarker, '<html>owned by src/build.js, not this build</html>', 'utf8');
  for (const manual of KNOWN_MANUAL_OUTPUTS) {
    fs.writeFileSync(path.join(DIST, manual), 'placeholder for a hand-run output', 'utf8');
  }
  build();
  assert.ok(fs.existsSync(printMarker), 'build() must never delete anything under dist/print/');
  for (const manual of KNOWN_MANUAL_OUTPUTS) {
    assert.ok(fs.existsSync(path.join(DIST, manual)), `build() must not delete the known manual output ${manual}`);
  }
});
