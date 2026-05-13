function normalizeSearchValue(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

export function filterAdminDocumentRows(rows, searchQuery, statusFilter) {
  const query = normalizeSearchValue(searchQuery);

  return rows.filter((row) => {
    const matchesSearch =
      !query ||
      [row.studentName, row.typeLabel, row.shortTypeLabel, row.university].some((value) =>
        normalizeSearchValue(value).includes(query)
      );

    const matchesStatus =
      statusFilter === "tous" ||
      (statusFilter === "attente" && row.status === "En attente") ||
      (statusFilter === "valides" && row.status === "Valide") ||
      (statusFilter === "refuses" && row.status === "Refuse");

    return matchesSearch && matchesStatus;
  });
}

export function sortAdminDocumentRows(rows) {
  return [...rows].sort((first, second) => {
    const firstDate = new Date(first.depositedAt).getTime();
    const secondDate = new Date(second.depositedAt).getTime();

    if (firstDate !== secondDate) {
      return secondDate - firstDate;
    }

    return first.studentName.localeCompare(second.studentName, "fr", { sensitivity: "base" });
  });
}

export function getAdminDocumentStats(rows) {
  return {
    total: rows.length,
    valides: rows.filter((row) => row.status === "Valide").length,
    attente: rows.filter((row) => row.status === "En attente").length,
    refuses: rows.filter((row) => row.status === "Refuse").length,
  };
}
