'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMetadata, assertPageMetadata, TITLE_MAX, DESCRIPTION_MAX } = require('../src/web/assertMetadata.js');

function pageHtml({ title, description }) {
  const titleTag = title === undefined ? '' : `<title>${title}</title>`;
  const descTag = description === undefined ? '' : `<meta name="description" content="${description}">`;
  return `<!doctype html><html><head>${titleTag}${descTag}</head><body></body></html>`;
}

test('extractMetadata pulls the <title> text and description attribute out of a rendered page', () => {
  const html = pageHtml({ title: 'Drills | Solo Queue Practice', description: 'Practice drills for solo queue.' });
  const meta = extractMetadata('drills.html', html);
  assert.equal(meta.title, 'Drills | Solo Queue Practice');
  assert.equal(meta.description, 'Practice drills for solo queue.');
});

test('assertPageMetadata passes for a normal, distinct set of pages', () => {
  assert.doesNotThrow(() => assertPageMetadata([
    { file: 'a.html', html: pageHtml({ title: 'Page A | Solo Queue Practice', description: 'Description for page A, long enough to be meaningful.' }) },
    { file: 'b.html', html: pageHtml({ title: 'Page B | Solo Queue Practice', description: 'Description for page B, also long enough to be meaningful.' }) }
  ]));
});

test('assertPageMetadata throws loudly when a page has no <title> at all', () => {
  assert.throws(
    () => assertPageMetadata([{ file: 'broken.html', html: pageHtml({ description: 'A description with no title tag present at all here.' }) }]),
    /broken\.html has no <title>/
  );
});

test('assertPageMetadata throws loudly on a deliberately broken (missing) description', () => {
  assert.throws(
    () => assertPageMetadata([{ file: 'broken.html', html: pageHtml({ title: 'Broken Page | Solo Queue Practice' }) }]),
    /broken\.html has no meta description/
  );
});

test(`assertPageMetadata throws when a title exceeds the ${TITLE_MAX}-char cap`, () => {
  const longTitle = 'A'.repeat(TITLE_MAX + 1);
  assert.throws(
    () => assertPageMetadata([{ file: 'long.html', html: pageHtml({ title: longTitle, description: 'A perfectly fine description that is long enough.' }) }]),
    new RegExp(`over the ${TITLE_MAX}-char cap`)
  );
});

test(`assertPageMetadata throws when a description exceeds the ${DESCRIPTION_MAX}-char cap`, () => {
  const longDescription = 'A'.repeat(DESCRIPTION_MAX + 1);
  assert.throws(
    () => assertPageMetadata([{ file: 'long.html', html: pageHtml({ title: 'Long Description Page | Solo Queue Practice', description: longDescription }) }]),
    new RegExp(`over the ${DESCRIPTION_MAX}-char cap`)
  );
});

test('assertPageMetadata throws on two pages sharing the exact same title', () => {
  const dupe = 'Duplicate Title | Solo Queue Practice';
  assert.throws(
    () => assertPageMetadata([
      { file: 'a.html', html: pageHtml({ title: dupe, description: 'Description for page A, long enough to be meaningful.' }) },
      { file: 'b.html', html: pageHtml({ title: dupe, description: 'Description for page B, also long enough to be meaningful.' }) }
    ]),
    /duplicate title between a\.html and b\.html/
  );
});

test('assertPageMetadata throws on two pages sharing the exact same description', () => {
  const dupe = 'The exact same description text, copy-pasted onto a second page by mistake.';
  assert.throws(
    () => assertPageMetadata([
      { file: 'a.html', html: pageHtml({ title: 'Page A | Solo Queue Practice', description: dupe }) },
      { file: 'b.html', html: pageHtml({ title: 'Page B | Solo Queue Practice', description: dupe }) }
    ]),
    /duplicate meta description between a\.html and b\.html/
  );
});
