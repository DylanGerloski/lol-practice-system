'use strict';

// dist/ads.txt content (spec Section 1.4). Declares the same AdSense
// publisher id already configured in src/web/adConfig.js as the sole
// authorized seller of this site's ad inventory -- written unconditionally
// regardless of adConfig.enabled, since ads.txt is inert with no ad units
// live and becomes correct automatically the moment they are.
//
// KNOWN LIMITATION (spec Section 5.2 OPEN RISKS): ads.txt is only read by
// crawlers from a domain root (https://<domain>/ads.txt). On a GitHub Pages
// project site (dylangerloski.github.io/solo-queue-practice/) this file
// exists at /solo-queue-practice/ads.txt and goes effectively unread. It
// ships anyway -- it costs nothing, and becomes correct the moment a custom
// domain lands. See the human action items in the spec for the two ways to
// fix this (a custom domain, or a root dylangerloski.github.io user-pages
// repo serving a combined ads.txt).

const { client } = require('./adConfig.js');

function adsTxtContent() {
  return `# ads.txt for Solo Queue Practice\n# Declares authorized sellers of this site's ad inventory.\n# See https://iabtechlab.com/ads-txt/ for the spec.\ngoogle.com, ${client}, DIRECT, f08c47fec0942fa0\n`;
}

module.exports = { adsTxtContent };
