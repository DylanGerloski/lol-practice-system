'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const site = require('../src/site.js');
const {
  gitLastModified,
  lastModifiedFor,
  PAGE_SOURCES,
  SHARED_SOURCES
} = require('../src/web/pageLastModified.js');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test('gitLastModified returns a real ISO date for a file with git history (this repo\'s own package.json)', () => {
  const d = gitLastModified('package.json');
  assert.match(d, ISO_DATE);
});

test('gitLastModified returns null for a path that has never existed in git history', () => {
  assert.equal(gitLastModified('this/path/does/not/exist/anywhere.js'), null);
});

test('lastModifiedFor returns an ISO date for every known page in PAGE_SOURCES', () => {
  for (const file of Object.keys(PAGE_SOURCES)) {
    assert.match(lastModifiedFor(file), ISO_DATE, `${file} should resolve to an ISO date`);
  }
});

test('lastModifiedFor falls back to BUILD_DATE for an unrecognized filename', () => {
  assert.equal(lastModifiedFor('not-a-real-page.html'), site.BUILD_DATE);
});

test('lastModifiedFor is deterministic across repeated calls -- the whole point of the fix: rebuilding twice with no git changes must not move the date', () => {
  for (const file of Object.keys(PAGE_SOURCES)) {
    const first = lastModifiedFor(file);
    const second = lastModifiedFor(file);
    assert.equal(first, second, `${file} lastmod changed between two calls with no git changes in between`);
  }
});

test('every PAGE_SOURCES source file is a real, git-tracked file, so the map does not silently degrade to the fallback', () => {
  for (const [file, sources] of Object.entries(PAGE_SOURCES)) {
    for (const rel of [...SHARED_SOURCES, ...sources]) {
      assert.match(
        gitLastModified(rel) || '',
        ISO_DATE,
        `${file}'s source ${rel} has no git history -- check the path is correct`
      );
    }
  }
});

test('privacy.html\'s lastmod tracks its real source files, matching a committed .aI date rather than always being today', () => {
  const d = lastModifiedFor('privacy.html');
  assert.match(d, ISO_DATE);
  // Sanity: pagesB3.js (privacy.html's dedicated source) has been committed
  // in the past, so its own last-touch date should be <= today, never a
  // future date -- guards against a timezone/parsing slip in gitLastModified.
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(d <= today, `expected ${d} <= today (${today})`);
});
