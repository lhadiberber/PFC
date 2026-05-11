import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { SUPPORTED_LANGUAGES, translations } from "../i18n/translations";

const LANGUAGE_STORAGE_KEY = "appLanguage";
const DEFAULT_LANGUAGE = "fr";

const LanguageContext = createContext(null);

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage && SUPPORTED_LANGUAGES[storedLanguage]) {
    return storedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function resolveMessage(source, key) {
  return key.split(".").reduce((current, segment) => current?.[segment], source);
}

function interpolateMessage(message, values = {}) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    message
  );
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  const languageMeta = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  const messages = translations[language] || translations[DEFAULT_LANGUAGE];

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = languageMeta.dir;
    document.body.classList.toggle("app-rtl", languageMeta.dir === "rtl");

    return () => {
      document.body.classList.remove("app-rtl");
    };
  }, [language, languageMeta.dir]);

  const value = useMemo(() => {
    const supportedLanguages = Object.values(SUPPORTED_LANGUAGES);

    return {
      language,
      setLanguage,
      locale: languageMeta.locale,
      direction: languageMeta.dir,
      messages,
      supportedLanguages,
      t: (key, values) => {
        const localizedValue =
          resolveMessage(translations[language], key) ??
          resolveMessage(translations[DEFAULT_LANGUAGE], key) ??
          key;

        return typeof localizedValue === "string"
          ? interpolateMessage(localizedValue, values)
          : localizedValue;
      },
    };
  }, [language, languageMeta.dir, languageMeta.locale, messages]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
