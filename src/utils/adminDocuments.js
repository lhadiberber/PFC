import { formatAdminDateTime, toAdminApplication } from "./adminApplications";

const STORAGE_KEY = "adminDocumentReviews";

export const ADMIN_DOCUMENT_TYPES = [
  {
    key: "carteIdentite",
    label: "Passeport / carte d'identite",
    shortLabel: "Passeport",
  },
  {
    key: "releveNotes",
    label: "Releve de notes",
    shortLabel: "Releve de notes",
  },
  {
    key: "copieBac",
    label: "Diplome",
    shortLabel: "Diplome",
  },
  {
    key: "cv",
    label: "CV",
    shortLabel: "CV",
  },
  {
    key: "photo",
    label: "Photo d'identite",
    shortLabel: "Photo",
  },
  {
    key: "residence",
    label: "Certificat de residence",
    shortLabel: "Residence",
  },
];

export function normalizeDocumentReviewStatus(status) {
  const normalizedStatus = (status ?? "").toString().trim().toLowerCase();

  if (["valide", "validé", "validee", "validée"].includes(normalizedStatus)) {
    return "Valide";
  }

  if (["refuse", "refusé", "refusee", "refusée"].includes(normalizedStatus)) {
    return "Refuse";
  }

  return "En attente";
}

function sanitizeReviewEntry(entry = {}) {
  return {
    status: normalizeDocumentReviewStatus(entry.status),
    updatedAt: entry.updatedAt || "",
  };
}

export function readDocumentReviews() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return Object.entries(parsedValue).reduce((accumulator, [documentId, entry]) => {
      accumulator[documentId] = sanitizeReviewEntry(entry);
      return accumulator;
    }, {});
  } catch (error) {
    return {};
  }
}

export function writeDocumentReviews(reviews) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new CustomEvent("admin:document-reviews-updated"));
}

export function updateDocumentReview(documentId, nextStatus) {
  const reviews = readDocumentReviews();
  reviews[documentId] = {
    status: normalizeDocumentReviewStatus(nextStatus),
    updatedAt: new Date().toISOString(),
  };
  writeDocumentReviews(reviews);
  return reviews[documentId];
}

export function getDocumentReview(documentId, reviews = readDocumentReviews()) {
  return sanitizeReviewEntry(reviews[documentId]);
}

function normalizeSearchValue(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

function getDocumentDate(application) {
  return application.submittedAt || application.date || application.dateDepot || "";
}

export function buildAdminDocumentRows(applications, reviews = readDocumentReviews()) {
  return applications.flatMap((application) => {
    const adminApplication = toAdminApplication(application);

    return ADMIN_DOCUMENT_TYPES.flatMap((documentType) => {
      const fileName = adminApplication.details?.[documentType.key];

      if (!fileName || !String(fileName).trim()) {
        return [];
      }

      const documentId = `${adminApplication.id}__${documentType.key}`;
      const review = getDocumentReview(documentId, reviews);
      const depositedAt = getDocumentDate(adminApplication);

      return {
        id: documentId,
        applicationId: String(adminApplication.id),
        documentKey: documentType.key,
        studentName: adminApplication.nom,
        university: adminApplication.universite || "Universite non renseignee",
        depositedAt,
        depositedAtLabel: formatAdminDateTime(depositedAt),
        status: review.status,
        fileName: String(fileName).trim(),
        typeLabel: documentType.label,
        shortTypeLabel: documentType.shortLabel,
        numeroDossier: adminApplication.numeroDossier,
        email: adminApplication.details?.email || "",
        programme: adminApplication.specialite || "",
        reviewUpdatedAt: review.updatedAt,
      };
    });
  });
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

export function findAdminDocumentRow(applications, documentId, reviews = readDocumentReviews()) {
  return buildAdminDocumentRows(applications, reviews).find((row) => row.id === documentId) || null;
}
