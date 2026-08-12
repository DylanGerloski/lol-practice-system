'use strict';

// escapeHtml + the five layout primitives from the design system (print.css).
// Renderers stay dumb on purpose -- every primitive is one function, used identically
// everywhere it appears, so a card/table/etc always has the same shape.

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 1. CARD -- a title plus a fixed, ordered list of labeled slots.
function card({ title, slots }) {
  const slotHtml = slots.map(({ label, value, valueClass }) => `
    <div class="card-slot">
      <span class="slot-label">${escapeHtml(label)}</span>
      <span class="slot-value${valueClass ? ' ' + escapeHtml(valueClass) : ''}">${escapeHtml(value)}</span>
    </div>`).join('');
  return `<div class="card">
    <h3 class="card-title">${escapeHtml(title)}</h3>
    ${slotHtml}
  </div>`;
}

// 2. CHECKLIST ROW -- an empty tickbox plus item text.
function checklistRow(text) {
  return `<div class="checklist-row">
    <span class="checklist-box" aria-hidden="true"></span>
    <span class="checklist-text">${escapeHtml(text)}</span>
  </div>`;
}

// 3. FILL LINE -- a captioned write-in field.
function fillLine(label) {
  return `<div class="fill-line">
    <span class="slot-label">${escapeHtml(label)}</span>
    <div class="fill-rule"></div>
  </div>`;
}

// 4. CALLOUT -- an emphasized aside. At most one per page (an authoring rule, not
// something this function can enforce).
function callout(text) {
  return `<p class="callout">${escapeHtml(text)}</p>`;
}

// 5. DATA TABLE -- hairline rules only, numeric columns right-aligned.
// columns: [{ key, label, numeric }], rows: [{ [key]: value }]
function dataTable({ columns, rows }) {
  const thead = columns.map(c => `<th${c.numeric ? ' class="num"' : ''} scope="col">${escapeHtml(c.label)}</th>`).join('');
  const tbody = rows.map(row => {
    const cells = columns.map(c => `<td${c.numeric ? ' class="num"' : ''}>${escapeHtml(row[c.key])}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table class="data-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

module.exports = { escapeHtml, card, checklistRow, fillLine, callout, dataTable };
