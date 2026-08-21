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
//   - never throws past its own boundary (a top-level catch swallows and logs
//     any unexpected error instead of letting it crash the process),
//   - always exits 0, whether it found a browser or not, and whether every file
//     converted cleanly or not,
//   - degrades one file at a time (one bad conversion is logged and skipped, not
//     a reason to abort the rest of the pass).
//
// No network access and no third-party dependency: every candidate is a local
// browser binary already installed on this machine (or not), invoked purely
// against local file:// URLs.
//
// PDF generation goes through the Chrome DevTools Protocol's Page.printToPDF
// directly (over a plain WebSocket, using only Node's built-in fetch/WebSocket
// globals -- no npm package), NOT the browser's own "--print-to-pdf" CLI flag.
// The CLI flag's underlying implementation forces displayHeaderFooter to true
// (stamping a source-file:// URL and a timestamp on every page, unless a given
// browser build happens to expose "--no-pdf-header-footer", which is not
// guaranteed across versions/channels) -- CDP's Page.printToPDF defaults
// displayHeaderFooter to false, so calling it directly and never opting into a
// header/footer is what actually keeps every local machine's path and OS
// username out of anything this script produces.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

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
  const { spawnSync } = require('child_process');
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

// --- CDP plumbing -----------------------------------------------------------
// Everything below talks to the browser purely over its own DevTools Protocol
// (a local WebSocket) using Node's built-in `fetch` and global `WebSocket`
// (both stable in the Node versions this repo targets) -- no npm dependency.

const DEVTOOLS_LISTENING_RE = /DevTools listening on (ws:\/\/\S+)/;

// Starts the browser headless with its DevTools port open on an OS-assigned
// port (--remote-debugging-port=0), and resolves once the browser prints the
// resulting ws:// endpoint to stderr (Chromium's own startup behavior).
// A dedicated --user-data-dir keeps this run from colliding with (or being
// silently absorbed into) a copy of the same browser the human already has
// open normally.
function launchBrowserWithCDP(browserPath, userDataDir) {
  return new Promise((resolve, reject) => {
    const proc = spawn(browserPath, [
      '--headless=new',
      '--disable-gpu',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill();
      reject(new Error('timed out waiting for the browser to open a DevTools port'));
    }, 15000);

    const onStderr = (chunk) => {
      if (settled) return;
      const match = chunk.toString().match(DEVTOOLS_LISTENING_RE);
      if (match) {
        settled = true;
        clearTimeout(timer);
        proc.stderr.removeListener('data', onStderr);
        resolve({ proc, browserWsEndpoint: match[1] });
      }
    };
    proc.stderr.on('data', onStderr);

    proc.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    proc.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`browser exited before opening a DevTools port (code ${code})`));
    });
  });
}

async function closeBrowser(proc) {
  if (!proc || proc.exitCode !== null || proc.signalCode !== null) return;
  const exited = new Promise((resolve) => proc.once('exit', resolve));
  proc.kill();
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))]);
}

// Minimal CDP session over one page target's own WebSocket: a JSON-RPC-shaped
// send()/response and a plain event-listener list. No queueing/backpressure
// beyond what the browser and the OS socket already provide -- this script
// only ever has one outstanding command at a time.
function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 0;
    const pending = new Map();
    const listeners = [];

    const client = {
      send(method, params) {
        const id = ++msgId;
        return new Promise((res, rej) => {
          pending.set(id, { resolve: res, reject: rej });
          ws.send(JSON.stringify({ id, method, params: params || {} }));
        });
      },
      onEvent(handler) {
        listeners.push(handler);
      },
      close() {
        try { ws.close(); } catch (err) { /* already closed */ }
      }
    };

    ws.addEventListener('open', () => resolve(client), { once: true });
    ws.addEventListener('error', () => reject(new Error('CDP WebSocket connection failed')), { once: true });
    ws.addEventListener('message', (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch (err) {
        return;
      }
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(`CDP error ${msg.error.code}: ${msg.error.message}`));
        else res(msg.result);
      }
      if (msg.method) {
        for (const listener of listeners) listener(msg);
      }
    });
  });
}

// Opens a fresh tab, navigates it to fileUrl, waits for it to finish loading,
// prints it to outAbs via Page.printToPDF (displayHeaderFooter left at its
// CDP default of false -- see the file-header comment), then closes the tab.
async function printOnePdf({ port, fileUrl, outAbs, timeoutMs = 20000 }) {
  const newTargetResp = await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' });
  if (!newTargetResp.ok) {
    throw new Error(`could not open a new browser tab (HTTP ${newTargetResp.status})`);
  }
  const target = await newTargetResp.json();
  const client = await connectCdp(target.webSocketDebuggerUrl);

  try {
    const loadEvent = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for the page to finish loading')), timeoutMs);
      client.onEvent((msg) => {
        if (msg.method === 'Page.loadEventFired') {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    await client.send('Page.enable');
    await client.send('Page.navigate', { url: fileUrl });
    await loadEvent;

    const printResult = await client.send('Page.printToPDF', {
      printBackground: true,
      displayHeaderFooter: false
    });

    fs.writeFileSync(outAbs, Buffer.from(printResult.data, 'base64'));
  } finally {
    client.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
  }
}

async function run() {
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

  let proc = null;
  let userDataDir = null;
  try {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lol-pdf-cdp-'));

    let launch;
    try {
      launch = await launchBrowserWithCDP(browser, userDataDir);
    } catch (err) {
      console.log(`pdf: could not start a CDP-controlled browser session (${err.message}). Skipping PDF export -- the HTML/spreadsheet files already in dist/print/ are unaffected.`);
      return { attempted: false, produced: [], failed: [], skippedReason: 'cdp_launch_failed' };
    }
    proc = launch.proc;
    const port = new URL(launch.browserWsEndpoint).port;

    for (const file of htmlFiles) {
      const srcAbs = path.join(DIST, file);
      const outName = file.replace(/\.html$/, '.pdf');
      const outAbs = path.join(DIST, outName);

      try {
        await printOnePdf({ port, fileUrl: toFileUrl(srcAbs), outAbs });
        if (fs.existsSync(outAbs) && fs.statSync(outAbs).size > 0) {
          produced.push(outName);
          console.log(`pdf: wrote ${outName}`);
        } else {
          throw new Error('printToPDF produced an empty or missing file');
        }
      } catch (err) {
        failed.push(file);
        console.log(`pdf: could not produce a PDF for ${file} (${err.message}). Skipping this file -- the HTML original in dist/print/ is unaffected.`);
      }
    }
  } finally {
    await closeBrowser(proc);
    if (userDataDir) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
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
  run()
    .catch((err) => {
      console.log(`pdf: unexpected error during the PDF pass (${err.message}). Skipping cleanly -- this never fails the build.`);
    })
    .finally(() => process.exit(0));
}

module.exports = { run, findBrowser, listHtmlFiles, toFileUrl, DIST };
