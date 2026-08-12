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
