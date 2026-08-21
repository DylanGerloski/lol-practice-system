'use strict';

// Tests for scripts/check-pdf-privacy-leak.js -- proves the mechanical leak
// check actually fires on a PDF containing the leak pattern, not just that
// the script exists. Builds tiny, hand-assembled PDFs (valid enough for
// pdfjs-dist to parse) rather than depending on a real browser being
// installed on the test machine.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  scanTextForLeaks,
  buildLeakPatterns,
  checkPdfFile
} = require('../scripts/check-pdf-privacy-leak.js');

/** Assembles a minimal, byte-accurate, single-page PDF whose page draws
 * `literalText` with the built-in Helvetica font -- enough for pdfjs-dist to
 * open and extract text from, without needing a real browser or a custom
 * embedded font/ToUnicode CMap (a standard Type1 font's text still round-
 * trips through pdfjs-dist's text-extraction path the same way a CMap-backed
 * one does, which is what's under test here). */
function buildMinimalPdf(literalText) {
  const escaped = literalText.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const contentStream = `BT /F1 12 Tf 20 250 Td (${escaped}) Tj ET`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 300 300] /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(contentStream, 'latin1')} >>\nstream\n${contentStream}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, idx) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

test('scanTextForLeaks() flags a file:// URL in decoded text', () => {
  const patterns = [{ label: 'file:// URL', re: /file:\/\//i }];
  const result = scanTextForLeaks('Quick Start file:///C:/Users/someone/project/dist/print/01.html end of page', patterns);
  assert.equal(result.clean, false);
  assert.equal(result.hits.length, 1);
  assert.match(result.hits[0].snippet, /file:\/\/\//);
});

test('scanTextForLeaks() flags the local OS username in decoded text', () => {
  const patterns = buildLeakPatterns();
  const username = os.userInfo().username;
  const result = scanTextForLeaks(`some footer text C:\\Users\\${username}\\Dev\\project\\dist\\print\\01.html`, patterns);
  assert.equal(result.clean, false);
  assert.ok(result.hits.some((h) => h.label.includes('local OS username')));
});

test('scanTextForLeaks() reports clean text as clean', () => {
  const patterns = buildLeakPatterns();
  const result = scanTextForLeaks('Solo Queue Practice System - Quick Start - v1.0.0 - last reviewed 2026-08-12', patterns);
  assert.equal(result.clean, true);
  assert.deepEqual(result.hits, []);
});

test('checkPdfFile() actually fails a synthetic PDF whose rendered text contains a file:// leak (end-to-end through the real PDF decode path)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-leak-test-'));
  try {
    const leakingPath = path.join(dir, 'leaking.pdf');
    fs.writeFileSync(leakingPath, buildMinimalPdf('Program Guide file:///C:/Users/someone/Dev/lol-practice-system/dist/print/02-program-guide.html 1/1'));

    const patterns = [{ label: 'file:// URL', re: /file:\/\//i }];
    const result = await checkPdfFile(leakingPath, patterns);

    assert.equal(result.clean, false, 'expected the leak check to fail on a PDF whose rendered text contains a file:// URL');
    assert.ok(result.hits.some((h) => h.label === 'file:// URL'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkPdfFile() passes a synthetic PDF with no leak pattern present', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-leak-test-'));
  try {
    const cleanPath = path.join(dir, 'clean.pdf');
    fs.writeFileSync(cleanPath, buildMinimalPdf('Program Guide - Solo Queue Practice System - page 1 of 1'));

    const patterns = [{ label: 'file:// URL', re: /file:\/\//i }];
    const result = await checkPdfFile(cleanPath, patterns);

    assert.equal(result.clean, true);
    assert.deepEqual(result.hits, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
