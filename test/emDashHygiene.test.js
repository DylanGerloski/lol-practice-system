'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const drills = require('../content/drills.json');
const focuses = require('../content/focuses.json');
const warmups = require('../content/warmups.json');
const benchmarks = require('../content/benchmarks.json');
const guide = require('../content/guide.js');
const { build, DIST } = require('../src/build.js');
const { build: buildSite, DIST: WEB_DIST } = require('../src/web/buildSite.js');

// Governance change 2026-08-15 (design-standards.md): em dashes are banned
// outright, zero tolerance -- replaced with a plain hyphen or restructured
// with a period/comma. This is a build-time guard against a regression, not
// a one-time cleanup: any new copy that introduces a literal em dash fails
// the test suite.
const EM_DASH = '—';
// The HTML-entity and numeric-character-reference spellings of an em dash
// decode to the same literal character once a browser parses the DOM (this
// bit us once already -- src/web/shell.js's footer credit shipped &mdash;
// unchanged by a literal-character-only grep of the .js source).
const EM_DASH_ENCODED = /&mdash;|&#8212;|&#x2014;/i;

function collectStrings(value, out) {
  if (typeof value === 'string') { out.push(value); return; }
  if (Array.isArray(value)) { value.forEach(v => collectStrings(v, out)); return; }
  if (value && typeof value === 'object') { Object.values(value).forEach(v => collectStrings(v, out)); }
}

test('no content JSON/JS record contains a literal or encoded em dash', () => {
  const strings = [];
  collectStrings(drills, strings);
  collectStrings(focuses, strings);
  collectStrings(warmups, strings);
  collectStrings(benchmarks, strings);
  collectStrings(guide.sections, strings);
  const blob = strings.join('\n');
  assert.ok(!blob.includes(EM_DASH), 'content contains a literal em dash (—) -- replace with a plain hyphen or restructure');
  assert.ok(!EM_DASH_ENCODED.test(blob), 'content contains an HTML-entity-encoded em dash (&mdash; / &#8212; / &#x2014;) -- replace with a plain hyphen or restructure');
});

test('no rendered HTML output contains a literal or encoded em dash', () => {
  build();
  buildSite();
  const printFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.html')).map(f => path.join(DIST, f));
  const webFiles = fs.readdirSync(WEB_DIST).filter(f => f.endsWith('.html')).map(f => path.join(WEB_DIST, f));
  const files = [...printFiles, ...webFiles];
  assert.ok(files.length > 0, 'expected at least one built HTML file');
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    assert.ok(!content.includes(EM_DASH), `${f} contains a literal em dash (—) -- replace with a plain hyphen or restructure`);
    assert.ok(!EM_DASH_ENCODED.test(content), `${f} contains an HTML-entity-encoded em dash (&mdash; / &#8212; / &#x2014;) -- replace with a plain hyphen or restructure`);
  }
});
