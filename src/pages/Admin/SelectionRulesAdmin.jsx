import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import {
  createSelectionRule,
  deleteSelectionRule,
  listSelectionRules,
  updateSelectionRule,
} from "../../services/adminService";
import { clearAuthSession, getApiErrorMessage, getAuthSession } from "../../services/authService";
import { formationsBachelier } from "../../data/formationsBachelier";
import { formatAdminDate } from "../../utils/adminApplications";
import "../../index.css";

const DOCUMENT_OPTIONS = [
  "Relevé de notes du baccalauréat",
  "Attestation de réussite au baccalauréat",
  "Pièce d'identité",
  "Photo d'identité",
  "Certificat de résidence",
  "Justificatif particulier",
];

const BAC_SERIES = [
  "Sciences expérimentales",
  "Mathématiques",
  "Techniques mathématiques",
  "Gestion et économie",
  "Lettres et philosophie",
  "Langues étrangères",
];

const CONFIGURED_FILIERE_GROUPS = formationsBachelier.map((domaine) => ({
  domaine: domaine.domaine,
  filieres: domaine.filieres.map((filiere) => filiere.nom),
}));

const CONFIGURED_FILIERES = new Set(
  CONFIGURED_FILIERE_GROUPS.flatMap((group) => group.filieres)
);

const emptyRuleForm = {
  filiere: "",
  moyenne_min: "10",
  series_acceptees: [],
  documents_obligatoires: DOCUMENT_OPTIONS.slice(0, 3),
  university_scope: "",
  assigned_department: "",
};

function buildPayload(form) {
  return {
    filiere: form.filiere.trim(),
    moyenne_min: Number(form.moyenne_min || 0),
    series_acceptees: form.series_acceptees,
    documents_obligatoires: form.documents_obligatoires,
    university_scope: form.university_scope.trim(),
    assigned_department: form.assigned_department.trim(),
  };
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderTags(value, fallback) {
  const items = normalizeArray(value);

  if (items.length === 0) {
    return <span className="admin-selection-muted">{fallback}</span>;
  }

  return (
    <div className="admin-selection-tag-list">
      {items.map((item) => (
        <span key={item} className="admin-selection-tag">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function SelectionRulesAdmin() {
  const session = getAuthSession();
  const isSuperAdmin = session?.role === "super_admin";
  const [rules, setRules] = useState([]);
  const [formData, setFormData] = useState(emptyRuleForm);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const savedFilieres = rules
    .map((rule) => String(rule.filiere || "").trim())
    .filter((filiere, index, filieres) =>
      filiere && !CONFIGURED_FILIERES.has(filiere) && filieres.indexOf(filiere) === index
    );
  const filiereGroups = savedFilieres.length
    ? [...CONFIGURED_FILIERE_GROUPS, { domaine: "Filières déjà enregistrées", filieres: savedFilieres }]
    : CONFIGURED_FILIERE_GROUPS;
  const selectedSeriesCount = normalizeArray(formData.series_acceptees).length;
  const selectedDocumentsCount = normalizeArray(formData.documents_obligatoires).length;

  useEffect(() => {
    let isActive = true;

    async function loadRules() {
      setIsLoading(true);
      setError("");

      try {
        const rows = await listSelectionRules();
        if (isActive) setRules(rows);
      } catch (loadError) {
        if (!isActive) return;
        if (loadError.status === 401) {
          clearAuthSession();
          return;
        }
        setError(getApiErrorMessage(loadError, "Impossible de charger les règles de sélection."));
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadRules();

    return () => {
      isActive = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleDocumentToggle = (documentLabel) => {
    setFormData((current) => {
      const selectedDocuments = normalizeArray(current.documents_obligatoires);
      const isSelected = selectedDocuments.includes(documentLabel);
      const nextDocuments = isSelected
        ? selectedDocuments.filter((item) => item !== documentLabel)
        : [...selectedDocuments, documentLabel];

      return { ...current, documents_obligatoires: nextDocuments };
    });
    setError("");
    setMessage("");
  };

  const handleSeriesToggle = (serieLabel) => {
    setFormData((current) => {
      const selectedSeries = normalizeArray(current.series_acceptees);
      const isSelected = selectedSeries.includes(serieLabel);
      const nextSeries = isSelected
        ? selectedSeries.filter((item) => item !== serieLabel)
        : [...selectedSeries, serieLabel];

      return { ...current, series_acceptees: nextSeries };
    });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildPayload(formData);

    if (!payload.filiere) {
      setError("La filière est obligatoire.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const savedRule = editingRuleId
        ? await updateSelectionRule(editingRuleId, payload)
        : await createSelectionRule(payload);

      if (savedRule) {
        setRules((current) =>
          editingRuleId
            ? current.map((rule) => (rule.id === savedRule.id ? savedRule : rule))
            : [savedRule, ...current]
        );
      }

      setEditingRuleId(null);
      setFormData(emptyRuleForm);
      setMessage(editingRuleId ? "Règle mise à jour." : "Règle créée.");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Impossible d'enregistrer la règle."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rule) => {
    setEditingRuleId(rule.id);
    setFormData({
      filiere: rule.filiere || "",
      moyenne_min: String(rule.moyenne_min ?? ""),
      series_acceptees: normalizeArray(rule.series_acceptees),
      documents_obligatoires: normalizeArray(rule.documents_obligatoires),
      university_scope: rule.university_scope || "",
      assigned_department: rule.assigned_department || "",
    });
    setError("");
    setMessage("");
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setFormData(emptyRuleForm);
  };

  const handleDelete = async (rule) => {
    try {
      await deleteSelectionRule(rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));
      setMessage("Règle supprimée.");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Impossible de supprimer la règle."));
    }
  };

  return (
    <AdminLayout
      title="Règles de sélection"
      subtitle="Définissez une présélection automatique pour aider l'instruction des candidatures."
      showSearch={false}
    >
      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Présélection</span>
            <h2>{editingRuleId ? "Modifier une règle" : "Créer une règle"}</h2>
            <p>La décision finale reste toujours validée par un administrateur.</p>
          </div>
        </div>

        {error ? <div className="auth-feedback auth-feedback-error">{error}</div> : null}
        {message ? <div className="auth-feedback auth-feedback-success">{message}</div> : null}

        <form className="admin-selection-form" onSubmit={handleSubmit}>
          <div className="admin-selection-form-grid">
            <label className="admin-selection-field">
              <span>Filière concernée</span>
              <select
                className="admin-search-input"
                name="filiere"
                value={formData.filiere}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="">Sélectionner une filière disponible</option>
                {filiereGroups.map((group) => (
                  <optgroup key={group.domaine} label={group.domaine}>
                    {group.filieres.map((filiere) => (
                      <option key={filiere} value={filiere}>
                        {filiere}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="admin-selection-field">
              <span>Moyenne minimale</span>
              <input
                className="admin-search-input"
                name="moyenne_min"
                value={formData.moyenne_min}
                onChange={handleChange}
                type="number"
                min="0"
                max="20"
                step="0.01"
                disabled={isSaving}
              />
            </label>
          </div>
          <fieldset className="admin-selection-fieldset">
            <legend>
              <span>Séries acceptées</span>
              <em>{selectedSeriesCount > 0 ? `${selectedSeriesCount} sélectionnée(s)` : "Toutes"}</em>
            </legend>
            <div className="admin-selection-checkbox-grid">
              {BAC_SERIES.map((serieLabel) => (
                <label key={serieLabel} className="admin-selection-checkbox">
                  <input
                    type="checkbox"
                    checked={normalizeArray(formData.series_acceptees).includes(serieLabel)}
                    onChange={() => handleSeriesToggle(serieLabel)}
                    disabled={isSaving}
                  />
                  <span>{serieLabel}</span>
                </label>
              ))}
            </div>
            <p className="admin-selection-fieldset-note">
              Aucune série cochée : toutes les séries du bac sont acceptées.
            </p>
          </fieldset>
          <fieldset className="admin-selection-fieldset">
            <legend>
              <span>Documents obligatoires</span>
              <em>{selectedDocumentsCount} sélectionné(s)</em>
            </legend>
            <div className="admin-selection-checkbox-grid">
              {DOCUMENT_OPTIONS.map((documentLabel) => (
                <label key={documentLabel} className="admin-selection-checkbox">
                  <input
                    type="checkbox"
                    checked={normalizeArray(formData.documents_obligatoires).includes(documentLabel)}
                    onChange={() => handleDocumentToggle(documentLabel)}
                    disabled={isSaving}
                  />
                  <span>{documentLabel}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {isSuperAdmin ? (
            <div className="admin-selection-form-grid">
              <label className="admin-selection-field">
                <span>Université / établissement</span>
                <input
                  className="admin-search-input"
                  name="university_scope"
                  value={formData.university_scope}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </label>
              <label className="admin-selection-field">
                <span>Département / filière</span>
                <input
                  className="admin-search-input"
                  name="assigned_department"
                  value={formData.assigned_department}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </label>
            </div>
          ) : null}
          <div className="admin-selection-actions">
            <Button type="submit" className="admin-table-action-button" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : editingRuleId ? "Mettre à jour" : "Créer la règle"}
            </Button>
            {editingRuleId ? (
              <Button type="button" className="admin-filter-tab" onClick={handleCancelEdit}>
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context neutral">Règles actives</span>
            <h2>Règles enregistrées</h2>
            <p>Ces règles produisent un statut de présélection, pas une décision finale.</p>
          </div>
        </div>

        {isLoading ? (
          <EmptyState
            title="Chargement des règles..."
            description="Veuillez patienter quelques instants."
            className="admin-empty-state"
          />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table mobile-cards">
              <thead>
                <tr>
                  <th>Filière</th>
                  <th>Moyenne</th>
                  <th>Séries acceptées</th>
                  <th>Documents obligatoires</th>
                  <th>Périmètre</th>
                  <th>Mise à jour</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title="Aucune règle enregistrée."
                        description="Créez une règle simple pour commencer la présélection."
                        className="admin-empty-state"
                      />
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id}>
                      <td data-label="Filière">{rule.filiere}</td>
                      <td data-label="Moyenne">{rule.moyenne_min}/20</td>
                      <td data-label="Séries acceptées">{renderTags(rule.series_acceptees, "Toutes")}</td>
                      <td data-label="Documents obligatoires">
                        {renderTags(rule.documents_obligatoires, "Aucun")}
                      </td>
                      <td data-label="Périmètre">
                        <div className="admin-table-meta">
                          <span className="admin-table-meta-text">{rule.university_scope || "Global"}</span>
                          <span className="admin-table-meta-subtext">
                            {rule.assigned_department || "Tous les départements"}
                          </span>
                        </div>
                      </td>
                      <td data-label="Mise à jour">{formatAdminDate(rule.updated_at)}</td>
                      <td data-label="Action">
                        <Button className="admin-table-action-button" onClick={() => handleEdit(rule)}>
                          Modifier
                        </Button>
                        <Button className="admin-table-action-button" onClick={() => handleDelete(rule)}>
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
