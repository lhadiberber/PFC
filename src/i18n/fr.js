const fr = {
  common: {
    brand: "PFC Admissions",
    portalAdmissions: "Portail Admissions",
    candidateSpace: "Espace candidat",
    adminSpace: "Espace administrateur",
    logout: "Deconnexion",
    language: "Langue",
    email: "Email",
    password: "Mot de passe",
  },
  home: {
    nav: {
      home: "Accueil",
      universities: "Universites",
      programs: "Formations",
      help: "Aide",
    },
    loginButton: "Connexion",
    loginMenu: {
      submit: "Se connecter",
      createAccount: "Creer un compte",
      invalidCredentials: "Email ou mot de passe incorrect",
    },
    hero: {
      badge: "Plateforme nationale d'admission",
      title: "Votre parcours vers l'enseignement superieur commence ici",
      subtitle:
        "Deposez votre candidature dans les meilleures universites et suivez son evolution en temps reel.",
      createAccount: "Creer mon compte",
      existingAccount: "J'ai deja un compte",
      stats: {
        students: "Etudiants",
        universities: "Universites",
        applications: "Candidatures",
      },
    },
    steps: {
      title: "Comment deposer ma candidature ?",
      subtitle: "4 etapes simples pour soumettre votre dossier",
      items: [
        {
          number: "01",
          title: "Creer mon compte",
          description:
            "Inscrivez-vous en quelques clics avec vos informations personnelles.",
        },
        {
          number: "02",
          title: "Remplir mon dossier",
          description:
            "Completez vos informations academiques et telechargez vos documents.",
        },
        {
          number: "03",
          title: "Choisir mes formations",
          description: "Selectionnez jusqu'a 3 universites et formations ciblees.",
        },
        {
          number: "04",
          title: "Suivre ma candidature",
          description:
            "Consultez l'etat d'avancement de votre dossier en temps reel.",
        },
      ],
    },
    universities: {
      title: "Universites partenaires",
      subtitle: "Decouvrez les etablissements d'enseignement superieur",
      items: [
        {
          badge: "Public",
          title: "Universite d'Alger",
          description:
            "La plus grande universite du pays avec plus de 100 000 etudiants.",
          stats: ["150+ formations", "Alger"],
        },
        {
          badge: "Public",
          title: "Universite d'Oran",
          description: "Excellence en sciences, techniques et medecine.",
          stats: ["120+ formations", "Oran"],
        },
        {
          badge: "Public",
          title: "Universite Constantine 3",
          description: "Tradition academique reconnue depuis 1975.",
          stats: ["90+ formations", "Constantine"],
        },
        {
          badge: "Public",
          title: "Universite Annaba",
          description:
            "Universite moderne et innovante en sciences de l'ingenieur.",
          stats: ["80+ formations", "Annaba"],
        },
      ],
    },
    calendar: {
      title: "Calendrier d'admission",
      subtitle: "Les dates cles de la campagne d'admission 2026",
      phases: [
        {
          markerClass: "phase-jan",
          date: "15 Janvier 2026",
          title: "Ouverture des inscriptions",
          description: "Debut de la campagne de candidature",
        },
        {
          markerClass: "phase-mar",
          date: "30 Mars 2026",
          title: "Date limite",
          description: "Cloture des inscriptions",
        },
        {
          markerClass: "phase-avril",
          date: "Avril - Mai 2026",
          title: "Traitement",
          description: "Analyse des dossiers par les universites",
        },
        {
          markerClass: "phase-juin",
          date: "10 Juin 2026",
          title: "Resultats",
          description: "Publication des admissions",
        },
      ],
    },
    features: {
      items: [
        {
          title: "Simple et rapide",
          description: "Deposez votre dossier en 15 minutes depuis chez vous.",
        },
        {
          title: "Securise",
          description: "Vos donnees personnelles sont cryptees et protegees.",
        },
        {
          title: "Temps reel",
          description: "Suivez l'evolution de votre candidature 24h/24.",
        },
        {
          title: "Assistance",
          description: "Une equipe disponible pour repondre a vos questions.",
        },
      ],
    },
    faq: {
      title: "Questions frequentes",
      subtitle: "Tout ce que vous devez savoir",
      items: [
        {
          question: "Comment creer un compte ?",
          answer:
            "Cliquez sur 'Creer mon compte' et remplissez le formulaire avec vos informations personnelles.",
        },
        {
          question: "Quels documents dois-je fournir ?",
          answer:
            "Vous aurez besoin de votre piece d'identite, de votre diplome le plus eleve, de vos releves de notes et d'une photo d'identite recente.",
        },
        {
          question: "Combien de formations puis-je choisir ?",
          answer:
            "Vous pouvez selectionner jusqu'a 3 formations dans des universites differentes ou identiques.",
        },
        {
          question: "Comment suivre ma candidature ?",
          answer:
            "Connectez-vous a votre espace personnel pour voir le statut de votre dossier en temps reel.",
        },
      ],
    },
    cta: {
      title: "Pret a commencer votre parcours ?",
      subtitle: "Creez votre compte des maintenant et deposez votre candidature.",
      button: "Creer mon compte",
    },
    footer: {
      description: "La plateforme nationale d'admission a l'enseignement superieur.",
      columns: [
        {
          title: "Plateforme",
          links: ["Accueil", "Universites", "Formations"],
        },
        {
          title: "Aide",
          links: ["FAQ", "Contact", "Support"],
        },
        {
          title: "Legal",
          links: ["Mentions legales", "Confidentialite", "CGU"],
        },
      ],
      copyright: "© 2026 PFC Admissions - Tous droits reserves",
    },
  },
  auth: {
    login: {
      introKicker: "Acces a votre espace personnel",
      introTitle:
        "Retrouvez votre compte pour suivre vos candidatures en toute simplicite.",
      introDescription:
        "Connectez-vous pour completer votre dossier, consulter l'etat de vos demarches et acceder a votre espace d'admission depuis une interface claire et securisee.",
      highlights: [
        {
          title: "Acces rapide",
          description:
            "Retrouvez vos informations et votre progression en quelques secondes.",
        },
        {
          title: "Suivi de candidature",
          description:
            "Consultez vos depots, vos etapes et vos decisions depuis un seul espace.",
        },
        {
          title: "Connexion securisee",
          description:
            "Votre compte reste associe a vos informations et a vos documents.",
        },
      ],
      badge: "Connexion",
      title: "Se connecter",
      subtitle: "Accedez a votre espace personnel et suivez vos demarches",
      submit: "Se connecter",
      footerText: "Pas encore de compte ?",
      footerLink: "Creer un compte",
      emailPlaceholder: "votre.email@exemple.com",
      passwordPlaceholder: "Saisissez votre mot de passe",
      errors: {
        emailRequired: "L'adresse e-mail est requise.",
        invalidEmail: "Veuillez saisir une adresse e-mail valide.",
        passwordRequired: "Le mot de passe est requis.",
        invalidStudentCredentials:
          "Les identifiants etudiant saisis sont incorrects.",
      },
    },
    register: {
      introKicker: "Plateforme d'admission universitaire",
      introTitle: "Un espace clair et securise pour preparer votre candidature.",
      introDescription:
        "Creez votre compte pour completer votre profil, centraliser vos documents et suivre vos demarches dans un parcours simple et rassurant.",
      highlights: [
        {
          title: "Depot en ligne",
          description: "Constituez votre dossier depuis un espace unique.",
        },
        {
          title: "Suivi centralise",
          description: "Retrouvez vos candidatures et vos pieces en temps reel.",
        },
        {
          title: "Plateforme securisee",
          description:
            "Vos informations restent associees a votre compte personnel.",
        },
      ],
      badge: "Inscription",
      title: "Creer un compte",
      subtitle: "Inscrivez-vous pour candidater",
      fields: {
        nom: "Nom",
        prenom: "Prenom",
        email: "Email",
        telephone: "Telephone",
        password: "Mot de passe",
        confirmPassword: "Confirmation du mot de passe",
      },
      placeholders: {
        nom: "Votre nom",
        prenom: "Votre prenom",
        email: "votre.email@exemple.com",
        telephone: "+213 555 123 456",
        password: "Minimum 6 caracteres",
        confirmPassword: "Confirmer le mot de passe",
      },
      legal: {
        beforeTerms: "J'accepte les ",
        terms: "conditions d'utilisation",
        between: " et la ",
        privacy: "politique de confidentialite",
        afterPrivacy: ".",
      },
      submit: "Creer mon compte",
      footerText: "Deja un compte ?",
      footerLink: "Se connecter",
      errors: {
        nomRequired: "Le nom est obligatoire.",
        prenomRequired: "Le prenom est obligatoire.",
        invalidEmail: "Veuillez saisir une adresse e-mail valide.",
        invalidPhone: "Veuillez saisir un numero de telephone valide.",
        shortPassword: "Le mot de passe doit contenir au moins 6 caracteres.",
        passwordMismatch:
          "La confirmation du mot de passe ne correspond pas.",
        legalRequired: "Vous devez accepter les conditions d'utilisation.",
      },
    },
  },
  success: {
    title: "Votre candidature a ete soumise avec succes.",
    dossierLabel: "Numero de dossier :",
    submittedAt: "Soumis le {{date}} a {{time}}",
    message:
      "Vous pouvez suivre le statut de votre candidature dans 'Mes candidatures'.",
    viewApplications: "Voir mes candidatures",
    backDashboard: "Retour au tableau de bord",
  },
  studentNav: {
    fallbackUser: "Etudiant",
    tracking: "Suivi de candidature",
    dashboard: "Dashboard",
    applications: "Mes candidatures",
    submit: "Deposer un dossier",
    profile: "Profil",
    collapse: "Replier la navigation",
    expand: "Developper la navigation",
  },
  adminLayout: {
    menu: {
      dashboard: "Dashboard",
      candidatures: "Candidatures",
      students: "Etudiants",
      documents: "Documents",
      profile: "Profil",
    },
    sidebarSubtitle: "Centre de pilotage administratif",
    spaceTag: "Espace administrateur",
    defaultOperator: "Administrateur plateforme",
    defaultRole: "Gestionnaire des admissions",
    dateLabel: "Date",
    notificationTitle: "Notifications de traitement",
    notifications: {
      consolidated: "{{count}} candidatures consolidees",
      consolidatedDetail:
        "La campagne admin visible est centralisee dans ce tableau de bord.",
      pending: "{{count}} decisions a traiter",
      pendingDetail: "Priorite operationnelle pour la file d'instruction.",
      documents: "{{count}} dossiers a verifier",
      documentsDetail: "Controle documentaire recommande avant arbitrage.",
    },
    openQueue: "Ouvrir la file de traitement",
    searchCaption: "Recherche rapide",
    searchHelper:
      "Recherchez rapidement un etudiant, une universite, une specialite ou un numero de dossier.",
  },
};

export default fr;
