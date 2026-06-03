import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSelector({
  className = "",
  compact = false,
  variant = "light",
  "aria-label": ariaLabel,
}) {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);
  const currentLanguage =
    supportedLanguages.find((option) => option.code === language) || supportedLanguages[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={selectorRef}
      className={`language-selector lang-dropdown language-selector-${variant} ${
        compact ? "language-selector-compact" : ""
      } ${className}`.trim()}
    >
      {!compact ? <span className="language-selector-label">{t("common.language")}</span> : null}
      <div className="language-selector-custom">
        <button
          type="button"
          className="language-selector-trigger lang-trigger"
          aria-label={ariaLabel || t("common.language")}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="language-selector-current lang-current">
            {currentLanguage?.shortLabel || language}
          </span>
          <svg
            className={`language-chevron ${isOpen ? "open" : ""}`.trim()}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <ul
          className={`language-selector-menu lang-menu ${isOpen ? "open" : ""}`.trim()}
          role="listbox"
        >
          {supportedLanguages.map((option) => (
            <li
              key={option.code}
              data-lang={option.code}
              className={option.code === language ? "active" : ""}
              role="option"
              aria-selected={option.code === language}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => handleLanguageChange(option.code)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleLanguageChange(option.code);
                }
              }}
            >
              {option.shortLabel}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

LanguageSelector.propTypes = {
  "aria-label": PropTypes.string,
  className: PropTypes.string,
  compact: PropTypes.bool,
  variant: PropTypes.oneOf(["light", "dark"]),
};
