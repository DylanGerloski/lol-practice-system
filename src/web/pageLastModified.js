'use strict';

/**
 * Real per-page "last modified" dates, replacing the single build-time
 * `new Date()` timestamp (site.js's BUILD_DATE) that previously fed
 * sitemap.xml's <lastmod> and privacy.html's "Last updated" text alike.
 * That timestamp bumped on every single rebuild regardless of whether any
 * page's content had actually changed -- a real defect: search engines
 * read a changing datePublished/lastmod as a republication signal, and
 * privacy.html's date falsely implied the policy itself had just changed.
 *
 * The fix: for each output page, take the most recent git commit date
 * across the source files that actually determine its content. Since git
 * commit history doesn't change between rebuilds, two builds of the same
 * commit now produce the exact same date -- only a real content-changing
 * commit moves it forward. BUILD_DATE (today) remains the fallback for a
 * file with no git history yet (freshly added, uncommitted) or for an
 * unrecognized filename, same as before this fix for that narrow case.
 *
 * Caveat, stated plainly rather than glossed over: git only tracks
 * whole-file history, and several pages share a single content source (all
 * seven CONTENT_PAGES pull from one content/guide.js covering sections
 * A1-A11, and all five pagesB3.js pages share that one module). A commit
 * that only touches one page's section still bumps every page mapped to
 * that file. This is coarser than true per-page precision, but it is a
 * real, stable, git-backed signal instead of a wall-clock timestamp that
 * moved on every build with zero content change -- the defect this file
 * exists to fix. True per-page precision would require splitting shared
 * content files per page, which is a larger content-architecture change
 * out of scope here.
 */

const { execFileSync } = require('child_process');
const path = require('path');

const site = require('../site.js');

const REPO_ROOT = path.join(__dirname, '..', '..');

/**
 * @param {string} relPath repo-root-relative path (forward slashes), e.g.
 *   'src/web/pagesB3.js'.
 * @returns {string|null} the ISO date (YYYY-MM-DD) of the most recent git
 *   commit that touched relPath, or null if the file has no git history
 *   yet, isn't tracked, or git itself couldn't be run (no .git directory --
 *   e.g. a tarball checkout with no repo metadata at all). Never throws.
 */
function gitLastModified(relPath) {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%aI', '--', relPath],
      { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    return out ? out.slice(0, 10) : null;
  } catch {
    return null;
  }
}

// Applies to every page: the shared layout (header/nav/footer markup) and
// site-wide constants (name, tagline, disclaimer text). A real edit to
// either legitimately changes what every page renders.
const SHARED_SOURCES = ['src/web/shell.js', 'src/site.js'];

// Each dist/ output filename mapped to its own dedicated source file(s), in
// addition to SHARED_SOURCES above. Keep in sync with buildSite.js's
// WEB_PAGES list (and CONTENT_PAGES/DRILL_WARMUP_PAGES) if a page is added,
// renamed, or moved to a different render module -- an unmapped filename
// simply falls back to BUILD_DATE (today), same as pre-fix behavior, so a
// gap here degrades gracefully rather than throwing.
const PAGE_SOURCES = {
  'index.html': ['src/web/pagesB3.js', 'content/focuses.json', 'content/drills.json', 'content/warmups.json'],
  'tracker.html': ['src/web/pagesB3.js'],
  'downloads.html': ['src/web/pagesB3.js'],
  'about.html': ['src/web/pagesB3.js'],
  'privacy.html': ['src/web/pagesB3.js'],
  '404.html': [],
  'program.html': ['src/web/contentPages.js', 'content/guide.js', 'content/benchmarks.json'],
  'baseline.html': ['src/web/contentPages.js', 'content/guide.js', 'content/benchmarks.json'],
  'focus-menu.html': ['src/web/contentPages.js', 'content/guide.js', 'content/focuses.json'],
  'champion-pool.html': ['src/web/contentPages.js', 'content/guide.js'],
  'vod-review.html': ['src/web/contentPages.js', 'content/guide.js'],
  'tilt-rules.html': ['src/web/contentPages.js', 'content/guide.js'],
  'faq.html': ['src/web/contentPages.js', 'content/guide.js'],
  'drills.html': ['src/web/drillWarmupPages.js', 'content/drills.json', 'content/focuses.json'],
  'warmup.html': ['src/web/drillWarmupPages.js', 'content/warmups.json']
};

/**
 * @param {string} file a dist/ output filename, e.g. 'privacy.html'.
 * @returns {string} the most recent git commit date (YYYY-MM-DD) across
 *   that page's known source files (SHARED_SOURCES plus its PAGE_SOURCES
 *   entry), or BUILD_DATE if `file` isn't in PAGE_SOURCES (an unrecognized
 *   or test-only filename) or none of its sources have git history yet.
 */
function lastModifiedFor(file) {
  const extra = PAGE_SOURCES[file];
  if (!extra) return site.BUILD_DATE;
  let latest = null;
  for (const rel of [...SHARED_SOURCES, ...extra]) {
    const d = gitLastModified(rel);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest || site.BUILD_DATE;
}

module.exports = { gitLastModified, lastModifiedFor, PAGE_SOURCES, SHARED_SOURCES };
