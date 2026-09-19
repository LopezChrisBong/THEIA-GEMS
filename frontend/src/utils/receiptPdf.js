import { jsPDF } from "jspdf";

/**
 * Builds an 80mm-wide thermal-receipt PDF from structured data and downloads
 * it, using jsPDF's own vector text (no html2canvas/DOM rasterization).
 *
 * This is intentionally lighter than a screenshot-based approach: no extra
 * rendering library, smaller bundle, and the PDF text is real/selectable.
 * The one tradeoff: jsPDF's built-in fonts don't include the "₱" glyph, so
 * amounts are prefixed with "PHP " instead.
 *
 * Expected shape of `d`:
 * {
 *   receiptNumber, saleNumber, saleDate, customerName, reprints,
 *   items: [{ name, code, details, price }],
 *   subtotal, discountAmt, taxAmt, totalAmount,
 *   paymentLines: [{ label, value, bold }],
 *   isTest,      // optional — adds a "TEST PRINT" banner
 *   policy,      // optional — array of paragraph strings (plain text, no HTML) appended at the end
 * }
 */

const PAGE_WIDTH = 80; // mm
const MARGIN = 4; // mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LEFT = MARGIN;
const RIGHT = PAGE_WIDTH - MARGIN;
const MID = PAGE_WIDTH / 2;

export function money(v) {
  return "PHP " + Number(v || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineHeight(size) {
  return size * 0.42;
}

function buildOps(d, measureDoc) {
  const ops = [];
  const center = (text, size, style, danger) => ops.push({ type: "center", text, size, style, danger, h: lineHeight(size) + 0.8 });
  const hr = (dashed) => ops.push({ type: "hr", dashed, h: 3 });
  const row = (label, value, opts = {}) => ops.push({ type: "row", label, value, ...opts, h: lineHeight(opts.size || 8.5) + 0.8 });
  const line = (text, opts = {}) => ops.push({ type: "line", text, ...opts, h: lineHeight(opts.size || 8.5) + 0.6 });
  const paragraph = (text, opts = {}) => {
    const size = opts.size || 6.3;
    measureDoc.setFont("courier", "normal");
    measureDoc.setFontSize(size);
    const wrapped = measureDoc.splitTextToSize(text, CONTENT_WIDTH);
    wrapped.forEach((wLine) => line(wLine, { size, dim: opts.dim }));
  };

  center("THEIA GEMS", 15, "bold");
  center("FINE JEWELRY", 7.5, "normal");
  hr(false);

  if (d.isTest) {
    center("*** TEST PRINT — NOT A REAL RECEIPT ***", 6.5, "bold", true);
  }

  line(`Receipt: ${d.receiptNumber}`, { bold: true });
  line(`Sale No: ${d.saleNumber || "—"}`);
  line(`Date: ${d.saleDate || ""}`);
  if (d.customerName) line(`Customer: ${d.customerName}`);
  if (d.reprints > 0) line(`Reprint #${d.reprints + 1}`, { dim: true });
  hr(true);

  if (d.items && d.items.length) {
    d.items.forEach((it) => {
      row(it.name || "—", money(it.price), { size: 8.5, bold: true });
      if (it.code) line(it.code, { size: 6.8, indent: 1, dim: true });
      if (it.details) line(it.details, { size: 6.8, indent: 1, dim: true });
    });
  } else {
    line("No item details recorded", { size: 7.5, dim: true });
  }
  hr(true);

  row("Subtotal", money(d.subtotal));
  if (d.discountAmt > 0) row("Discount", `-${money(d.discountAmt)}`);
  if (d.taxAmt > 0) row("VAT (12%)", money(d.taxAmt));
  hr(false);
  row("TOTAL", money(d.totalAmount), { size: 12, bold: true });
  hr(true);

  (d.paymentLines || []).forEach((p) => {
    if (p.value != null) row(p.label, p.value, { bold: p.bold });
    else line(p.label, { bold: p.bold });
  });
  hr(false);

  center("Thank you for your purchase!", 7);
  center("Please come again.", 7);
  center("This serves as your official receipt.", 6, "normal", false);

  if (d.policy && d.policy.length) {
    hr(false);
    center("THEIA RETURN & EXCHANGE POLICY", 6.3, "bold");
    ops[ops.length - 1].h += 1;
    d.policy.forEach((p) => paragraph(p, { size: 6.3, dim: false }));
  }

  return ops;
}

export function downloadReceiptPdf(d, filename) {
  // Scratch instance used only to measure/wrap paragraph text before we know the final page height.
  const measureDoc = new jsPDF({ unit: "mm", format: [PAGE_WIDTH, 1000] });
  const ops = buildOps(d, measureDoc);
  const totalHeight = ops.reduce((sum, op) => sum + op.h, 0) + MARGIN * 2;

  const doc = new jsPDF({ unit: "mm", format: [PAGE_WIDTH, Math.max(totalHeight, 40)] });
  let y = MARGIN + 3;

  for (const op of ops) {
    if (op.type === "center") {
      doc.setFont("courier", op.style || "normal");
      doc.setFontSize(op.size);
      doc.setTextColor(...(op.danger ? [184, 64, 64] : [0, 0, 0]));
      doc.text(op.text, MID, y, { align: "center" });
    } else if (op.type === "hr") {
      doc.setDrawColor(0, 0, 0);
      doc.setLineDashPattern(op.dashed ? [0.8, 0.8] : [], 0);
      doc.line(LEFT, y - 1.5, RIGHT, y - 1.5);
    } else if (op.type === "row") {
      doc.setFont("courier", op.bold ? "bold" : "normal");
      doc.setFontSize(op.size || 8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(String(op.label), LEFT, y);
      doc.text(String(op.value), RIGHT, y, { align: "right" });
    } else if (op.type === "line") {
      doc.setFont("courier", op.bold ? "bold" : "normal");
      doc.setFontSize(op.size || 8.5);
      doc.setTextColor(...(op.dim ? [90, 90, 90] : [0, 0, 0]));
      doc.text(op.text, LEFT + (op.indent || 0), y);
    }
    y += op.h;
  }

  doc.save(filename);
}
