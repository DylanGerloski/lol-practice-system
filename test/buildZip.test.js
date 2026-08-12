'use strict';

// Tests for src/buildZip.js -- the optional print-pack zip packaging step.
// Mirrors test/pdf.test.js's pattern for an optional, never-fails build
// step: assert the skip-cleanly contract when dist/print/ isn't there, and
// assert the archive's actual contents (via readZipEntries(), the same
// round-trip reader test/xlsx.test.js uses) once it is.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { build: buildPrint } = require('../src/build.js');
const buildZip = require('../src/buildZip.js');
const { readZipEntries } = require('../src/xlsx/zip.js');

test('build() skips cleanly when dist/print/ does not exist yet', () => {
  const originalExists = fs.existsSync;
  fs.existsSync = (p) => (p === buildZip.DIST ? false : originalExists(p));
  try {
    let result;
    assert.doesNotThrow(() => { result = buildZip.build(); });
    assert.equal(result.attempted, false);
    assert.equal(result.skippedReason, 'no_dist');
    assert.equal(result.wrote, null);
  } finally {
    fs.existsSync = originalExists;
  }
});

test('build() packages every file currently in dist/print/ (except itself) into one zip, under one root folder', () => {
  const printFiles = buildPrint(); // fresh dist/print/, no zip yet
  const result = buildZip.build();

  assert.equal(result.attempted, true);
  assert.equal(result.wrote, buildZip.ZIP_NAME);
  assert.deepEqual(result.entries.slice().sort(), printFiles.slice().sort());

  const zipPath = path.join(buildZip.DIST, buildZip.ZIP_NAME);
  assert.ok(fs.existsSync(zipPath), 'expected the zip to be written into dist/print/');

  const buffer = fs.readFileSync(zipPath);
  const entries = readZipEntries(buffer);
  const entryNames = entries.map(e => e.name).sort();
  const expectedNames = printFiles.map(f => `${buildZip.ZIP_ROOT_FOLDER}/${f}`).sort();
  assert.deepEqual(entryNames, expectedNames);

  // Every entry's bytes round-trip byte-for-byte against the source file on disk.
  for (const entry of entries) {
    const base = entry.name.slice(`${buildZip.ZIP_ROOT_FOLDER}/`.length);
    const original = fs.readFileSync(path.join(buildZip.DIST, base));
    assert.ok(original.equals(entry.data), `${base}: zip entry bytes do not match the source file`);
  }
});

test('build() re-run does not zip a previous run\'s own zip into the new one', () => {
  buildPrint();
  buildZip.build();
  const second = buildZip.build(); // dist/print/ now already contains the first zip
  assert.ok(!second.entries.includes(buildZip.ZIP_NAME), 'the zip must never include itself as an entry');
});
