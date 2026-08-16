'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { render404Page } = require('../src/web/shell.js');

// Regression test for a visual-QA-sweep finding: the 404 page's content div
// was the only one on the site missing the zone-measure grid class every
// other page's content wrapper uses, so it rendered in a single 1fr grid
// column instead of the shared readable-width measure -- heading and body
// text wrapped at roughly one word per line even at desktop widths.
test('render404Page applies zone-measure to its content div, matching every other page', () => {
  const html = render404Page();
  assert.match(html, /<div class="not-found zone-measure">/);
});
