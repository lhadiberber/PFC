function escapeCsvValue(value) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename, columns, items) {
  if (typeof window === "undefined") {
    return;
  }

  const lines = [
    columns.map((column) => escapeCsvValue(column.label)).join(","),
    ...items.map((item) =>
      columns.map((column) => escapeCsvValue(column.getValue(item))).join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF", lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
