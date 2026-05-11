const en = {
  common: {
    brand: "PFC Admissions",
    portalAdmissions: "Admissions Portal",
    candidateSpace: "Candidate area",
    adminSpace: "Admin area",
    logout: "Log out",
    language: "Language",
    email: "Email",
    password: "Password",
  },
  home: {
    nav: {
      home: "Home",
      universities: "Universities",
      programs: "Programs",
      help: "Help",
    },
    loginButton: "Sign in",
    loginMenu: {
      submit: "Sign in",
      createAccount: "Create an account",
      invalidCredentials: "Incorrect email or password",
    },
    hero: {
      badge: "National admissions platform",
      title: "Your path to higher education starts here",
      subtitle:
        "Submit your application to top universities and track its progress in real time.",
      createAccount: "Create my account",
      existingAccount: "I already have an account",
      stats: {
        students: "Students",
        universities: "Universities",
        applications: "Applications",
      },
    },
    steps: {
      title: "How do I submit my application?",
      subtitle: "4 simple steps to submit your file",
      items: [
        {
          number: "01",
          title: "Create my account",
          description: "Sign up in a few clicks with your personal details.",
        },
        {
          number: "02",
          title: "Fill in my file",
          description:
            "Complete your academic information and upload your documents.",
        },
        {
          number: "03",
          title: "Choose my programs",
          description: "Select up to 3 targeted universities and programs.",
        },
        {
          number: "04",
          title: "Track my application",
          description: "Check the progress of your file in real time.",
        },
      ],
    },
    universities: {
      title: "Partner universities",
      subtitle: "Discover higher education institutions",
      items: [
        {
          badge: "Public",
          title: "University of Algiers",
          description:
            "The country's largest university with more than 100,000 students.",
          stats: ["150+ programs", "Algiers"],
        },
        {
          badge: "Public",
          title: "University of Oran",
          description: "Excellence in science, technology and medicine.",
          stats: ["120+ programs", "Oran"],
        },
        {
          badge: "Public",
          title: "Constantine 3 University",
          description: "Recognized academic tradition since 1975.",
          stats: ["90+ programs", "Constantine"],
        },
        {
          badge: "Public",
          title: "University of Annaba",
          description: "A modern and innovative university in engineering sciences.",
          stats: ["80+ programs", "Annaba"],
        },
      ],
    },
    calendar: {
      title: "Admissions calendar",
      subtitle: "Key dates for the 2026 admissions campaign",
      phases: [
        {
          markerClass: "phase-jan",
          date: "January 15, 2026",
          title: "Applications open",
          description: "Start of the admissions campaign",
        },
        {
          markerClass: "phase-mar",
          date: "March 30, 2026",
          title: "Deadline",
          description: "Applications close",
        },
        {
          markerClass: "phase-avril",
          date: "April - May 2026",
          title: "Review",
          description: "Files are reviewed by universities",
        },
        {
          markerClass: "phase-juin",
          date: "June 10, 2026",
          title: "Results",
          description: "Admissions results are published",
        },
      ],
    },
    features: {
      items: [
        {
          title: "Simple and fast",
          description: "Submit your file in 15 minutes from home.",
        },
        {
          title: "Secure",
          description: "Your personal data is encrypted and protected.",
        },
        {
          title: "Real time",
          description: "Track your application 24/7.",
        },
        {
          title: "Support",
          description: "A team is available to answer your questions.",
        },
      ],
    },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Everything you need to know",
      items: [
        {
          question: "How do I create an account?",
          answer:
            "Click 'Create my account' and complete the form with your personal information.",
        },
        {
          question: "Which documents do I need to provide?",
          answer:
            "You will need your ID, your highest diploma, your transcripts and a recent ID photo.",
        },
        {
          question: "How many programs can I choose?",
          answer:
            "You can select up to 3 programs in different or identical universities.",
        },
        {
          question: "How do I track my application?",
          answer:
            "Sign in to your personal area to see your file status in real time.",
        },
      ],
    },
    cta: {
      title: "Ready to start your journey?",
      subtitle: "Create your account now and submit your application.",
      button: "Create my account",
    },
    footer: {
      description: "The national higher education admissions platform.",
      columns: [
        {
          title: "Platform",
          links: ["Home", "Universities", "Programs"],
        },
        {
          title: "Help",
          links: ["FAQ", "Contact", "Support"],
        },
        {
          title: "Legal",
          links: ["Legal notice", "Privacy", "Terms"],
        },
      ],
      copyright: "© 2026 PFC Admissions - All rights reserved",
    },
  },
  auth: {
    login: {
      introKicker: "Access your personal area",
      introTitle: "Find your account and track your applications with ease.",
      introDescription:
        "Sign in to complete your file, review your progress and access your admissions space from a clear and secure interface.",
      highlights: [
        {
          title: "Quick access",
          description: "Find your information and progress in seconds.",
        },
        {
          title: "Application tracking",
          description:
            "Review your submissions, steps and decisions from one place.",
        },
        {
          title: "Secure sign-in",
          description: "Your account stays linked to your information and files.",
        },
      ],
      badge: "Sign in",
      title: "Sign in",
      subtitle: "Access your personal space and follow your progress",
      submit: "Sign in",
      footerText: "No account yet?",
      footerLink: "Create an account",
      emailPlaceholder: "your.email@example.com",
      passwordPlaceholder: "Enter your password",
      errors: {
        emailRequired: "Email address is required.",
        invalidEmail: "Please enter a valid email address.",
        passwordRequired: "Password is required.",
        invalidStudentCredentials: "The student credentials are incorrect.",
      },
    },
    register: {
      introKicker: "University admissions platform",
      introTitle: "A clear and secure space to prepare your application.",
      introDescription:
        "Create your account to complete your profile, centralize your documents and follow your process with confidence.",
      highlights: [
        {
          title: "Online submission",
          description: "Build your file from one dedicated space.",
        },
        {
          title: "Centralized tracking",
          description: "Find your applications and documents in real time.",
        },
        {
          title: "Secure platform",
          description: "Your information stays linked to your personal account.",
        },
      ],
      badge: "Registration",
      title: "Create an account",
      subtitle: "Sign up to apply",
      fields: {
        nom: "Last name",
        prenom: "First name",
        email: "Email",
        telephone: "Phone",
        password: "Password",
        confirmPassword: "Confirm password",
      },
      placeholders: {
        nom: "Your last name",
        prenom: "Your first name",
        email: "your.email@example.com",
        telephone: "+213 555 123 456",
        password: "Minimum 6 characters",
        confirmPassword: "Confirm your password",
      },
      legal: {
        beforeTerms: "I accept the ",
        terms: "terms of use",
        between: " and the ",
        privacy: "privacy policy",
        afterPrivacy: ".",
      },
      submit: "Create my account",
      footerText: "Already have an account?",
      footerLink: "Sign in",
      errors: {
        nomRequired: "Last name is required.",
        prenomRequired: "First name is required.",
        invalidEmail: "Please enter a valid email address.",
        invalidPhone: "Please enter a valid phone number.",
        shortPassword: "Password must contain at least 6 characters.",
        passwordMismatch: "Password confirmation does not match.",
        legalRequired: "You must accept the terms of use.",
      },
    },
  },
  success: {
    title: "Your application has been submitted successfully.",
    dossierLabel: "Application number:",
    submittedAt: "Submitted on {{date}} at {{time}}",
    message: "You can follow your application status in 'My applications'.",
    viewApplications: "View my applications",
    backDashboard: "Back to dashboard",
  },
  studentNav: {
    fallbackUser: "Student",
    tracking: "Application tracking",
    dashboard: "Dashboard",
    applications: "My applications",
    submit: "Submit a file",
    profile: "Profile",
    collapse: "Collapse navigation",
    expand: "Expand navigation",
  },
  adminLayout: {
    menu: {
      dashboard: "Dashboard",
      candidatures: "Applications",
      students: "Students",
      documents: "Documents",
      profile: "Profile",
    },
    sidebarSubtitle: "Administrative control center",
    spaceTag: "Admin area",
    defaultOperator: "Platform administrator",
    defaultRole: "Admissions manager",
    dateLabel: "Date",
    notificationTitle: "Processing notifications",
    notifications: {
      consolidated: "{{count}} consolidated applications",
      consolidatedDetail:
        "The visible admin campaign is centralized in this dashboard.",
      pending: "{{count}} decisions to process",
      pendingDetail: "Operational priority for the review queue.",
      documents: "{{count}} files to review",
      documentsDetail: "Document review is recommended before final arbitration.",
    },
    openQueue: "Open processing queue",
    searchCaption: "Quick search",
    searchHelper:
      "Quickly search for a student, university, program or application number.",
  },
};

export default en;
