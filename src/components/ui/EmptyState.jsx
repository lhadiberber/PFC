import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  className = "",
}) {
  return (
    <div className={`ui-empty-state ${className}`.trim()}>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="ui-empty-link">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  actionTo: PropTypes.string,
  className: PropTypes.string,
};
