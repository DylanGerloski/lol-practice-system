'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml, card, dataTable } = require('../src/render/html.js');

const DANGEROUS = `<script>alert("x")</script> & 'quote'`;

test('escapeHtml escapes <, >, &, ", \'', () => {
  const out = escapeHtml(DANGEROUS);
  assert.ok(!out.includes('<script>'));
  assert.ok(out.includes('&lt;script&gt;'));
  assert.ok(out.includes('&amp;'));
  assert.ok(out.includes('&quot;') || out.includes('&#39;'));
});

test('card() escapes a slot value containing < & "', () => {
  const html = card({ title: 'Test', slots: [{ label: 'Danger', value: DANGEROUS }] });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('dataTable() escapes a cell value containing < & "', () => {
  const html = dataTable({
    columns: [{ key: 'x', label: 'X', numeric: false }],
    rows: [{ x: DANGEROUS }]
  });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('escapeHtml coerces non-string input (number, null, undefined) via String() rather than throwing', () => {
  // Content data (drills.json, warmups.json, etc.) is authored JSON with no
  // schema enforcement -- a missing/malformed field reaching escapeHtml as
  // null/undefined/a number should degrade to readable text, not crash the
  // build.
  assert.equal(escapeHtml(42), '42');
  assert.equal(escapeHtml(null), 'null');
  assert.equal(escapeHtml(undefined), 'undefined');
  assert.equal(escapeHtml(true), 'true');
});

test('dataTable() with zero rows renders a valid empty table (header intact, empty tbody, no throw)', () => {
  const html = dataTable({
    columns: [{ key: 'x', label: 'X', numeric: false }],
    rows: []
  });
  assert.match(html, /<table class="data-table"><thead><tr><th[^>]*>X<\/th><\/tr><\/thead><tbody><\/tbody><\/table>/);
});

test('card() applies the optional valueClass to a slot value, and omits the extra class entirely when valueClass is not given', () => {
  const withClass = card({ title: 'T', slots: [{ label: 'L', value: 'V', valueClass: 'pass-bar' }] });
  assert.match(withClass, /class="slot-value pass-bar"/);
  const withoutClass = card({ title: 'T', slots: [{ label: 'L', value: 'V' }] });
  assert.match(withoutClass, /class="slot-value">/);
  assert.doesNotMatch(withoutClass, /class="slot-value pass-bar"/);
});
