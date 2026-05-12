import React from "react";
import PropTypes from "prop-types";

const STATUS_CLASS_MAP = {
  Actif: "statut-actif",
  "En attente": "statut-attente",
  Acceptée: "statut-acceptee",
  Acceptee: "statut-acceptee",
  Accepte: "statut-acceptee",
  Valide: "statut-acceptee",
  Refusée: "statut-rejetee",
  Rejetee: "statut-rejetee",
  Refuse: "statut-rejetee",
  Refusee: "statut-rejetee",
};

export default function StatusBadge({ status, className = "" }) {
  const statusClass = STATUS_CLASS_MAP[status] || "statut-attente";
  return <span className={`statut-badge ${statusClass} ${className}`.trim()}>{status}</span>;
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
};
