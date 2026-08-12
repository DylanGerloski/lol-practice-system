# Testing this build

This covers the whole product now: the content and design system, the print-ready HTML
documents, the tracker spreadsheet, the optional PDF export pass, the free ad-supported web
site, and the final packaged `dist/` folder. Follow the steps in order; each one says what
"working" looks like and what "broken" looks like.

**Note on `dist/` layout:** the print-ready pack (readme, quick start, program guide,
warmup cards, drill library, tracker spreadsheet, matchup/VOD sheets, and their PDFs) now
lives under `dist/print/`, not `dist/` directly -- this makes room for the web site's own
pages (`index.html`, `404.html`, and more as they're built) at the top level of `dist/`.
Steps 2-7 below were written before this change and still describe the print pack; wherever
they say `dist/<file>`, read that as `dist/print/<file>`.

You do not need to know how to program to follow this. Every command below is copy-pasted
into a terminal exactly as written.

## 0. One-time setup

You need [Node.js](https://nodejs.org) installed (any reasonably recent version). Nothing
else -- this project has zero external dependencies, so there is no `npm install` step.

Open a terminal and move into this project's folder:

```
cd C:\Users\dylan\Dev\lol-practice-system
```

## 1. Run the automated tests

```
npm test
```

**What working looks like:** a list of lines starting with `✔`, ending in a summary block
that includes `pass 25` and `fail 0` (the exact pass count may grow over time as more tests
are added; `fail 0` is what matters).

These tests check: every drill/focus/warmup content record has all its required pieces
filled in; the rendered pages have no broken HTML escaping and every page carries a title,
description, and the disclaimer footer; no League of Legends champion, item, or rune name
accidentally made it into the product anywhere, including inside the spreadsheet (this
product intentionally ships with zero Riot game assets or named content -- see the guide's
FAQ for why); the tracker spreadsheet's internal file structure is well-formed (its own kind
of correctness check -- step 5 below is the real "does it actually open" check, done by hand
in a real spreadsheet application, since no automated test can fully promise that); and that
the PDF-export script (`src/pdf.js`) never crashes, whether or not a browser is available on
this machine.

**What broken looks like:** any line starting with `✖` instead of `✔`, and a summary line
with a `fail` count above 0. If you see this, something is broken and should not be shipped
as-is.

## 2. Build the product, from clean

```
npm run build
```

**What working looks like:** a message listing 9 files written into a `dist/print/` folder:
`print.css`, then 7 numbered documents, then the spreadsheet. The full list, in the order a
buyer should actually use them:

1. `00-readme.html` -- what's in the box and the order to use it in
2. `01-quick-start.html` -- the one-page fast-start version
3. `02-program-guide.html` -- the full 30-day program
4. `03-warmup-cards.html` -- five pre-game warmup routines
5. `04-drill-library.html` -- twelve practice drills
6. `05-tracker-workbook.xlsx` -- the spreadsheet you log games into
7. `06-matchup-study-sheet.html` -- a blank fill-in-yourself template
8. `07-vod-review-sheet.html` -- a blank fill-in-yourself template
9. `print.css` -- a shared stylesheet the HTML files use; not meant to be opened directly

Every build starts by clearing out `dist/print/` first (and only `dist/print/` -- it never
touches anything the web-site build wrote to `dist/` itself), so re-running `npm run build`
never leaves old files behind from a previous run -- what's in `dist/print/` after this
command is always exactly the current print pack, nothing stale mixed in.

**What broken looks like:** an error message instead of the file list, or fewer than 9 files
actually present afterward (check with a file browser, or run `dir dist\print` on Windows).

## 3. Attempt the PDF export pass (optional, and allowed to skip)

```
npm run pdf
```

This tries to find a web browser already installed on this machine (Microsoft Edge or
Google Chrome) and uses it, invisibly, to save a `.pdf` copy of each HTML document next to
the original -- e.g. `00-readme.html` gets a `00-readme.pdf` sibling. It never touches the
internet and never installs anything.

**What working looks like (browser found):** a line naming the browser it's using, then one
`pdf: wrote ...` line per document, ending in a summary like `pdf: 7/7 PDFs produced.` A
`.pdf` file now sits next to each `.html` file in `dist/`.

**What it looks like when there's no browser available (the documented broken/skip case):**
on a machine with neither Edge nor Chrome installed, you'll instead see:

```
pdf: no local headless-browser binary found (checked Microsoft Edge and Google Chrome,
common install locations plus PATH). Skipping PDF export -- this is expected on a machine
with neither installed, and it does not affect the HTML/spreadsheet files already in dist/.
pdf: manual fallback -- open any dist/*.html file in your own browser and use Print > Save
as PDF (Ctrl+P) to get a PDF copy by hand.
```

**This is not a failure.** The command still exits normally (no error), and every file from
step 2 is still exactly as it was -- nothing is deleted or left half-written. If you see
this message, the product is still complete; you (or the eventual buyer) can get a PDF by
opening any `.html` file in a browser and using that browser's own Print > Save as PDF
option (Ctrl+P), which every document is specifically designed to work well with (see step
6 below).

## 4. Open and read the documents yourself

Double-click any `.html` file in `dist/print/` (start with `dist/print/00-readme.html`) to
open it in your web browser -- no internet connection or account needed, every file works
completely offline.

**What working looks like:** `00-readme.html` opens showing a numbered list of every other
document, each one a clickable link that opens the right file; clicking through each link
takes you to a real page, not a broken link; every page shows readable text (not raw HTML
tags) and a small line at the very bottom reading something like "... - v1.0.0 - last
reviewed 2026-08-12 - Solo Queue Practice System was created under Riot Games' 'Legal
Jibber Jabber' policy...".

**What broken looks like:** a blank page, visible HTML tags in the text (meaning something
failed to render), a link in the README that does nothing or 404s, or a page missing that
bottom disclaimer line.

## 5. Open the tracker spreadsheet in a real spreadsheet application

`dist/print/05-tracker-workbook.xlsx` is a real Excel-format spreadsheet, built from scratch
by this project's own code (not exported from Excel or Google Sheets). Do this step by
hand -- it is the one thing the automated tests in step 1 cannot fully confirm, since they
check the file's internal structure, not whether a real spreadsheet application is happy
with it.

1. Double-click `dist/print/05-tracker-workbook.xlsx`, or open it from within Excel, LibreOffice
   Calc, or Google Sheets (File > Import > Upload).
2. It should open immediately with **no warning dialog** of any kind -- specifically, no
   "Excel found unreadable content" / "we found a problem with some content" repair prompt.
   If you see one, this is broken; do not trust the file even if you click through the
   repair prompt and it looks OK afterward.
3. You should see 6 tabs along the bottom, in this order: **Start Here**, **Baseline**,
   **Game Log**, **Block Review**, **Champion Pool**, **Benchmarks**.
4. On the **Start Here** tab, read the instructions -- they should be plain text, no
   `#REF!` or `#NAME?` errors visible anywhere.
5. Click the **Baseline** tab. Cell C2 should say "Gold" and be a dropdown (click the cell
   -- a small arrow should appear letting you pick a different rank). Type a number into
   cell E9 (CS@10) and a number into F9 (Minutes) -- for example `90` and `10`. Cell G9
   (CS/min) should immediately show a computed number (`9` for those example inputs)
   **without you doing anything else**. If G9 stays blank or shows an error, that's broken.
6. Click the **Game Log** tab. Near the top you should see five summary lines (win rate for
   focus-adherent games, win rate for non-adherent games, rolling averages, focus adherence
   %) -- visible immediately, without scrolling down past the 60-row log table. Fill in a
   couple of test rows (Date, a Result of W or L from the dropdown in column D, an Adherence
   number 1-5 from the dropdown in column F, CS@10 and Minutes) and confirm the CS/min
   column (I) computes automatically, the same as on the Baseline tab.
7. Click the **Block Review** tab and confirm you see three "BLOCK" sections, each with a
   start/end row number and computed averages pulling from the Game Log tab.
8. Click the **Benchmarks** tab and confirm the rank table (Iron-Bronze through Master+) is
   there with a provenance note explaining where those numbers come from.

**What working looks like:** all 6 tabs open with no repair prompt, the dropdowns work, and
typing a number into an input cell makes its formula cell recompute instantly.

**What broken looks like:** a repair-on-open warning, a tab that's blank or missing, a
formula cell showing `#REF!`/`#NAME?`/`#VALUE!`, or a computed cell that does not update
when you change the numbers it depends on.

## 6. Check print layout (manual, no automated check for this)

Open `dist/print/03-warmup-cards.html` or `dist/print/04-drill-library.html`, then use your browser's
Print Preview (Ctrl+P, don't actually print). Each warmup card and each group of 3 drill
cards should land on its own page without a card getting cut off across a page break.

**What working looks like:** cards land cleanly one-per-page (warmups) or three-per-page
(drills), with no card split across two pages.

**What broken looks like:** a card visibly cut in half at a page boundary. If you see this,
flag it rather than assuming it's fine -- exact print pagination can vary slightly across
different printers/browsers and this hasn't been verified in every one.

## 7. Sanity-check the PDF files, if any were produced

If step 3 produced `.pdf` files, open one or two (e.g. `dist/print/02-program-guide.pdf`) the same
way you'd open any PDF. It should look like a clean, readable printout of the matching HTML
page -- same text, same layout, the disclaimer footer visible on each page.

**What working looks like:** the PDF opens in your normal PDF viewer, text is selectable
(not a blurry screenshot), and it visually matches the HTML version.

**What broken looks like:** a PDF that won't open, is blank, or is missing most of the
content that the matching HTML page has.

## 8. Build and open the free web site (foundation only -- most pages don't exist yet)

This is a new, separate build from the print pack above. It's the start of a free,
ad-supported web site (the print pack becomes a downloadable bundle linked from it, not
the product itself) -- this step only covers the foundation piece: the site-wide look
(header, navigation, footer) and two pages, the home page and the "page not found" page.
Later work adds the other 13 pages (the program guide, drills, warmup routines, and so on)
using this same foundation, so the navigation bar below currently links to several pages
that don't exist yet -- that's expected at this stage, not a bug.

```
npm run build:site
```

**What working looks like:** a message listing 3 files written into `dist/` itself (not
`dist/print/`): `site.css`, `index.html`, `404.html`.

Open `dist/index.html` by double-clicking it. You should see:
- A header with the site name and a row of navigation links (wrapping onto a second row on
  a narrow window -- try resizing the browser window narrower to check this).
- A short introduction and a "Start the 30-day program" button (this button's link doesn't
  resolve to a real page yet -- that's fine for now).
- A "Three steps to start" list.
- A dashed gray box labeled "ADVERTISEMENT" -- this is a placeholder for where a real ad
  will eventually go. No real ad, tracking script, or network request happens here; it's
  reserved empty space so the page's layout won't shift later when ads are turned on.
- A footer with the required Riot Games disclaimer text and "About"/"Privacy" links (these
  also don't resolve to real pages yet).

Then open `dist/404.html` the same way. It should show the same header/footer, with a "That
page doesn't exist" message and a link back to the home page.

**What broken looks like:** an error instead of the 3-file list; a page that shows raw CSS
or HTML instead of a styled page; the navigation bar overlapping itself or causing the page
to scroll sideways at a narrow window width; a missing footer or missing disclaimer text.

You can also build everything (the print pack, its PDFs, and the web site) in one step:

```
npm run build:all
```

This runs steps 2, 3, and 8 in sequence -- `dist/print/` ends up with the full print pack
(HTML + PDFs + spreadsheet) and `dist/` itself ends up with the web site's own pages,
side by side.

## What a buyer/visitor would actually receive

The print pack in `dist/print/` (after steps 2 and 3 above) is the free downloadable
bundle. `dist/index.html` and everything else directly inside `dist/` (after step 8 above)
is the free web site itself -- what a visitor sees first. Both come from `npm run
build:all`. There is nothing else to zip up or assemble by hand.
