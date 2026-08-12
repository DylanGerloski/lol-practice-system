'use strict';

// Link-hygiene test for the whole built site (URL hygiene): no http:// link, no
// index.html in any href, and no dead internal link -- across every .html
// file the build writes, both dist/*.html (the web site) and
// dist/print/*.html (the print pack). Builds both fresh before asserting,
// same order as `npm run build:all`.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { build: buildPrint } = require('../src/build.js');
const { build: buildSite, DIST } = require('../src/web/buildSite.js');
const site = require('../src/site.js');

function listHtmlFilesRecursive(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listHtmlFilesRecursive(full));
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function extractHrefs(html) {
  return [...html.matchAll(/href="([^"]*)"/g)].map(m => m[1]);
}

function extractIds(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
}

// Build both halves once, fresh, and cache every .html file's content and
// its own set of anchor ids -- reused across every assertion below rather
// than re-reading disk per href.
buildPrint();
buildSite();

const allHtmlFiles = [
  ...listHtmlFilesRecursive(DIST) // includes dist/print/ (nested under DIST)
].filter((f, i, arr) => arr.indexOf(f) === i);

const filesByRelPath = new Map(
  allHtmlFiles.map(f => [path.relative(DIST, f).split(path.sep).join('/'), fs.readFileSync(f, 'utf8')])
);

test('sanity: the build actually produced both web pages and print pages to check', () => {
  const relPaths = [...filesByRelPath.keys()];
  assert.ok(relPaths.includes('index.html'), 'expected dist/index.html to exist');
  assert.ok(relPaths.some(p => p.startsWith('print/')), 'expected dist/print/*.html to exist');
  assert.ok(relPaths.length >= 15, `expected at least 15 html files across web + print, found ${relPaths.length}`);
});

test('no href anywhere in the built output uses http:// (must be https, root-relative, mailto, or a fragment)', () => {
  for (const [relPath, html] of filesByRelPath) {
    for (const href of extractHrefs(html)) {
      assert.ok(!href.startsWith('http://'), `${relPath} has an http:// href: ${href}`);
    }
  }
});

test('no href anywhere in the built output points at index.html', () => {
  for (const [relPath, html] of filesByRelPath) {
    for (const href of extractHrefs(html)) {
      assert.ok(!href.includes('index.html'), `${relPath} has an href containing index.html: ${href}`);
    }
  }
});

test('every internal href (under the site base path) resolves to a file that was actually written', () => {
  // Checked against disk (fs.existsSync), not just the .html file map above
  // -- downloads.html links to non-.html assets too (the .xlsx workbook,
  // per-document .pdf files), which are real, legitimate targets that this
  // dead-link check must not misclassify as missing just because they
  // aren't HTML.
  for (const [relPath, html] of filesByRelPath) {
    for (const href of extractHrefs(html)) {
      if (!href.startsWith(site.BASE_PATH)) continue; // external, mailto, or same-page fragment
      const withoutBase = href.slice(site.BASE_PATH.length);
      const [filePart] = withoutBase.split('#');
      // site.url('') (the home link) resolves to the directory root, which
      // is index.html on disk -- the one legitimate case where an empty
      // filePart is not a dead link.
      const targetRelPath = filePart === '' ? 'index.html' : filePart;
      const targetOnDisk = path.join(DIST, ...targetRelPath.split('/'));
      assert.ok(
        fs.existsSync(targetOnDisk),
        `${relPath} links to "${href}" (resolves to dist/${targetRelPath}), which was not written by the build`
      );
    }
  }
});

test('every fragment (#id) in an internal or same-page href resolves to a real anchor id on its target page', () => {
  for (const [relPath, html] of filesByRelPath) {
    for (const href of extractHrefs(html)) {
      if (!href.includes('#')) continue;
      const hashIndex = href.indexOf('#');
      const beforeHash = href.slice(0, hashIndex);
      const fragment = href.slice(hashIndex + 1);
      if (!fragment) continue; // bare "#" or trailing "#", not a real anchor reference

      let targetRelPath;
      if (beforeHash === '') {
        targetRelPath = relPath; // same-page fragment, e.g. "#main", "#drills-top"
      } else if (beforeHash.startsWith(site.BASE_PATH)) {
        const filePart = beforeHash.slice(site.BASE_PATH.length);
        targetRelPath = filePart === '' ? 'index.html' : filePart;
      } else {
        continue; // external link with a fragment -- not ours to resolve
      }

      const targetHtml = filesByRelPath.get(targetRelPath);
      assert.ok(targetHtml, `${relPath} links to fragment "${href}" but dist/${targetRelPath} was not written by the build`);
      const ids = extractIds(targetHtml);
      assert.ok(
        ids.has(fragment),
        `${relPath} links to "${href}", but dist/${targetRelPath} has no element with id="${fragment}" -- dead anchor`
      );
    }
  }
});
