'use strict';

// tokens.css assigns every color ROLE (--paper, --ink, --accent, etc.)
// twice for the light case -- once in the :root[data-theme="light"] block
// (the theme toggle) and once in the @media print block (belt-and-braces
// path for any context that reaches print.css without the print pack's
// own data-theme="light" attribute already present, see
// src/render/pages.js). Both blocks are meant to assign the SAME ramp
// index to every role; this test is the drift check that agreement needs,
// since it's the only thing keeping the two blocks from silently
// diverging over time.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const TOKENS_PATH = path.join(__dirname, '..', 'src', 'web', 'tokens.css');
const css = fs.readFileSync(TOKENS_PATH, 'utf8');

const ROLE_NAMES = [
  'paper', 'surface', 'ink', 'muted', 'rule', 'border',
  'accent', 'accent-hover', 'accent-rule', 'on-accent',
  'good', 'warn', 'focus-ring'
];

function extractBlock(source, startPattern) {
  const start = source.search(startPattern);
  assert.ok(start !== -1, `expected to find a block matching ${startPattern}`);
  const braceOpen = source.indexOf('{', start);
  assert.ok(braceOpen !== -1, 'expected an opening brace after the block selector');
  const braceClose = source.indexOf('}', braceOpen);
  assert.ok(braceClose !== -1, 'expected a closing brace for the block');
  return source.slice(braceOpen + 1, braceClose);
}

function extractRoles(blockSource) {
  const roles = {};
  for (const role of ROLE_NAMES) {
    const re = new RegExp(`--${role}:\\s*([^;]+);`);
    const match = re.exec(blockSource);
    if (match) roles[role] = match[1].trim();
  }
  return roles;
}

test('every color role is assigned in both the light-theme block and the print block', () => {
  const lightBlock = extractBlock(css, /:root\[data-theme="light"\]\s*\{/);
  const lightRoles = extractRoles(lightBlock);
  for (const role of ROLE_NAMES) {
    assert.ok(lightRoles[role], `light-theme block is missing --${role}`);
  }
});

test('the light-theme block and the @media print block assign the identical ramp value to every color role', () => {
  const lightBlock = extractBlock(css, /:root\[data-theme="light"\]\s*\{/);
  const printOuterStart = css.search(/@media print\s*\{/);
  assert.ok(printOuterStart !== -1, 'expected an @media print block in tokens.css');
  const printRootStart = css.indexOf(':root', printOuterStart);
  assert.ok(printRootStart !== -1, 'expected a :root block inside @media print');
  const printBlock = extractBlock(css.slice(printRootStart), /:root\s*\{/);

  const lightRoles = extractRoles(lightBlock);
  const printRoles = extractRoles(printBlock);

  for (const role of ROLE_NAMES) {
    assert.ok(printRoles[role], `@media print block is missing --${role}`);
    assert.equal(
      printRoles[role],
      lightRoles[role],
      `--${role} disagrees between the light-theme block (${lightRoles[role]}) and the print block (${printRoles[role]})`
    );
  }
});
