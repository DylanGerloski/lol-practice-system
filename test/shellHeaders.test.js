'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { documentHead } = require('../src/web/shell.js');

const opts = { title: 'Test Page', description: 'A test page.' };

test('documentHead ships the CSP meta tag exactly as the security standard specifies', () => {
  const head = documentHead(opts);
  assert.match(
    head,
    /<meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'none'">/
  );
});

test('documentHead ships the strict-origin-when-cross-origin referrer meta tag', () => {
  const head = documentHead(opts);
  assert.match(head, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
});

test('documentHead loads the GoatCounter script over an explicit https scheme, not protocol-relative', () => {
  const head = documentHead(opts);
  assert.match(head, /src="https:\/\/gc\.zgo\.at\/count\.js"/);
  assert.doesNotMatch(head, /src="\/\/gc\.zgo\.at\/count\.js"/);
});
