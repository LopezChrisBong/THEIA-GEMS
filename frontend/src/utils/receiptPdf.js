import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Renders a full receipt HTML document (the exact same markup used for
 * window.print()) into an 80mm-wide thermal-receipt PDF and downloads it.
 *
 * Rendering the print HTML itself (instead of re-building the layout in
 * jsPDF's vector API) guarantees the PDF always matches what "Print"
 * produces, with a single source of truth for the receipt layout.
 */
export async function downloadReceiptPdf(html, filename) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "400px";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve, reject) => {
      iframe.onload = resolve;
      iframe.onerror = reject;
      iframe.srcdoc = html;
    });
    // Let layout settle after the iframe document finishes loading.
    await new Promise((resolve) => setTimeout(resolve, 80));

    const body = iframe.contentDocument.body;
    const canvas = await html2canvas(body, {
      scale: 3,
      backgroundColor: "#ffffff",
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
    });

    const pdfWidthMm = 80;
    const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

    const pdf = new jsPDF({ unit: "mm", format: [pdfWidthMm, pdfHeightMm] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}
