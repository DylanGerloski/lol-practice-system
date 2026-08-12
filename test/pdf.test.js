'use strict';

// Tests for src/pdf.js -- the optional headless-browser print-to-pdf pass (spec
// Section 7 B3). Deliberately does NOT assert that a browser is present or that a
// PDF actually gets produced -- whether this machine has Edge/Chrome installed is
// an environment fact, not something a test should require. What IS tested is the
// contract that matters for "never fails the build": the functions this script is
// built from never throw, and the pass degrades cleanly when dist/ or a browser is
// missing.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const pdf = require('../src/pdf.js');

test('listHtmlFiles() returns only .html files, sorted', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'b.html'), '<html></html>');
    fs.writeFileSync(path.join(dir, 'a.html'), '<html></html>');
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'not html');
    fs.writeFileSync(path.join(dir, 'sheet.xlsx'), 'not html either');
    assert.deepEqual(pdf.listHtmlFiles(dir), ['a.html', 'b.html']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('toFileUrl() converts a Windows-style absolute path to a well-formed file:// URL', () => {
  const url = pdf.toFileUrl('C:\\Users\\someone\\dist\\00-readme.html');
  assert.ok(url.startsWith('file:///C:/'), `expected a file:///C:/... URL, got ${url}`);
  assert.ok(!url.includes('\\'), 'file:// URL should not contain backslashes');
});

test('toFileUrl() handles an already-POSIX absolute path without doubling the leading slash', () => {
  const url = pdf.toFileUrl('/home/someone/dist/00-readme.html');
  assert.equal(url, 'file:///home/someone/dist/00-readme.html');
});

test('findBrowser() never throws, and returns either null or a non-empty string', () => {
  assert.doesNotThrow(() => {
    const found = pdf.findBrowser();
    assert.ok(found === null || (typeof found === 'string' && found.length > 0));
  });
});

test('run() never throws and skips cleanly when dist/ does not exist yet', () => {
  const originalExists = fs.existsSync;
  fs.existsSync = (p) => (p === pdf.DIST ? false : originalExists(p));
  try {
    let result;
    assert.doesNotThrow(() => { result = pdf.run(); });
    assert.equal(result.attempted, false);
    assert.equal(result.skippedReason, 'no_dist');
    assert.deepEqual(result.produced, []);
  } finally {
    fs.existsSync = originalExists;
  }
});
