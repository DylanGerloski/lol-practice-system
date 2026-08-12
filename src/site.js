'use strict';

/**
 * Site-wide constants for the web build: one place to change origin/base-path/
 * branding so a future custom-domain move is a one-line edit plus a rebuild,
 * not a grep-and-replace across every page template. Pure data, no I/O --
 * safe to require from anywhere.
 *
 * BASE_PATH is '/' because this site is served from a custom domain
 * (lol-practice-system.com) via the CNAME file src/web/buildSite.js writes
 * into dist/. GitHub Pages always serves a CNAME'd custom domain from its
 * root, regardless of whether the underlying repo is a project site or a
 * user/org root site -- there is no repo-name path segment once a custom
 * domain is attached, unlike the un-CNAME'd dylangerloski.github.io/
 * solo-queue-practice/ URL this site shipped under before the domain moved.
 * Every internal link and every canonical URL must go through url() or
 * absoluteUrl() -- no hardcoded paths anywhere else in the web build.
 */

const SITE_ORIGIN = 'https://lol-practice-system.com';
const BASE_PATH = '/';
const SITE_NAME = 'Solo Queue Practice';
const SITE_TAGLINE = 'A free 30-day deliberate-practice program for League of Legends solo queue: one focus per game, measured, reviewed, and logged.';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Riot's fan-content policy ("Legal Jibber Jabber") requires this exact
// wording, and it must appear on every output this project produces -- the
// print pack (src/render/pages.js) and the web build (src/web/shell.js)
// both import these two constants rather than each defining their own copy,
// so the two outputs can never drift out of sync with each other or with
// Riot's supplied text.
const RIOT_DISCLAIMER = 'Solo Queue Practice System was created under Riot Games’ “Legal Jibber Jabber” policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.';
const TRADEMARK_NOTICE = 'League of Legends is a trademark of Riot Games, Inc.';

/**
 * @param {string} [file] a flat filename as written to dist/, e.g. 'drills.html'.
 *   Omit (or pass '') for the site root.
 * @returns {string} a root-relative href under BASE_PATH, safe for use in
 *   internal <a href> attributes.
 */
function url(file = '') {
  return `${BASE_PATH}${file}`;
}

/**
 * @param {string} [file] same as url().
 * @returns {string} an absolute URL under SITE_ORIGIN + BASE_PATH, for use in
 *   <link rel="canonical">, og:url, sitemap.xml, and JSON-LD.
 */
function absoluteUrl(file = '') {
  return `${SITE_ORIGIN}${BASE_PATH}${file}`;
}

/**
 * @param {string} base a page-specific title, without any site-name suffix.
 * @returns {string} `${base} | ${SITE_NAME}` -- always. Callers are
 *   responsible for keeping `base` short enough that the combined title
 *   stays inside search engines' ~60-character display budget; a build-time
 *   assertion enforcing that lives in the metadata-infrastructure subtask,
 *   not here.
 */
function pageTitle(base) {
  return `${base} | ${SITE_NAME}`;
}

module.exports = {
  SITE_ORIGIN,
  BASE_PATH,
  SITE_NAME,
  SITE_TAGLINE,
  BUILD_DATE,
  RIOT_DISCLAIMER,
  TRADEMARK_NOTICE,
  url,
  absoluteUrl,
  pageTitle
};
