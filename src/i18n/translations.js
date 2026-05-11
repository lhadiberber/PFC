import ar from "./ar";
import en from "./en";
import fr from "./fr";

export const SUPPORTED_LANGUAGES = {
  fr: {
    code: "fr",
    shortLabel: "FR",
    nativeLabel: "Francais",
    dir: "ltr",
    locale: "fr-FR",
  },
  en: {
    code: "en",
    shortLabel: "EN",
    nativeLabel: "English",
    dir: "ltr",
    locale: "en-US",
  },
  ar: {
    code: "ar",
    shortLabel: "AR",
    nativeLabel: "العربية",
    dir: "rtl",
    locale: "ar-DZ",
  },
};

export const translations = { fr, en, ar };
