'use strict';

/**
 * sitemap.xml / robots.txt generation. Generated from
 * the actual list of filenames the site build wrote, never hand-maintained,
 * so it cannot drift from what's really on disk. Pure functions, no I/O --
 * the caller (src/web/buildSite.js) is responsible for actually writing the
 * returned strings to dist/.
 *
 * Excludes 404.html (the static-hosting error page, marked noindex -- never
 * a real destination) and anything under print/ (the downloadable pack,
 * relocated to dist/print/ with its own noindex + canonical pair --
 * these are near-verbatim duplicates of the web pages and
 * indexing both would be a self-inflicted duplicate-content problem).
 */

const { absoluteUrl, BUILD_DATE } = require('../site.js');
const { escapeHtml } = require('../render/html.js');

/**
 * Home page canonicalizes to the site root (https://.../) rather than
 * /index.html, matching the canonical URL index.html already declares for
 * itself -- this is the one place that distinction is applied for the
 * sitemap.
 */
function sitemapUrlFor(file) {
  return file === 'index.html' ? absoluteUrl('') : absoluteUrl(file);
}

/**
 * @param {string[]} files flat filenames as written to dist/ (any
 *   non-`.html` entries -- site.css, sitemap.xml, robots.txt, ads.txt -- are
 *   filtered out; they aren't pages). 404.html and anything under print/ are
 *   also filtered out here -- see file header.
 * @returns {Array<{file:string, loc:string, lastmod:string}>} sorted by
 *   filename, for deterministic output.
 */
function buildSitemapEntries(files) {
  return files
    .filter((f) => f.endsWith('.html') && f !== '404.html' && !f.startsWith('print/'))
    .slice()
    .sort()
    .map((f) => ({ file: f, loc: sitemapUrlFor(f), lastmod: BUILD_DATE }));
}

/**
 * @param {string[]} files see buildSitemapEntries
 * @returns {string} a complete sitemap.xml document (sitemaps.org 0.9
 *   schema). No priority/changefreq -- Google ignores both, so omitting
 *   them avoids shipping meaningless noise.
 */
function renderSitemapXml(files) {
  const entries = buildSitemapEntries(files);
  const urls = entries
    .map((e) => `  <url>\n    <loc>${escapeHtml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * @returns {string} robots.txt content: allow-all, pointing at the
 *   generated sitemap.xml. Served from the custom domain's root
 *   (https://lol-practice-system.com/robots.txt, per src/site.js's
 *   SITE_ORIGIN/BASE_PATH and the CNAME src/web/buildSite.js writes) --
 *   previously this file was only host-authoritative for the
 *   /solo-queue-practice/ sub-path, with GitHub controlling the real
 *   domain-root robots.txt at dylangerloski.github.io/.
 */
function robotsTxtContent() {
  return `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl('sitemap.xml')}\n`;
}

module.exports = {
  sitemapUrlFor,
  buildSitemapEntries,
  renderSitemapXml,
  robotsTxtContent
};
