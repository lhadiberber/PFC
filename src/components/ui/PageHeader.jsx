import React from "react";
import PropTypes from "prop-types";

export default function PageHeader({ title, subtitle, className = "" }) {
  return (
    <div className={`ui-page-header ${className}`.trim()}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  className: PropTypes.string,
};
