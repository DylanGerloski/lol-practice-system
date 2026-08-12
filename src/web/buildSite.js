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
const { CONTENT_PAGES } = require('./contentPages.js');
// B2 (spec Section 6): drills.html (12 cards, anchor id + back-link per
// drill) and warmup.html (5 role routines with anchors).
const { DRILL_WARMUP_PAGES } = require('./drillWarmupPages.js');

// B3 (spec Section 6): home (replaces this file's original minimal stub --
// see task-msqf2ejd-638cc9's completion note), tracker, downloads, about,
// and privacy. Each subtask's pages live in their own small module and are
// merged into WEB_PAGES below, so this file itself never needs restructuring
// as more subtasks land.
const pagesB3 = require('./pagesB3.js');

// B4 (spec Section 6): SEO/metadata infrastructure -- sitemap.xml/robots.txt
// generated from the final written file list, dist/ads.txt, and a build-time
// metadata assertion that fails loudly on a missing/over-length/duplicate
// title or description. These wire into build() below rather than into
// WEB_PAGES, since they aren't pages themselves.
const sitemap = require('./sitemap.js');
const { adsTxtContent } = require('./adsTxt.js');
const { assertPageMetadata } = require('./assertMetadata.js');

const DIST = path.join(__dirname, '..', '..', 'dist');

function writeFile(name, content) {
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, name), content, 'utf8');
  return name;
}

// Ordered list of [filename, renderFn] pairs. Later subtasks append their own
// pages here (or in their own small module merged into this array) rather
// than restructuring this build.
const WEB_PAGES = [
  ['index.html', pagesB3.renderHome],
  ['404.html', shell.render404Page],
  ['tracker.html', pagesB3.renderTracker],
  ['downloads.html', pagesB3.renderDownloads],
  ['about.html', pagesB3.renderAbout],
  ['privacy.html', pagesB3.renderPrivacy],
  // B1 -- guide-derived content pages (program/baseline/focus-menu/
  // champion-pool/vod-review/tilt-rules/faq), rendered from content/guide.js
  // via src/web/contentPages.js.
  ...CONTENT_PAGES,
  // B2 -- drills.html, warmup.html.
  ...DRILL_WARMUP_PAGES
];

function build() {
  const written = [];
  const htmlPages = [];
  written.push(writeFile('site.css', shell.SITE_CSS));
  for (const [name, render] of WEB_PAGES) {
    const content = render();
    written.push(writeFile(name, content));
    if (name.endsWith('.html')) {
      htmlPages.push({ file: name, html: content });
    }
  }

  // Metadata correctness is a test, not a review item (spec Section 1.6) --
  // fails the whole build loudly on a missing/over-length/duplicate title
  // or description before anything below (sitemap, ads.txt) is written.
  assertPageMetadata(htmlPages);

  // Generated from the files actually written above, never hand-maintained
  // (spec Section 1.6) -- sitemap.js itself excludes 404.html and print/.
  written.push(writeFile('sitemap.xml', sitemap.renderSitemapXml(written)));
  written.push(writeFile('robots.txt', sitemap.robotsTxtContent()));
  written.push(writeFile('ads.txt', adsTxtContent()));

  return written;
}

if (require.main === module) {
  const files = build();
  console.log(`Built ${files.length} files into ${DIST}:`);
  files.forEach(f => console.log(`  - ${f}`));
}

module.exports = { build, DIST, WEB_PAGES };
