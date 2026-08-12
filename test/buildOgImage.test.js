'use strict';

// Unit tests for scripts/build-og-image.js's pure logic (token parsing and
// HTML-card generation). Does NOT launch a browser or write dist/og-image.png
// -- that requires Playwright and is exercised by hand (see TESTING.md),
// matching the O-5 precedent that this kind of one-off asset-generation
// script isn't part of the automated suite's browser-dependent surface.

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseTokens, decodeFaviconSvg, ogImageHtml } = require('../scripts/build-og-image.js');

test('parseTokens extracts every --name: value; custom property from a tokens.css-shaped source', () => {
  const css = `:root {\n  --paper: #FFFFFF;\n  --accent: #1B54C8;\n  --font-sans: ui-sans-serif, Arial, sans-serif;\n}`;
  const tokens = parseTokens(css);
  assert.equal(tokens['--paper'], '#FFFFFF');
  assert.equal(tokens['--accent'], '#1B54C8');
  assert.equal(tokens['--font-sans'], 'ui-sans-serif, Arial, sans-serif');
});

test('decodeFaviconSvg recovers well-formed <svg> markup from the shared FAVICON_DATA_URI', () => {
  const svg = decodeFaviconSvg();
  assert.match(svg, /^<svg /);
  assert.match(svg, /<\/svg>$/);
  assert.doesNotMatch(svg, /%[0-9A-Fa-f]{2}/, 'should be fully decoded, no leftover percent-encoding');
});

test('ogImageHtml embeds the site name, tagline, and decoded favicon mark using only the supplied tokens', () => {
  const tokens = { '--paper': '#FFFFFF', '--accent': '#1B54C8', '--ink': '#14161A', '--muted': '#5A6270', '--font-sans': 'Arial, sans-serif', '--weight-head': '700' };
  const html = ogImageHtml(tokens);
  assert.match(html, /Solo Queue Practice/);
  assert.match(html, /A free 30-day deliberate-practice program/);
  assert.match(html, /<svg /);
  assert.match(html, /background: #FFFFFF/);
  assert.match(html, /border-top: 14px solid #1B54C8/);
});
