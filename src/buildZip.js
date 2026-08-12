'use strict';

// Optional packaging step: bundles the entire print pack (dist/print/) into
// a single solo-queue-practice-pack.zip, using this repo's own dependency-free
// ZipWriter (src/xlsx/zip.js) -- no new dependency.
//
// Deliberately a *separate* npm script ("npm run build:zip") run after
// "npm run pdf" and before "npm run build:site" in build:all, so:
//   - it can pick up the PDFs (if a browser was available) as well as the
//     HTML/xlsx, without the core "npm run build" step depending on it, and
//   - dist/print/'s dynamic file listing (src/web/pagesB3.js's
//     readPrintFiles()) picks the zip up automatically once build:site runs
//     after it, with no code change needed in the downloads-page renderer.
//
// Every file entered into the archive is under one top-level folder
// (ZIP_ROOT_FOLDER) so extracting it doesn't dump eight files into whatever
// directory the download landed in.

const fs = require('fs');
const path = require('path');

const { ZipWriter } = require('./xlsx/zip.js');

// Must stay in sync with src/build.js's own DIST (the print pack directory)
// -- this script only ever reads from there, never writes outside dist/print/.
const DIST = path.join(__dirname, '..', 'dist', 'print');
const ZIP_NAME = 'solo-queue-practice-pack.zip';
const ZIP_ROOT_FOLDER = 'solo-queue-practice-pack';

function build() {
  if (!fs.existsSync(DIST)) {
    console.log('build:zip: dist/print/ does not exist yet -- run "npm run build" first. Skipping.');
    return { attempted: false, wrote: null, entries: [], skippedReason: 'no_dist' };
  }

  // Every file currently in dist/print/ except the zip itself (so a re-run
  // never zips a previous run's own output into the new one).
  const files = fs.readdirSync(DIST).filter(f => f !== ZIP_NAME).sort();

  if (files.length === 0) {
    console.log('build:zip: dist/print/ is empty -- nothing to package. Skipping.');
    return { attempted: false, wrote: null, entries: [], skippedReason: 'empty_dist' };
  }

  const writer = new ZipWriter();
  for (const file of files) {
    const data = fs.readFileSync(path.join(DIST, file));
    writer.addFile(`${ZIP_ROOT_FOLDER}/${file}`, data);
  }

  const buffer = writer.toBuffer();
  const outPath = path.join(DIST, ZIP_NAME);
  fs.writeFileSync(outPath, buffer);
  console.log(`build:zip: wrote ${ZIP_NAME} (${files.length} files, ${(buffer.length / 1024).toFixed(0)} KB) to ${outPath}`);

  return { attempted: true, wrote: ZIP_NAME, entries: files };
}

if (require.main === module) {
  try {
    build();
  } catch (err) {
    console.log(`build:zip: unexpected error (${err.message}). Skipping cleanly -- this never fails the build.`);
  }
  process.exit(0);
}

module.exports = { build, DIST, ZIP_NAME, ZIP_ROOT_FOLDER };
