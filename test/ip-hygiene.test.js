'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const drills = require('../content/drills.json');
const focuses = require('../content/focuses.json');
const warmups = require('../content/warmups.json');
const guide = require('../content/guide.js');
const { build, DIST } = require('../src/build.js');
const { RIOT_DISCLAIMER, TRADEMARK_NOTICE } = require('../src/site.js');

// A representative denylist of Riot-owned proper nouns: champion names, named items,
// named runes, and named map objectives/locations. Not exhaustive (League has 160+
// champions) -- this is the build-time guard the spec calls for (Section 3, test 6), sized
// to catch an accidental slip, not a certified complete trademark audit.
const DENYLIST = [
  // Champions (representative spread across roles/eras)
  'Ahri', 'Yasuo', 'Yone', 'Jinx', 'Vayne', 'Lux', 'Zed', 'Teemo', 'Ashe', 'Garen',
  'Darius', 'Katarina', 'Ezreal', 'Lee Sin', 'Thresh', 'Leona', 'Malphite', 'Riven',
  'Akali', 'Kayn', 'Draven', 'Sett', 'Vex', 'Aphelios', 'Samira', 'Zeri', 'Nilah',
  'Briar', 'Naafiri', 'Milio', 'Vi', 'Jayce', 'Caitlyn', 'Yuumi', 'Seraphine',
  // Items
  "Infinity Edge", "Rabadon's Deathcap", "Doran's Blade", "Doran's Ring", "Doran's Shield",
  'Bloodthirster', 'Blade of the Ruined King', 'Kraken Slayer', 'Trinity Force',
  'Sunfire Aegis', 'Thornmail', "Zhonya's Hourglass", 'Guardian Angel', "Mercury's Treads",
  // Runes
  'Electrocute', 'Conqueror', 'Grasp of the Undying', 'Aftershock', 'Phase Rush',
  'Summon Aery', 'Arcane Comet', 'Dark Harvest', 'Predator',
  // Named map locations/objectives (generic "dragon"/"baron"/"herald" as gameplay nouns
  // are allowed per the spec's own IP-hygiene section; these are the specific proper names)
  'Baron Nashor', 'Rift Herald', "Summoner's Rift", 'Nexus'
];

function collectStrings(value, out) {
  if (typeof value === 'string') { out.push(value); return; }
  if (Array.isArray(value)) { value.forEach(v => collectStrings(v, out)); return; }
  if (value && typeof value === 'object') { Object.values(value).forEach(v => collectStrings(v, out)); }
}

function findHits(haystack, needle) {
  const re = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return re.test(haystack);
}

test('no content JSON/JS record contains a denylisted Riot-owned proper noun', () => {
  const strings = [];
  collectStrings(drills, strings);
  collectStrings(focuses, strings);
  collectStrings(warmups, strings);
  collectStrings(guide.sections, strings);
  const blob = strings.join('\n');
  for (const term of DENYLIST) {
    assert.ok(!findHits(blob, term), `content contains denylisted term: ${term}`);
  }
});

test('no rendered HTML output contains a denylisted Riot-owned proper noun', () => {
  build();
  const files = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
  assert.ok(files.length > 0, 'expected at least one built HTML file');
  for (const f of files) {
    const content = fs.readFileSync(path.join(DIST, f), 'utf8');
    for (const term of DENYLIST) {
      assert.ok(!findHits(content, term), `${f} contains denylisted term: ${term}`);
    }
  }
});

test('every rendered HTML document carries the disclaimer footer line', () => {
  build();
  const files = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
  for (const f of files) {
    const content = fs.readFileSync(path.join(DIST, f), 'utf8');
    assert.ok(
      content.includes(`${RIOT_DISCLAIMER} ${TRADEMARK_NOTICE}`),
      `${f} missing the exact disclaimer line`
    );
  }
});
