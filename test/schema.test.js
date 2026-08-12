'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const drills = require('../content/drills.json');
const focuses = require('../content/focuses.json');
const warmups = require('../content/warmups.json');

test('every drill has all 8 required slots, non-empty', () => {
  const requiredStringSlots = ['name', 'skillTrained', 'where', 'duration', 'passBar', 'progression', 'commonFailure'];
  assert.equal(drills.length, 12, 'spec calls for exactly 12 drills');
  for (const d of drills) {
    for (const slot of requiredStringSlots) {
      assert.ok(typeof d[slot] === 'string' && d[slot].trim().length > 0, `drill ${d.id} missing/empty slot: ${slot}`);
    }
    assert.ok(Array.isArray(d.procedure) && d.procedure.length > 0, `drill ${d.id} procedure must be a non-empty array`);
    assert.ok(d.procedure.length <= 5, `drill ${d.id} procedure has more than 5 steps (spec caps procedure at 5 numbered steps)`);
    for (const step of d.procedure) {
      assert.ok(typeof step === 'string' && step.trim().length > 0, `drill ${d.id} has an empty procedure step`);
    }
  }
});

test('every focus card has its number and graduation bar, and resolves to a real drill', () => {
  const drillIds = new Set(drills.map(d => d.id));
  assert.equal(focuses.length, 12, 'spec calls for exactly 12 focus cards, one per drill');
  for (const f of focuses) {
    for (const field of ['title', 'whatItIs', 'theNumber', 'graduationBar', 'drillId']) {
      assert.ok(typeof f[field] === 'string' && f[field].trim().length > 0, `focus ${f.id} missing/empty field: ${field}`);
    }
    assert.ok(drillIds.has(f.drillId), `focus ${f.id} references unknown drillId ${f.drillId}`);
  }
  const usedDrillIds = new Set(focuses.map(f => f.drillId));
  assert.equal(usedDrillIds.size, 12, 'each of the 12 drills should be trained by exactly one focus card');
});

test('every warmup fits the 3-block shape plus both rules', () => {
  assert.equal(warmups.length, 5, 'spec calls for exactly 5 warmup cards (universal, solo-lane, adc, support, jungle)');
  for (const w of warmups) {
    assert.ok(typeof w.title === 'string' && w.title.length > 0, `warmup ${w.id} missing title`);
    assert.ok(typeof w.role === 'string' && w.role.length > 0, `warmup ${w.id} missing role`);
    for (const blockName of ['physical', 'mechanical', 'mentalReset']) {
      const block = w.blocks && w.blocks[blockName];
      assert.ok(block, `warmup ${w.id} missing block: ${blockName}`);
      assert.ok(typeof block.duration === 'string' && block.duration.length > 0, `warmup ${w.id} block ${blockName} missing duration`);
      assert.ok(typeof block.description === 'string' && block.description.length > 0, `warmup ${w.id} block ${blockName} missing description`);
    }
    assert.ok(typeof w.startWithinRule === 'string' && w.startWithinRule.length > 0, `warmup ${w.id} missing startWithinRule`);
    assert.ok(typeof w.sameSettingsRule === 'string' && w.sameSettingsRule.length > 0, `warmup ${w.id} missing sameSettingsRule`);
  }
});
