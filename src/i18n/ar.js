const ar = {
  common: {
    brand: "PFC Admissions",
    portalAdmissions: "بوابة القبول",
    candidateSpace: "فضاء المترشح",
    adminSpace: "فضاء الإدارة",
    logout: "تسجيل الخروج",
    language: "اللغة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
  },
  home: {
    nav: {
      home: "الرئيسية",
      universities: "الجامعات",
      programs: "التخصصات",
      help: "المساعدة",
    },
    loginButton: "تسجيل الدخول",
    loginMenu: {
      submit: "دخول",
      createAccount: "إنشاء حساب",
      invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    },
    hero: {
      badge: "المنصة الوطنية للقبول",
      title: "رحلتك نحو التعليم العالي تبدأ من هنا",
      subtitle: "أرسل ملف ترشحك إلى أفضل الجامعات وتابع تقدمه بشكل فوري.",
      createAccount: "إنشاء حسابي",
      existingAccount: "لدي حساب بالفعل",
      stats: {
        students: "طالب",
        universities: "جامعة",
        applications: "ملف ترشح",
      },
    },
    steps: {
      title: "كيف أودع ملف الترشح؟",
      subtitle: "4 خطوات بسيطة لإرسال ملفك",
      items: [
        {
          number: "01",
          title: "إنشاء حساب",
          description: "سجل في بضع نقرات باستعمال معلوماتك الشخصية.",
        },
        {
          number: "02",
          title: "إكمال الملف",
          description: "أدخل معلوماتك الدراسية وارفع الوثائق المطلوبة.",
        },
        {
          number: "03",
          title: "اختيار التخصصات",
          description: "اختر حتى 3 جامعات أو تخصصات مستهدفة.",
        },
        {
          number: "04",
          title: "متابعة الترشح",
          description: "اطلع على تقدم ملفك بشكل فوري.",
        },
      ],
    },
    universities: {
      title: "الجامعات الشريكة",
      subtitle: "اكتشف مؤسسات التعليم العالي",
      items: [
        {
          badge: "عمومي",
          title: "جامعة الجزائر",
          description: "أكبر جامعة في البلاد بأكثر من 100 ألف طالب.",
          stats: ["150+ تخصص", "الجزائر"],
        },
        {
          badge: "عمومي",
          title: "جامعة وهران",
          description: "تميز في العلوم والتقنيات والطب.",
          stats: ["120+ تخصص", "وهران"],
        },
        {
          badge: "عمومي",
          title: "جامعة قسنطينة 3",
          description: "تقاليد أكاديمية معترف بها منذ 1975.",
          stats: ["90+ تخصص", "قسنطينة"],
        },
        {
          badge: "عمومي",
          title: "جامعة عنابة",
          description: "جامعة حديثة ومبتكرة في علوم الهندسة.",
          stats: ["80+ تخصص", "عنابة"],
        },
      ],
    },
    calendar: {
      title: "رزنامة القبول",
      subtitle: "التواريخ الرئيسية لحملة القبول لسنة 2026",
      phases: [
        {
          markerClass: "phase-jan",
          date: "15 جانفي 2026",
          title: "افتتاح التسجيلات",
          description: "بداية حملة الترشح",
        },
        {
          markerClass: "phase-mar",
          date: "30 مارس 2026",
          title: "آخر أجل",
          description: "غلق التسجيلات",
        },
        {
          markerClass: "phase-avril",
          date: "أفريل - ماي 2026",
          title: "المعالجة",
          description: "دراسة الملفات من طرف الجامعات",
        },
        {
          markerClass: "phase-juin",
          date: "10 جوان 2026",
          title: "النتائج",
          description: "إعلان نتائج القبول",
        },
      ],
    },
    features: {
      items: [
        {
          title: "بسيط وسريع",
          description: "أودع ملفك في 15 دقيقة من منزلك.",
        },
        {
          title: "آمن",
          description: "بياناتك الشخصية مشفرة ومحمية.",
        },
        {
          title: "في الوقت الحقيقي",
          description: "تابع ملفك على مدار الساعة.",
        },
        {
          title: "مرافقة",
          description: "فريق متاح للإجابة عن أسئلتك.",
        },
      ],
    },
    faq: {
      title: "الأسئلة الشائعة",
      subtitle: "كل ما تحتاج إلى معرفته",
      items: [
        {
          question: "كيف أنشئ حسابا؟",
          answer: "اضغط على 'إنشاء حسابي' ثم املأ الاستمارة بمعلوماتك الشخصية.",
        },
        {
          question: "ما الوثائق المطلوبة؟",
          answer:
            "ستحتاج إلى وثيقة الهوية، آخر شهادة متحصل عليها، كشوف النقاط وصورة هوية حديثة.",
        },
        {
          question: "كم عدد التخصصات التي يمكنني اختيارها؟",
          answer:
            "يمكنك اختيار حتى 3 تخصصات في جامعات مختلفة أو متشابهة.",
        },
        {
          question: "كيف أتابع ملف الترشح؟",
          answer: "سجل الدخول إلى فضائك الشخصي لمعرفة حالة ملفك مباشرة.",
        },
      ],
    },
    cta: {
      title: "هل أنت مستعد لبدء رحلتك؟",
      subtitle: "أنشئ حسابك الآن وابدأ في إرسال ملفك.",
      button: "إنشاء حسابي",
    },
    footer: {
      description: "المنصة الوطنية للقبول في التعليم العالي.",
      columns: [
        {
          title: "المنصة",
          links: ["الرئيسية", "الجامعات", "التخصصات"],
        },
        {
          title: "المساعدة",
          links: ["الأسئلة الشائعة", "اتصل بنا", "الدعم"],
        },
        {
          title: "قانوني",
          links: ["إشعارات قانونية", "الخصوصية", "الشروط"],
        },
      ],
      copyright: "© 2026 PFC Admissions - جميع الحقوق محفوظة",
    },
  },
  auth: {
    login: {
      introKicker: "الوصول إلى فضائك الشخصي",
      introTitle: "استرجع حسابك وتابع ملفاتك بكل سهولة.",
      introDescription:
        "سجل الدخول لإكمال ملفك، ومتابعة تقدمك، والوصول إلى فضاء القبول من واجهة واضحة وآمنة.",
      highlights: [
        {
          title: "وصول سريع",
          description: "اعثر على معلوماتك وتقدمك في ثوان.",
        },
        {
          title: "متابعة الترشح",
          description: "اطلع على الإيداعات والمراحل والقرارات من مكان واحد.",
        },
        {
          title: "دخول آمن",
          description: "يبقى حسابك مرتبطا بمعلوماتك ووثائقك.",
        },
      ],
      badge: "تسجيل الدخول",
      title: "تسجيل الدخول",
      subtitle: "ادخل إلى فضائك الشخصي وتابع تقدمك",
      submit: "دخول",
      footerText: "ليس لديك حساب بعد؟",
      footerLink: "إنشاء حساب",
      emailPlaceholder: "example@email.com",
      passwordPlaceholder: "أدخل كلمة المرور",
      errors: {
        emailRequired: "البريد الإلكتروني مطلوب.",
        invalidEmail: "يرجى إدخال بريد إلكتروني صالح.",
        passwordRequired: "كلمة المرور مطلوبة.",
        invalidStudentCredentials: "بيانات دخول الطالب غير صحيحة.",
      },
    },
    register: {
      introKicker: "منصة القبول الجامعي",
      introTitle: "فضاء واضح وآمن لتحضير ملف الترشح.",
      introDescription:
        "أنشئ حسابك لإكمال ملفك، وتجميع وثائقك، ومتابعة خطواتك بثقة.",
      highlights: [
        {
          title: "إيداع عبر الإنترنت",
          description: "كوّن ملفك من فضاء موحد.",
        },
        {
          title: "متابعة مركزية",
          description: "اعثر على طلباتك ووثائقك في الوقت الحقيقي.",
        },
        {
          title: "منصة آمنة",
          description: "تبقى معلوماتك مرتبطة بحسابك الشخصي.",
        },
      ],
      badge: "التسجيل",
      title: "إنشاء حساب",
      subtitle: "سجل من أجل الترشح",
      fields: {
        nom: "اللقب",
        prenom: "الاسم",
        email: "البريد الإلكتروني",
        telephone: "الهاتف",
        password: "كلمة المرور",
        confirmPassword: "تأكيد كلمة المرور",
      },
      placeholders: {
        nom: "لقبك",
        prenom: "اسمك",
        email: "example@email.com",
        telephone: "+213 555 123 456",
        password: "6 أحرف على الأقل",
        confirmPassword: "أكد كلمة المرور",
      },
      legal: {
        beforeTerms: "أوافق على ",
        terms: "شروط الاستخدام",
        between: " و",
        privacy: "سياسة الخصوصية",
        afterPrivacy: ".",
      },
      submit: "إنشاء حسابي",
      footerText: "لديك حساب بالفعل؟",
      footerLink: "تسجيل الدخول",
      errors: {
        nomRequired: "اللقب إجباري.",
        prenomRequired: "الاسم إجباري.",
        invalidEmail: "يرجى إدخال بريد إلكتروني صالح.",
        invalidPhone: "يرجى إدخال رقم هاتف صالح.",
        shortPassword: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
        passwordMismatch: "تأكيد كلمة المرور غير مطابق.",
        legalRequired: "يجب الموافقة على شروط الاستخدام.",
      },
    },
  },
  success: {
    title: "تم إرسال ملف ترشحك بنجاح.",
    dossierLabel: "رقم الملف:",
    submittedAt: "تم الإرسال يوم {{date}} على الساعة {{time}}",
    message: "يمكنك متابعة حالة ملفك من خلال 'ملفاتي'.",
    viewApplications: "عرض ملفاتي",
    backDashboard: "العودة إلى لوحة التحكم",
  },
  studentNav: {
    fallbackUser: "طالب",
    tracking: "متابعة الترشح",
    dashboard: "لوحة التحكم",
    applications: "ملفاتي",
    submit: "إيداع ملف",
    profile: "الملف الشخصي",
    collapse: "طي القائمة",
    expand: "توسيع القائمة",
  },
  adminLayout: {
    menu: {
      dashboard: "لوحة التحكم",
      candidatures: "الترشحات",
      students: "الطلبة",
      documents: "الوثائق",
      profile: "الملف الشخصي",
    },
    sidebarSubtitle: "مركز التسيير الإداري",
    spaceTag: "فضاء الإدارة",
    defaultOperator: "مسؤول المنصة",
    defaultRole: "مسير القبول",
    dateLabel: "التاريخ",
    notificationTitle: "إشعارات المعالجة",
    notifications: {
      consolidated: "{{count}} ملف ترشح مجمع",
      consolidatedDetail: "الحملة الإدارية المعروضة مجمعة في هذه اللوحة.",
      pending: "{{count}} قرارا في الانتظار",
      pendingDetail: "أولوية تشغيلية لطابور المعالجة.",
      documents: "{{count}} ملفا يحتاج للمراجعة",
      documentsDetail: "ينصح بمراجعة الوثائق قبل اتخاذ القرار النهائي.",
    },
    openQueue: "فتح طابور المعالجة",
    searchCaption: "بحث سريع",
    searchHelper: "ابحث بسرعة عن طالب أو جامعة أو تخصص أو رقم ملف.",
  },
};

export default ar;
