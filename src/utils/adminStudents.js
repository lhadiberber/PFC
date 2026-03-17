import { getAdminProgress } from "./adminApplications";

function normalize(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

export function getApplicationDateValue(application) {
  return application.dateDepot || application.date || application.submittedAt || "";
}

function isDateWithinDays(dateValue, days) {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const now = new Date();
  const diffInDays = (now - parsedDate) / (1000 * 60 * 60 * 24);
  return diffInDays <= days;
}

export function buildStudentRecords(applications) {
  const groups = new Map();

  applications.forEach((application) => {
    const key = application.details?.email || `student-${application.id}`;
    const progress = application.progress || getAdminProgress(application);
    const current = groups.get(key);
    const applicationDate = getApplicationDateValue(application);

    if (!current) {
      groups.set(key, {
        key,
        prenom: application.details?.prenom || "",
        nom: application.details?.nom || "",
        fullName: application.nom,
        email: application.details?.email || "Non renseigne",
        telephone: application.details?.telephone || "Non renseigne",
        nationalite: application.details?.nationalite || "Non renseignee",
        latestApplicationId: application.id,
        latestDate: applicationDate,
        firstDate: applicationDate,
        latestStatus: application.statut,
        latestUniversite: application.universite,
        latestSpecialite: application.specialite,
        latestProgramme: application.specialite,
        latestDiplome: application.details?.typeBac || "Non renseigne",
        latestYear: application.details?.anneeBac || "Non renseignee",
        latestApplication: application,
        applications: [application],
        profilCompletion: progress.profil,
        documentsCompletion: progress.documents,
        academiqueCompletion: progress.academique,
      });
      return;
    }

    current.applications.push(application);
    current.profilCompletion = Math.max(current.profilCompletion, progress.profil);
    current.documentsCompletion = Math.max(current.documentsCompletion, progress.documents);
    current.academiqueCompletion = Math.max(current.academiqueCompletion, progress.academique);

    if (!current.firstDate || new Date(applicationDate) < new Date(current.firstDate)) {
      current.firstDate = applicationDate;
    }

    if (!current.latestDate || new Date(applicationDate) > new Date(current.latestDate)) {
      current.latestApplicationId = application.id;
      current.latestDate = applicationDate;
      current.latestStatus = application.statut;
      current.latestUniversite = application.universite;
      current.latestSpecialite = application.specialite;
      current.latestProgramme = application.specialite;
      current.latestDiplome = application.details?.typeBac || "Non renseigne";
      current.latestYear = application.details?.anneeBac || "Non renseignee";
      current.latestApplication = application;
      current.fullName = application.nom;
      current.prenom = application.details?.prenom || current.prenom;
      current.nom = application.details?.nom || current.nom;
      current.telephone = application.details?.telephone || current.telephone;
      current.nationalite = application.details?.nationalite || current.nationalite;
    }
  });

  return [...groups.values()].map((student) => {
    const pendingCount = student.applications.filter(
      (application) => application.statut === "En attente"
    ).length;
    const acceptedCount = student.applications.filter(
      (application) => application.statut === "Acceptee"
    ).length;
    const rejectedCount = student.applications.filter(
      (application) => application.statut === "Rejetee"
    ).length;

    return {
      ...student,
      candidaturesCount: student.applications.length,
      pendingCount,
      acceptedCount,
      rejectedCount,
      isNewThisWeek: isDateWithinDays(student.firstDate, 7),
    };
  });
}

export function getStudentStatusMeta(student) {
  if (student.latestStatus === "Acceptee") {
    return {
      key: "acceptee",
      label: "Accepte",
      badgeStatus: "Accepte",
      tone: "positive",
    };
  }

  if (student.latestStatus === "Rejetee") {
    return {
      key: "refusee",
      label: "Refuse",
      badgeStatus: "Refuse",
      tone: "danger",
    };
  }

  if (
    student.documentsCompletion < 100 ||
    student.profilCompletion < 100 ||
    student.academiqueCompletion < 100
  ) {
    return {
      key: "attente",
      label: "En attente",
      badgeStatus: "En attente",
      tone: "warning",
    };
  }

  return {
    key: "actif",
    label: "Actif",
    badgeStatus: "Actif",
    tone: "positive",
  };
}

export function sortStudentRecords(items, sortField, sortDirection) {
  const factor = sortDirection === "asc" ? 1 : -1;

  return [...items].sort((first, second) => {
    switch (sortField) {
      case "nom":
        return normalize(first.fullName).localeCompare(normalize(second.fullName)) * factor;
      case "universite":
        return normalize(first.latestUniversite).localeCompare(normalize(second.latestUniversite)) * factor;
      case "programme":
        return normalize(first.latestProgramme).localeCompare(normalize(second.latestProgramme)) * factor;
      case "statut":
        return normalize(getStudentStatusMeta(first).label).localeCompare(
          normalize(getStudentStatusMeta(second).label)
        ) * factor;
      case "date":
      default:
        return (new Date(first.firstDate) - new Date(second.firstDate)) * factor;
    }
  });
}

export function findStudentRecordByApplicationId(studentRecords, applicationId) {
  return studentRecords.find((student) =>
    student.applications.some((application) => String(application.id) === String(applicationId))
  );
}
