'use strict';

// The web-site build (spec Section 6 B0): writes dist/site.css and every
// flat .html page under dist/ (the site root -- separate from dist/print/,
// which src/build.js owns). Currently builds the two pages this foundation
// task is responsible for, index.html and 404.html; later subtasks (B1-B4)
// add their own page-builder calls to WEB_PAGES below without touching
// anything else in this file.
//
// KNOWN GAP: unlike src/build.js's cleanDir(), this build does NOT clear
// dist/ before writing -- dist/ is shared with dist/print/ (owned by
// src/build.js), and a blanket clear here would delete the print pack out
// from under a build:all run that hasn't gotten to the print step yet (or
// has already finished it). This means a page removed from WEB_PAGES later
// leaves its old stale file behind instead of being deleted. Acceptable for
// now (WEB_PAGES only ever grows through B1-B4); a later integration pass
// (B5) should add an explicit stale-file check if pages ever get renamed.

const fs = require('fs');
const path = require('path');

const site = require('../site.js');
const shell = require('./shell.js');
const { escapeHtml } = require('../render/html.js');
const { CONTENT_PAGES } = require('./contentPages.js');

const DIST = path.join(__dirname, '..', '..', 'dist');

function writeFile(name, content) {
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, name), content, 'utf8');
  return name;
}

function renderHome() {
  const body = `<section class="hero">
      <h1>${escapeHtml(site.SITE_NAME)}</h1>
      <p class="lead">${escapeHtml(site.SITE_TAGLINE)}</p>
      <a class="btn-primary" href="${escapeHtml(site.url('program.html'))}">Start the 30-day program</a>
    </section>
    <section>
      <h2>Three steps to start</h2>
      <ol>
        <li>Log your last ten ranked games and compare your numbers against the benchmarks on the baseline page.</li>
        <li>Pick the single weakest measurable thing from the focus menu and run its drill before your next session.</li>
        <li>Play with that one focus held for two or three games, log every game, and review after.</li>
      </ol>
    </section>
    ${shell.adSlot('contentEnd')}`;
  return shell.documentShell({
    title: site.pageTitle('Solo Queue Practice System'),
    description: 'A free, ad-supported 30-day deliberate-practice program for League of Legends solo queue, with drills, warmups, and a printable tracker.',
    bodyHtml: body,
    canonical: site.absoluteUrl(''),
    active: 'home'
  });
}

// Ordered list of [filename, renderFn] pairs. Later subtasks append their own
// pages here (or in their own small module merged into this array) rather
// than restructuring this build.
const WEB_PAGES = [
  ['index.html', renderHome],
  ['404.html', shell.render404Page],
  // B1 -- guide-derived content pages (program/baseline/focus-menu/
  // champion-pool/vod-review/tilt-rules/faq), rendered from content/guide.js
  // via src/web/contentPages.js.
  ...CONTENT_PAGES
];

function build() {
  const written = [];
  written.push(writeFile('site.css', shell.SITE_CSS));
  for (const [name, render] of WEB_PAGES) {
    written.push(writeFile(name, render()));
  }
  return written;
}

if (require.main === module) {
  const files = build();
  console.log(`Built ${files.length} files into ${DIST}:`);
  files.forEach(f => console.log(`  - ${f}`));
}

module.exports = { build, DIST, WEB_PAGES };
