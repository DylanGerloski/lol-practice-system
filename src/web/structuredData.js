'use strict';

/**
 * schema.org JSON-LD builders. Every
 * function here returns a ready-to-embed
 * `<script type="application/ld+json">...</script>` string, built with
 * jsonLdScript() below so escaping is handled in exactly one place.
 *
 * Only three types are used: Article (every content page), FAQPage
 * (faq.html only), and WebSite (index.html only, no SearchAction -- there is
 * no on-site search). Deliberately NO HowTo on the drill/warmup pages --
 * Google removed HowTo rich results, so the markup would buy nothing and
 * only create a mismatch risk.
 *
 * A page render module wires one of these into documentShell({ jsonLd })
 * (src/web/shell.js) itself -- this module only builds the string.
 */

const { SITE_NAME } = require('../site.js');

/**
 * Serializes `obj` as JSON-LD and wraps it in a <script> tag. Escapes every
 * `<` as its unicode escape so a `</script` sequence occurring inside a
 * title/description string can never prematurely close the tag or otherwise
 * confuse an HTML parser -- a standard, simple technique for embedding JSON
 * inside a <script> block.
 */
function jsonLdScript(obj) {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Plain-text version of a small HTML snippet, for schema.org fields (like
 * FAQPage's Answer.text) that expect text rather than markup. Strips tags
 * and decodes exactly the entities src/render/html.js's escapeHtml()
 * produces (&amp; &lt; &gt; &quot; &#39;) -- this codebase writes literal
 * unicode em dashes/curly quotes/arrows directly in prose rather than named
 * HTML entities, so there is nothing else to decode.
 */
function stripHtmlToText(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Article JSON-LD for one content page. `authorName`/`publisherName` default
 * to SITE_NAME as an Organization, never an invented person byline --
 * nobody involved is a named, reviewed human
 * author, so attributing one would be a false claim.
 *
 * @param {object} opts
 * @param {string} opts.headline
 * @param {string} opts.description
 * @param {string} opts.datePublished ISO date (YYYY-MM-DD)
 * @param {string} opts.dateModified ISO date (YYYY-MM-DD)
 * @param {string} opts.url absolute canonical URL of this page
 * @param {string} [opts.authorName]
 * @param {string} [opts.publisherName]
 */
function articleJsonLd({ headline, description, datePublished, dateModified, url, authorName = SITE_NAME, publisherName = SITE_NAME }) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    datePublished,
    dateModified,
    author: { '@type': 'Organization', name: authorName },
    publisher: { '@type': 'Organization', name: publisherName },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }
  });
}

/**
 * FAQPage JSON-LD. Only ever attach this to faq.html -- Google removed FAQ
 * rich results entirely, so this is included once for search/LLM crawler
 * parsing value, not as a rich-result bet; spreading it across other pages
 * would be exactly the kind of markup abuse search engines penalize.
 *
 * @param {Array<{question:string, answerHtml:string}>} faqs question/answer
 *   pairs matching the visible FAQ text verbatim.
 */
function faqPageJsonLd(faqs) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: stripHtmlToText(f.answerHtml) }
    }))
  });
}

/**
 * WebSite JSON-LD for index.html only. Deliberately no `potentialAction`
 * sitelinks searchbox -- this site has no on-site search, and Google
 * retired the feature anyway.
 *
 * @param {object} opts
 * @param {string} opts.url absolute site root URL
 * @param {string} [opts.name]
 * @param {string} [opts.description]
 */
function websiteJsonLd({ url, name = SITE_NAME, description }) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    ...(description ? { description } : {})
  });
}

module.exports = {
  jsonLdScript,
  stripHtmlToText,
  articleJsonLd,
  faqPageJsonLd,
  websiteJsonLd
};
