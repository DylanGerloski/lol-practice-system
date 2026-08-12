'use strict';

// Tests for the guide-derived content pages (src/web/contentPages.js) --
// spec Section 6 B1: program.html, baseline.html, focus-menu.html,
// champion-pool.html, vod-review.html, tilt-rules.html, faq.html.

const test = require('node:test');
const assert = require('node:assert/strict');

const { CONTENT_PAGES } = require('../src/web/contentPages.js');
const guide = require('../content/guide.js');
const focuses = require('../content/focuses.json');
const site = require('../src/site.js');

// Render every page once and cache it -- these pages are pure functions of
// static content, so a single render per page is safe to reuse across
// assertions.
const rendered = new Map(CONTENT_PAGES.map(([name, render]) => [name, render()]));

test('every guide section (a1-a11) appears in exactly one content page', () => {
  const sectionIds = guide.sections.map(s => s.id);
  const counts = new Map(sectionIds.map(id => [id, 0]));
  for (const [, html] of rendered) {
    for (const s of guide.sections) {
      // Section titles are unique strings, rendered verbatim inside an <h2>.
      const needle = `<h2>${s.title}</h2>`;
      if (html.includes(needle)) counts.set(s.id, counts.get(s.id) + 1);
    }
  }
  for (const id of sectionIds) {
    assert.equal(counts.get(id), 1, `expected guide section ${id} to appear exactly once across content pages, got ${counts.get(id)}`);
  }
});

test('every content page has exactly one <h1> and no heading level is skipped', () => {
  for (const [name, html] of rendered) {
    const h1Count = (html.match(/<h1[ >]/g) || []).length;
    assert.equal(h1Count, 1, `${name} should have exactly one <h1>, found ${h1Count}`);
    // Heading levels present, in document order.
    const levels = [...html.matchAll(/<h([1-6])[ >]/g)].map(m => Number(m[1]));
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] - levels[i - 1] <= 1, `${name} skips a heading level: ...${levels[i - 1]} -> ${levels[i]}...`);
    }
  }
});

test('every content page carries exactly 3 ad slots', () => {
  for (const [name, html] of rendered) {
    const count = (html.match(/class="ad-slot"/g) || []).length;
    assert.equal(count, 3, `${name} should have 3 ad-slot placeholders, found ${count}`);
  }
});

test('every content page links to tracker.html and downloads.html', () => {
  for (const [name, html] of rendered) {
    assert.ok(html.includes(site.url('tracker.html')), `${name} missing a link to tracker.html`);
    assert.ok(html.includes(site.url('downloads.html')), `${name} missing a link to downloads.html`);
  }
});

test('focus-menu.html deep-links every focus card to drills.html#<drillId>', () => {
  const html = rendered.get('focus-menu.html');
  for (const f of focuses) {
    const href = site.url(`drills.html#${f.drillId}`);
    assert.ok(html.includes(`href="${href}"`), `focus-menu.html missing a drill link for ${f.id} -> ${href}`);
  }
});

test('baseline.html links to drills.html#cs-10min; program.html links to focus-menu/warmup/drills', () => {
  const baseline = rendered.get('baseline.html');
  assert.ok(baseline.includes(site.url('drills.html#cs-10min')), 'baseline.html missing link to drills.html#cs-10min');

  const program = rendered.get('program.html');
  assert.ok(program.includes(`href="${site.url('focus-menu.html')}"`), 'program.html missing link to focus-menu.html');
  assert.ok(program.includes(`href="${site.url('warmup.html')}"`), 'program.html missing link to warmup.html');
  assert.ok(program.includes(`href="${site.url('drills.html')}"`), 'program.html missing link to drills.html');
});

test('vod-review.html links to the printable VOD review sheet', () => {
  const html = rendered.get('vod-review.html');
  assert.ok(html.includes(site.url('print/07-vod-review-sheet.html')), 'vod-review.html missing a link to the printable VOD sheet');
});

test('every content page carries the Riot disclaimer, canonical link, and a unique title/description', () => {
  const seenTitles = new Set();
  const seenDescriptions = new Set();
  for (const [name, html] of rendered) {
    assert.ok(html.includes(site.RIOT_DISCLAIMER), `${name} missing the Riot disclaimer`);
    assert.ok(/<link rel="canonical" href="[^"]+">/.test(html), `${name} missing a canonical link`);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(!seenTitles.has(title), `duplicate title across content pages: ${title}`);
    assert.ok(!seenDescriptions.has(description), `duplicate description across content pages: ${description}`);
    seenTitles.add(title);
    seenDescriptions.add(description);
  }
});
