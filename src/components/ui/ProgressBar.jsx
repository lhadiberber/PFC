import React from "react";
import PropTypes from "prop-types";

export default function ProgressBar({
  value,
  color,
  className = "",
  label,
  compact = false,
}) {
  return (
    <div className={`ui-progress ${compact ? "compact" : ""} ${className}`.trim()}>
      <div className="ui-progress-track">
        <div
          className="ui-progress-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      {label && <span className="ui-progress-label">{label}</span>}
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  color: PropTypes.string,
  className: PropTypes.string,
  label: PropTypes.string,
  compact: PropTypes.bool,
};
