'use strict';

/**
 * Build-time metadata correctness check: fails the whole web build loudly on
 * a missing/over-length <title>, a missing/over-length meta description, or
 * two pages sharing either one. Metadata correctness is a test, not a review
 * item.
 *
 * Operates on each page's already-rendered HTML (extracted with a regex)
 * rather than requiring every page-render function to separately report its
 * own title/description alongside its markup -- that keeps this decoupled
 * from how many render functions WEB_PAGES (src/web/buildSite.js) ends up
 * with, since more render functions may still be added to that array
 * concurrently with this task.
 *
 * Bounds mirror the same convention used on the human's other site: an upper cap plus a
 * cross-page duplicate check, deliberately with NO lower-bound/floor check
 * on description length. "140-160 characters" is a copywriting
 * target for whoever writes each page's description, not a build-breaking
 * gate here -- enforcing a hard floor would fail the build over placeholder
 * or in-progress copy on pages this task doesn't own, which is a worse
 * failure mode than a slightly-short-but-present description going out the
 * door once.
 */

const TITLE_RE = /<title>([^<]*)<\/title>/;
const DESCRIPTION_RE = /<meta name="description" content="([^"]*)">/;

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

/**
 * @param {string} file
 * @param {string} html full rendered document for one page
 * @returns {{file:string, title:string|null, description:string|null}} the
 *   raw (still HTML-escaped) <title> text and description attribute value.
 *   Escaped is fine for duplicate-detection purposes -- two descriptions
 *   that are identical before escaping are still identical after it.
 */
function extractMetadata(file, html) {
  const titleMatch = TITLE_RE.exec(html);
  const descriptionMatch = DESCRIPTION_RE.exec(html);
  return {
    file,
    title: titleMatch ? titleMatch[1] : null,
    description: descriptionMatch ? descriptionMatch[1] : null
  };
}

/**
 * @param {Array<{file:string, html:string}>} pages every rendered HTML page
 *   (non-HTML build outputs like site.css/sitemap.xml/robots.txt/ads.txt
 *   must not be passed in -- they have no <title>/description to check).
 * @throws {Error} on the first violation found, naming the offending file(s).
 */
function assertPageMetadata(pages) {
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const { file, html } of pages) {
    const { title, description } = extractMetadata(file, html);

    if (!title) {
      throw new Error(`assertPageMetadata: ${file} has no <title>`);
    }
    if (title.length > TITLE_MAX) {
      throw new Error(`assertPageMetadata: ${file}'s title is ${title.length} chars, over the ${TITLE_MAX}-char cap: "${title}"`);
    }
    if (seenTitles.has(title)) {
      throw new Error(`assertPageMetadata: duplicate title between ${seenTitles.get(title)} and ${file}: "${title}"`);
    }
    seenTitles.set(title, file);

    if (!description) {
      throw new Error(`assertPageMetadata: ${file} has no meta description`);
    }
    if (description.length > DESCRIPTION_MAX) {
      throw new Error(`assertPageMetadata: ${file}'s meta description is ${description.length} chars, over the ${DESCRIPTION_MAX}-char cap: "${description}"`);
    }
    if (seenDescriptions.has(description)) {
      throw new Error(`assertPageMetadata: duplicate meta description between ${seenDescriptions.get(description)} and ${file}`);
    }
    seenDescriptions.set(description, file);
  }
}

module.exports = { extractMetadata, assertPageMetadata, TITLE_MAX, DESCRIPTION_MAX };
