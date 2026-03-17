import React from "react";
import PropTypes from "prop-types";

export default function Card({ children, className = "" }) {
  return <div className={`ui-card ${className}`.trim()}>{children}</div>;
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
