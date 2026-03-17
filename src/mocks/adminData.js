export const adminMockCandidatures = [
  {
    id: 1,
    nom: "Amine B.",
    universite: "Universite d'Alger 1",
    specialite: "Informatique",
    date: "2026-03-08",
    statut: "En attente",
  },
  {
    id: 2,
    nom: "Sarah M.",
    universite: "Universite de Constantine 1",
    specialite: "Mathematiques",
    date: "2026-03-07",
    statut: "Acceptée",
  },
  {
    id: 3,
    nom: "Mohamed K.",
    universite: "Ecole Nationale Polytechnique",
    specialite: "Physique",
    date: "2026-03-07",
    statut: "En attente",
  },
  {
    id: 4,
    nom: "Fatima Z.",
    universite: "Universite d'Oran",
    specialite: "Chimie",
    date: "2026-03-06",
    statut: "Refusée",
  },
  {
    id: 5,
    nom: "Youssef A.",
    universite: "Universite de Tunis",
    specialite: "Biologie",
    date: "2026-03-06",
    statut: "Acceptée",
  },
];

export const adminStats = {
  totalCandidatures: 125,
  enAttente: 34,
  acceptees: 56,
  refusees: 35,
  totalEtudiants: 82,
  dossiersIncomplets: 12,
  candidaturesNonTraitees: 8,
  documentsManquants: 5,
};

export const adminRecentActivity = [
  {
    id: 1,
    icon: "Soumission",
    title: "Nouvelle candidature soumise",
    description: "Amine B. a soumis sa candidature en Informatique.",
    time: "Il y a 10 min",
  },
  {
    id: 2,
    icon: "Validation",
    title: "Candidature validee",
    description: "Sarah M. a ete acceptee par l'Universite de Constantine 1.",
    time: "Il y a 35 min",
  },
  {
    id: 3,
    icon: "Document",
    title: "Document ajoute",
    description: "Mohamed K. a televerse un nouveau releve de notes.",
    time: "Il y a 1 h",
  },
  {
    id: 4,
    icon: "Refus",
    title: "Candidature refusee",
    description: "Fatima Z. a recu une decision de refus.",
    time: "Il y a 2 h",
  },
];

export function getAdminProgress(candidature) {
  switch (candidature.statut) {
    case "En attente":
      return { profil: 80, documents: 60, finale: 40 };
    case "Acceptée":
    case "Refusée":
      return { profil: 100, documents: 100, finale: 100 };
    default:
      return { profil: 50, documents: 30, finale: 0 };
  }
}
