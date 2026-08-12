'use strict';

// Ad configuration (spec Section 1.4). `enabled` stays false until the human
// creates real ad units in AdSense and supplies the slot ids -- that's an
// ALWAYS ESCALATE step (account/ToS action), not something a build does on
// its own. With enabled:false (or a null slot id), src/web/ads.js renders
// the same reserved-height placeholder with no script tag at all, so local
// builds, visual-QA screenshots, and Lighthouse runs stay deterministic and
// ad-free until a human flips this on.

module.exports = {
  enabled: false,
  client: 'ca-pub-9767914878112531',
  slots: {
    inContentTop: null,
    inContentMid: null,
    contentEnd: null
  }
};
