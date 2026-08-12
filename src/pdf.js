'use strict';

// Optional packaging step: attempts a local, offline
// headless-browser print-to-pdf pass over every HTML document in dist/print/,
// producing a same-named .pdf next to each .html file.
//
// This is deliberately a *separate* npm script ("npm run pdf") from "npm run
// build" -- the core build (HTML + the tracker workbook) must never depend on
// whether a browser happens to be installed on this machine. It skips
// cleanly with a printed notice if no browser binary is found, and never fails the
// build. Concretely, that means this script:
//   - never throws past its own boundary (a top-level try/catch swallows and logs
//     any unexpected error instead of letting it crash the process),
//   - always exits 0, whether it found a browser or not, and whether every file
//     converted cleanly or not,
//   - degrades one file at a time (one bad conversion is logged and skipped, not
//     a reason to abort the rest of the pass).
//
// No network access and no third-party dependency: every candidate is a local
// browser binary already installed on this machine (or not), invoked purely
// against local file:// URLs.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// The print pack lives under dist/print/ -- this must
// stay in sync with src/build.js's DIST so the PDF pass only ever touches
// the print pack's own HTML files, never the site build's pages in dist/.
const DIST = path.join(__dirname, '..', 'dist', 'print');

// Checked in order. Absolute Windows install paths are the common case and are
// checked with a cheap fs.existsSync (no process spawn needed). Bare names fall
// back to asking the OS's own resolver ("where" on Windows, "which" elsewhere),
// since a portable/PATH install has no single well-known location.
const CANDIDATES = [
  { kind: 'absolute', value: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
  { kind: 'absolute', value: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' },
  { kind: 'path', value: 'msedge' },
  { kind: 'absolute', value: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  { kind: 'absolute', value: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' },
  { kind: 'path', value: 'google-chrome' },
  { kind: 'path', value: 'chrome' },
  { kind: 'absolute', value: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' },
  { kind: 'absolute', value: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
];

function resolveOnPath(name) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  let result;
  try {
    result = spawnSync(finder, [name], { encoding: 'utf8' });
  } catch (err) {
    return null;
  }
  if (result && result.status === 0 && result.stdout) {
    const first = result.stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0];
    return first || null;
  }
  return null;
}

function findBrowser() {
  for (const candidate of CANDIDATES) {
    if (candidate.kind === 'absolute') {
      if (fs.existsSync(candidate.value)) return candidate.value;
    } else if (resolveOnPath(candidate.value)) {
      return resolveOnPath(candidate.value);
    }
  }
  return null;
}

function listHtmlFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
}

function toFileUrl(absPath) {
  let p = absPath.replace(/\\/g, '/');
  if (!p.startsWith('/')) p = '/' + p;
  return 'file://' + p;
}

function run() {
  if (!fs.existsSync(DIST)) {
    console.log('pdf: dist/print/ does not exist yet -- run "npm run build" first. Skipping PDF pass.');
    return { attempted: false, produced: [], failed: [], skippedReason: 'no_dist' };
  }

  const browser = findBrowser();
  if (!browser) {
    console.log('pdf: no local headless-browser binary found (checked Microsoft Edge and Google Chrome, common install locations plus PATH). Skipping PDF export -- this is expected on a machine with neither installed, and it does not affect the HTML/spreadsheet files already in dist/print/.');
    console.log('pdf: manual fallback -- open any dist/print/*.html file in your own browser and use Print > Save as PDF (Ctrl+P) to get a PDF copy by hand.');
    return { attempted: false, produced: [], failed: [], skippedReason: 'no_browser' };
  }

  console.log(`pdf: using browser binary: ${browser}`);
  const htmlFiles = listHtmlFiles(DIST);
  const produced = [];
  const failed = [];

  for (const file of htmlFiles) {
    const srcAbs = path.join(DIST, file);
    const outName = file.replace(/\.html$/, '.pdf');
    const outAbs = path.join(DIST, outName);
    const args = [
      '--headless=new',
      '--disable-gpu',
      `--print-to-pdf=${outAbs}`,
      toFileUrl(srcAbs)
    ];

    let result;
    try {
      result = spawnSync(browser, args, { timeout: 30000 });
    } catch (err) {
      result = { status: -1, error: err };
    }

    if (result && result.status === 0 && fs.existsSync(outAbs) && fs.statSync(outAbs).size > 0) {
      produced.push(outName);
      console.log(`pdf: wrote ${outName}`);
    } else {
      failed.push(file);
      const reason = result && result.error ? result.error.message : `browser exited with status ${result ? result.status : 'unknown'}`;
      console.log(`pdf: could not produce a PDF for ${file} (${reason}). Skipping this file -- the HTML original in dist/print/ is unaffected.`);
    }
  }

  if (failed.length) {
    console.log(`pdf: ${produced.length}/${htmlFiles.length} PDFs produced, ${failed.length} skipped. This is not a build failure -- every HTML original is still complete in dist/print/ either way.`);
  } else {
    console.log(`pdf: ${produced.length}/${htmlFiles.length} PDFs produced.`);
  }

  return { attempted: true, produced, failed };
}

if (require.main === module) {
  try {
    run();
  } catch (err) {
    console.log(`pdf: unexpected error during the PDF pass (${err.message}). Skipping cleanly -- this never fails the build.`);
  }
  process.exit(0);
}

module.exports = { run, findBrowser, listHtmlFiles, toFileUrl, DIST };
