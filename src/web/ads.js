'use strict';

// Renders ad-slot placeholders and the AdSense loader script, gated entirely
// by src/web/adConfig.js. No network calls, no ToS
// action -- this module only emits static markup.

const adConfig = require('./adConfig.js');

/**
 * @param {'inContentTop'|'inContentMid'|'contentEnd'} slotName
 * @returns {string} an <aside class="ad-slot"> block. When adConfig.enabled
 *   is true and this slot has a real slot id, emits the standard responsive
 *   AdSense unit. Otherwise emits the same reserved-height placeholder with
 *   NO <script> tag at all, so a disabled build is fully deterministic.
 */
function adSlot(slotName) {
  const slotId = adConfig.slots[slotName];
  if (adConfig.enabled && slotId) {
    return `<aside class="ad-slot" aria-label="Advertisement">
  <span class="ad-slot-label">Advertisement</span>
  <ins class="adsbygoogle" style="display:block" data-ad-client="${adConfig.client}" data-ad-slot="${slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</aside>`;
  }
  return `<aside class="ad-slot" aria-label="Advertisement">
  <span class="ad-slot-label">Advertisement</span>
</aside>`;
}

/**
 * @returns {string} the async adsbygoogle.js loader <script> tag, or '' when
 *   ads are disabled -- so a disabled build never even references the
 *   third-party script.
 */
function adsScriptTag() {
  if (!adConfig.enabled) return '';
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.client}" crossorigin="anonymous"></script>`;
}

module.exports = { adSlot, adsScriptTag };
