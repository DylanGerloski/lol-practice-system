'use strict';

// dist/ads.txt content. Declares the same AdSense
// publisher id already configured in src/web/adConfig.js as the sole
// authorized seller of this site's ad inventory -- written unconditionally
// regardless of adConfig.enabled, since ads.txt is inert with no ad units
// live and becomes correct automatically the moment they are.
//
// RESOLVED: ads.txt is only read by
// crawlers from a domain root (https://<domain>/ads.txt), which the
// un-CNAME'd project-site URL (dylangerloski.github.io/solo-queue-practice/
// ads.txt) could never satisfy. Now that the site is served from the custom
// domain lol-practice-system.com (src/site.js SITE_ORIGIN, CNAME written by
// src/web/buildSite.js), this file lands at the real domain root
// (https://lol-practice-system.com/ads.txt) and is crawler-readable, once
// DNS has propagated to GitHub Pages.

const { client } = require('./adConfig.js');

// adConfig.client carries the 'ca-pub-...' form (the id used in-page, e.g.
// data-ad-client and the Auto ads loader's ?client= query param). ads.txt's
// own spec (https://iabtechlab.com/ads-txt/) requires the publisher id in
// its bare 'pub-...' form with no 'ca-' prefix -- the two are the same
// underlying id, just two different required formats for two different
// surfaces. Stripping the prefix here (rather than storing two separate
// constants) keeps adConfig.client as the single source of truth.
const PUBLISHER_ID = client.replace(/^ca-/, '');

function adsTxtContent() {
  return `# ads.txt for Solo Queue Practice\n# Declares authorized sellers of this site's ad inventory.\n# See https://iabtechlab.com/ads-txt/ for the spec.\ngoogle.com, ${PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`;
}

module.exports = { adsTxtContent };
