function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function downloadPdfReport({ title, subtitle = "", columns, items }) {
  if (typeof window === "undefined") {
    return;
  }

  const printWindow = window.open("", "_blank", "width=980,height=720");
  if (!printWindow) {
    return;
  }

  const rows = items
    .map(
      (item) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(column.getValue(item))}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const html = `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; }
          .report-header { margin-bottom: 18px; }
          .report-header h1 { margin: 0 0 8px; font-size: 24px; color: #1a365d; }
          .report-header p { margin: 0; color: #4b5563; font-size: 13px; }
          .report-meta { margin-top: 10px; color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead { background: #f3f4f6; }
          th, td { border: 1px solid #d1d5db; text-align: left; padding: 8px; vertical-align: top; }
          th { text-transform: uppercase; letter-spacing: 0.03em; font-size: 11px; color: #4b5563; }
          .empty { padding: 18px; border: 1px dashed #cbd5e1; border-radius: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(subtitle)}</p>
          <div class="report-meta">Genere le ${new Date().toLocaleString("fr-FR")}</div>
        </div>
        ${
          items.length === 0
            ? '<div class="empty">Aucune donnee a exporter.</div>'
            : `<table><thead><tr>${columns
                .map((column) => `<th>${escapeHtml(column.label)}</th>`)
                .join("")}</tr></thead><tbody>${rows}</tbody></table>`
        }
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}
