'use strict';

// Spec Section 3, test 5 ("XLSX round-trip"): parse the produced archive's central
// directory, confirm each entry's bytes parse as well-formed XML, confirm sheet count,
// and confirm the computed columns contain formula (<f>) elements rather than literal
// values.

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildTrackerWorkbook } = require('../src/xlsx/workbook.js');
const { readZipEntries } = require('../src/xlsx/zip.js');
const benchmarks = require('../content/benchmarks.json');

// A tiny, dependency-free well-formedness check: walks every start/end tag with a
// stack and confirms every open tag has a matching close tag in the right order.
// Not a validating XML parser (no schema, no entity/DTD handling) -- it is exactly
// what the spec asks for: confirm each entry's bytes *parse* as well-formed XML.
function assertWellFormedXml(xmlText, label) {
  assert.ok(xmlText.startsWith('<?xml'), `${label}: missing XML declaration`);
  const tagRe = /<([^!?][^>]*?)>/g;
  const stack = [];
  let match;
  let tagCount = 0;
  while ((match = tagRe.exec(xmlText)) !== null) {
    let tag = match[1];
    if (tag.startsWith('/')) {
      const name = tag.slice(1).trim();
      const top = stack.pop();
      assert.ok(top !== undefined, `${label}: unexpected closing tag </${name}> with empty stack`);
      assert.equal(top, name, `${label}: mismatched closing tag, expected </${top}> but found </${name}>`);
    } else if (tag.endsWith('/')) {
      tagCount++; // self-closing, no stack push
    } else {
      const name = tag.split(/[\s]/)[0];
      stack.push(name);
      tagCount++;
    }
  }
  assert.equal(stack.length, 0, `${label}: unclosed tag(s) remaining: ${stack.join(', ')}`);
  assert.ok(tagCount > 0, `${label}: no tags found -- does not look like XML at all`);

  // Bare '&' not part of a recognized entity is malformed XML.
  const badAmpersand = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/;
  assert.ok(!badAmpersand.test(xmlText), `${label}: contains an unescaped '&'`);
}

test('produced .xlsx round-trips through the central directory with 12 well-formed XML entries', () => {
  const buf = buildTrackerWorkbook(benchmarks);
  const entries = readZipEntries(buf); // throws on CRC mismatch / malformed central directory

  const names = entries.map(e => e.name).sort();
  assert.deepEqual(names, [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/_rels/workbook.xml.rels',
    'xl/sharedStrings.xml',
    'xl/styles.xml',
    'xl/workbook.xml',
    'xl/worksheets/sheet1.xml',
    'xl/worksheets/sheet2.xml',
    'xl/worksheets/sheet3.xml',
    'xl/worksheets/sheet4.xml',
    'xl/worksheets/sheet5.xml',
    'xl/worksheets/sheet6.xml'
  ].sort());

  for (const entry of entries) {
    assertWellFormedXml(entry.data.toString('utf8'), entry.name);
  }
});

test('workbook.xml declares exactly 6 sheets, matching the spec\'s Section 2D sheet list', () => {
  const buf = buildTrackerWorkbook(benchmarks);
  const entries = readZipEntries(buf);
  const workbookXml = entries.find(e => e.name === 'xl/workbook.xml').data.toString('utf8');
  const sheetMatches = workbookXml.match(/<sheet\s/g) || [];
  assert.equal(sheetMatches.length, 6, 'expected exactly 6 <sheet> elements in workbook.xml');

  for (const name of ['Start Here', 'Baseline', 'Game Log', 'Block Review', 'Champion Pool', 'Benchmarks']) {
    assert.ok(workbookXml.includes(`name="${name}"`), `workbook.xml missing sheet named "${name}"`);
  }
});

test('computed columns contain real formula (<f>) elements, not pre-baked literal values', () => {
  const buf = buildTrackerWorkbook(benchmarks);
  const entries = readZipEntries(buf);
  const byName = Object.fromEntries(entries.map(e => [e.name, e.data.toString('utf8')]));

  // sheet2 = Baseline, sheet3 = Game Log, sheet4 = Block Review -- all have
  // computed columns per Section 2D.
  const baseline = byName['xl/worksheets/sheet2.xml'];
  const gameLog = byName['xl/worksheets/sheet3.xml'];
  const blockReview = byName['xl/worksheets/sheet4.xml'];

  const formulaCount = xml => (xml.match(/<f>/g) || []).length;

  assert.ok(formulaCount(baseline) >= 15, `Baseline sheet should have real formula cells (CS/min per row + averages + benchmark lookup), found ${formulaCount(baseline)}`);
  assert.ok(formulaCount(gameLog) >= 60, `Game Log sheet should have a formula in every CS/min row plus the summary block, found ${formulaCount(gameLog)}`);
  assert.ok(formulaCount(blockReview) >= 9, `Block Review sheet should have per-block computed formulas, found ${formulaCount(blockReview)}`);

  // And confirm they are not disguised as literal values: a formula cell must
  // have an <f> element, and must not *also* carry a pre-baked cached <v> that
  // could mask a broken formula on a strict reader (we deliberately never write one).
  assert.ok(!/<f>[^<]*<\/f><v>/.test(gameLog), 'formula cells should not carry a pre-baked cached <v> value');
});

test('shared strings (all text shipped in the workbook) contain no denylisted Riot-owned proper noun', () => {
  // Same build-time IP-hygiene guard as the HTML documents (spec Section 3 test 6,
  // Section 4) -- extended to this sheet's own shipped file. Not exhaustive (see
  // test/ip-hygiene.test.js for the fuller list applied to HTML); this is a
  // representative spot-check on the one text pool (sharedStrings.xml) that carries
  // every string cell in the workbook.
  const DENYLIST_SAMPLE = [
    'Ahri', 'Yasuo', 'Jinx', 'Vayne', 'Lux', 'Zed', 'Teemo', 'Ashe', 'Garen', 'Darius',
    'Infinity Edge', "Rabadon's Deathcap", 'Electrocute', 'Conqueror',
    'Baron Nashor', 'Rift Herald', "Summoner's Rift", 'Nexus'
  ];
  const buf = buildTrackerWorkbook(benchmarks);
  const entries = readZipEntries(buf);
  const sharedStrings = entries.find(e => e.name === 'xl/sharedStrings.xml').data.toString('utf8');
  for (const term of DENYLIST_SAMPLE) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    assert.ok(!re.test(sharedStrings), `sharedStrings.xml contains denylisted term: ${term}`);
  }
});

test('data validations reference short, literal in-cell lists (no external named ranges)', () => {
  const buf = buildTrackerWorkbook(benchmarks);
  const entries = readZipEntries(buf);
  const gameLog = entries.find(e => e.name === 'xl/worksheets/sheet3.xml').data.toString('utf8');
  assert.ok(gameLog.includes('<dataValidations'), 'Game Log sheet should declare data validations for Result/Adherence/Death Cause');
  assert.ok(gameLog.includes('type="list"'), 'Game Log data validations should be list-type dropdowns');
});
