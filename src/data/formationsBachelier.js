export const NIVEAU_BACHELIER = "Première année universitaire";

export const formationsBachelier = [
  {
    domaine: "Mathématiques et informatique",
    filieres: [
      {
        nom: "Informatique",
        etablissements: [
          {
            nom: "Université d'Oran 1",
            faculte: "Faculté des sciences exactes et appliquées",
            wilaya: "Oran",
            type: "Université publique",
          },
          {
            nom: "Université d'Alger 1",
            faculte: "Faculté des sciences",
            wilaya: "Alger",
            type: "Université publique",
          },
          {
            nom: "Université de Tlemcen",
            faculte: "Faculté des sciences",
            wilaya: "Tlemcen",
            type: "Université publique",
          },
        ],
      },
      {
        nom: "Mathématiques",
        etablissements: [
          {
            nom: "Université des sciences et de la technologie Houari Boumediene",
            faculte: "Faculté de mathématiques",
            wilaya: "Alger",
            type: "Université publique",
          },
          {
            nom: "Université de Constantine 1",
            faculte: "Faculté des sciences exactes",
            wilaya: "Constantine",
            type: "Université publique",
          },
        ],
      },
    ],
  },
  {
    domaine: "Sciences et technologies",
    filieres: [
      {
        nom: "Sciences et technologie",
        etablissements: [
          {
            nom: "Université de Blida 1",
            faculte: "Faculté de technologie",
            wilaya: "Blida",
            type: "Université publique",
          },
          {
            nom: "Université de Sétif 1",
            faculte: "Faculté de technologie",
            wilaya: "Sétif",
            type: "Université publique",
          },
        ],
      },
      {
        nom: "Génie civil",
        etablissements: [
          {
            nom: "École nationale des travaux publics",
            faculte: "Département de génie civil",
            wilaya: "Alger",
            type: "École supérieure",
          },
          {
            nom: "Université de Béjaïa",
            faculte: "Faculté de technologie",
            wilaya: "Béjaïa",
            type: "Université publique",
          },
        ],
      },
    ],
  },
  {
    domaine: "Sciences économiques et gestion",
    filieres: [
      {
        nom: "Gestion",
        etablissements: [
          {
            nom: "Université d'Alger 3",
            faculte: "Faculté des sciences économiques",
            wilaya: "Alger",
            type: "Université publique",
          },
          {
            nom: "École supérieure de commerce",
            faculte: "Département gestion",
            wilaya: "Alger",
            type: "École supérieure",
          },
        ],
      },
      {
        nom: "Économie",
        etablissements: [
          {
            nom: "Université d'Oran 2",
            faculte: "Faculté des sciences économiques",
            wilaya: "Oran",
            type: "Université publique",
          },
          {
            nom: "Université de Mostaganem",
            faculte: "Faculté des sciences économiques",
            wilaya: "Mostaganem",
            type: "Université publique",
          },
        ],
      },
    ],
  },
  {
    domaine: "Lettres et langues",
    filieres: [
      {
        nom: "Langues étrangères",
        etablissements: [
          {
            nom: "Université d'Alger 2",
            faculte: "Faculté des langues étrangères",
            wilaya: "Alger",
            type: "Université publique",
          },
          {
            nom: "Université de Tizi Ouzou",
            faculte: "Faculté des lettres et des langues",
            wilaya: "Tizi Ouzou",
            type: "Université publique",
          },
        ],
      },
      {
        nom: "Lettres et philosophie",
        etablissements: [
          {
            nom: "Université de Constantine 2",
            faculte: "Faculté des lettres et des sciences humaines",
            wilaya: "Constantine",
            type: "Université publique",
          },
          {
            nom: "Université de Mascara",
            faculte: "Faculté des lettres",
            wilaya: "Mascara",
            type: "Université publique",
          },
        ],
      },
    ],
  },
];

export function getDomaines() {
  return formationsBachelier.map((item) => item.domaine);
}

export function getFilieresByDomaine(domaine) {
  return formationsBachelier.find((item) => item.domaine === domaine)?.filieres || [];
}

export function findFiliereByName(filiereName) {
  for (const domaine of formationsBachelier) {
    const filiere = domaine.filieres.find((item) => item.nom === filiereName);
    if (filiere) {
      return {
        domaine: domaine.domaine,
        ...filiere,
      };
    }
  }

  return null;
}
