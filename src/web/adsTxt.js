'use strict';

// dist/ads.txt content (spec Section 1.4). Declares the same AdSense
// publisher id already configured in src/web/adConfig.js as the sole
// authorized seller of this site's ad inventory -- written unconditionally
// regardless of adConfig.enabled, since ads.txt is inert with no ad units
// live and becomes correct automatically the moment they are.
//
// RESOLVED (was spec Section 5.2 OPEN RISKS): ads.txt is only read by
// crawlers from a domain root (https://<domain>/ads.txt), which the
// un-CNAME'd project-site URL (dylangerloski.github.io/solo-queue-practice/
// ads.txt) could never satisfy. Now that the site is served from the custom
// domain lol-practice-system.com (src/site.js SITE_ORIGIN, CNAME written by
// src/web/buildSite.js), this file lands at the real domain root
// (https://lol-practice-system.com/ads.txt) and is crawler-readable, once
// DNS has propagated to GitHub Pages.

const { client } = require('./adConfig.js');

function adsTxtContent() {
  return `# ads.txt for Solo Queue Practice\n# Declares authorized sellers of this site's ad inventory.\n# See https://iabtechlab.com/ads-txt/ for the spec.\ngoogle.com, ${client}, DIRECT, f08c47fec0942fa0\n`;
}

module.exports = { adsTxtContent };
