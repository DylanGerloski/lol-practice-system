'use strict';

// Tests for src/web/adsTxt.js. Google's ads.txt spec
// (https://iabtechlab.com/ads-txt/) requires the publisher id in its bare
// 'pub-...' form -- the 'ca-pub-...' form (used in-page for data-ad-client
// and the Auto ads loader script) is a different, invalid format here and
// can make Google's crawler fail to match declared sellers, which silently
// suppresses ad serving.

const test = require('node:test');
const assert = require('node:assert/strict');

const { adsTxtContent } = require('../src/web/adsTxt.js');
const adConfig = require('../src/web/adConfig.js');

test('adsTxtContent declares the publisher id in bare pub-... form, never ca-pub-...', () => {
  const content = adsTxtContent();
  assert.ok(adConfig.client.startsWith('ca-pub-'), 'test assumption: adConfig.client is in ca-pub-... form');
  const expectedPubId = adConfig.client.replace(/^ca-/, '');
  assert.ok(expectedPubId.startsWith('pub-'), 'stripped id should start with pub-');
  assert.ok(
    content.includes(`google.com, ${expectedPubId}, DIRECT, f08c47fec0942fa0`),
    `ads.txt should declare "google.com, ${expectedPubId}, DIRECT, f08c47fec0942fa0", got: ${content}`
  );
  assert.ok(!content.includes('ca-pub-'), 'ads.txt must never contain the ca-pub- prefixed form');
});

test('adsTxtContent still carries the required header comments and spec reference', () => {
  const content = adsTxtContent();
  assert.ok(content.includes('# ads.txt for Solo Queue Practice'));
  assert.ok(content.includes('https://iabtechlab.com/ads-txt/'));
});
