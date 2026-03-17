import React from "react";
import PropTypes from "prop-types";

export default function Button({
  children,
  className = "",
  type = "button",
  onClick,
  disabled = false,
  title,
}) {
  return (
    <button
      type={type}
      className={`ui-button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  title: PropTypes.string,
};
