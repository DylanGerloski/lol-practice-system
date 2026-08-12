'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { jsonLdScript, stripHtmlToText, articleJsonLd, faqPageJsonLd, websiteJsonLd } = require('../src/web/structuredData.js');

/** Pulls the JSON payload back out of a `<script type="application/ld+json">...</script>` block. */
function parseJsonLdScript(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'expected a JSON-LD <script> block');
  return JSON.parse(match[1]);
}

test('jsonLdScript emits valid JSON inside a script tag, and escapes "<" so a "</script" sequence in content cannot break out', () => {
  const html = jsonLdScript({ name: 'a </script> b' });
  assert.match(html, /^<script type="application\/ld\+json">.*<\/script>$/);
  const parsed = parseJsonLdScript(html);
  assert.equal(parsed.name, 'a </script> b'); // round-trips correctly despite the escaping
  const inner = html.slice('<script type="application/ld+json">'.length, -'</script>'.length);
  assert.doesNotMatch(inner, /<\/script/);
});

test('stripHtmlToText strips tags and decodes exactly the entities escapeHtml() produces', () => {
  assert.equal(stripHtmlToText('<p>CS &amp; gold &#39;per minute&#39;</p>'), "CS & gold 'per minute'");
  assert.equal(stripHtmlToText('<p>Tom &amp; Jerry &lt;3&gt;</p>'), 'Tom & Jerry <3>');
});

test('articleJsonLd produces a valid Article block with an Organization author/publisher, never an invented person', () => {
  const html = articleJsonLd({
    headline: 'CS per Minute by Rank',
    description: 'A benchmarks guide',
    datePublished: '2026-08-12',
    dateModified: '2026-08-12',
    url: 'https://dylangerloski.github.io/solo-queue-practice/baseline.html'
  });
  const ld = parseJsonLdScript(html);
  assert.equal(ld['@type'], 'Article');
  assert.equal(ld.author['@type'], 'Organization');
  assert.equal(ld.author.name, 'Solo Queue Practice');
  assert.equal(ld.publisher['@type'], 'Organization');
  assert.equal(ld.mainEntityOfPage['@id'], 'https://dylangerloski.github.io/solo-queue-practice/baseline.html');
});

test('faqPageJsonLd converts every faq answerHtml to plain text and preserves question order', () => {
  const html = faqPageJsonLd([
    { question: 'Is this free?', answerHtml: '<p>Yes &mdash; no email &amp; no payment.</p>' },
    { question: 'How often is it updated?', answerHtml: '<p>Whenever the program changes.</p>' }
  ]);
  const ld = parseJsonLdScript(html);
  assert.equal(ld['@type'], 'FAQPage');
  assert.equal(ld.mainEntity.length, 2);
  assert.equal(ld.mainEntity[0].name, 'Is this free?');
  assert.equal(ld.mainEntity[0]['@type'], 'Question');
  assert.equal(ld.mainEntity[0].acceptedAnswer['@type'], 'Answer');
  assert.doesNotMatch(ld.mainEntity[0].acceptedAnswer.text, /<[a-z]/i);
  assert.match(ld.mainEntity[0].acceptedAnswer.text, /no email & no payment/);
});

test('websiteJsonLd emits a single WebSite block with no sitelinks searchbox action', () => {
  const html = websiteJsonLd({ url: 'https://dylangerloski.github.io/solo-queue-practice/', description: 'tagline' });
  const ld = parseJsonLdScript(html);
  assert.equal(ld['@type'], 'WebSite');
  assert.equal(ld.url, 'https://dylangerloski.github.io/solo-queue-practice/');
  assert.equal(ld.description, 'tagline');
  assert.equal(ld.potentialAction, undefined);
});
