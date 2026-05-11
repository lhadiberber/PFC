import React from "react";
import PropTypes from "prop-types";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSelector({
  className = "",
  compact = false,
  variant = "light",
}) {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();

  return (
    <label
      className={`language-selector language-selector-${variant} ${
        compact ? "language-selector-compact" : ""
      } ${className}`.trim()}
    >
      {!compact ? <span className="language-selector-label">{t("common.language")}</span> : null}
      <select
        className="language-selector-control"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("common.language")}
      >
        {supportedLanguages.map((option) => (
          <option key={option.code} value={option.code}>
            {compact ? option.shortLabel : option.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

LanguageSelector.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
  variant: PropTypes.oneOf(["light", "dark"]),
};
