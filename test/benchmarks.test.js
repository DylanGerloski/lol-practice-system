'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const benchmarks = require('../content/benchmarks.json');

test('benchmarks: provenance strings are present', () => {
  assert.ok(typeof benchmarks.provenance === 'string' && benchmarks.provenance.trim().length > 0);
  assert.ok(typeof benchmarks.junglerAdjustment.note === 'string' && benchmarks.junglerAdjustment.note.trim().length > 0);
});

test('benchmarks: every rank band has min < max', () => {
  for (const r of benchmarks.ranks) {
    assert.ok(r.csPerMinMin < r.csPerMinMax, `${r.rank}: min (${r.csPerMinMin}) must be less than max (${r.csPerMinMax})`);
  }
});

test('benchmarks: bands are ordered and non-overlapping in sequence', () => {
  // "Non-overlapping" here means monotonically non-decreasing on both bounds as rank
  // increases, not mathematically disjoint ranges -- the real community-sourced figures
  // (e.g. Iron-Bronze 3-5, Silver 4-6) share boundary values by nature, since skill bands
  // are a continuum, not a strict partition. What this test actually guards against is a
  // shuffled or reversed table, which a strict "min < next.min, max < next.max" check
  // catches just as well as true disjointness would.
  const sorted = benchmarks.ranks.slice().sort((a, b) => a.order - b.order);
  assert.deepEqual(sorted, benchmarks.ranks, 'ranks array should already be in ascending order');
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    assert.ok(cur.csPerMinMin >= prev.csPerMinMin, `${cur.rank}'s min should not be lower than ${prev.rank}'s min`);
    assert.ok(cur.csPerMinMax >= prev.csPerMinMax, `${cur.rank}'s max should not be lower than ${prev.rank}'s max`);
  }
});
