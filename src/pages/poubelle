<h1>Gestion des Admissions</h1>
      <p>Choisissez votre espace</p>

      <Link to="/student">
        <button>Espace Étudiant</button>
      </Link>

      <br /><br />

      <Link to="/admin">
        <button>Espace Administrateur</button>
      </Link>
      <br /><br />





























      import { useState } from "react";
import { Link } from "react-router-dom";
import "../index.css";

// Liste des indicatifs pays
const countryCodes = [
  { code: "+93", pays: "Afghanistan" },
  { code: "+355", pays: "Albanie" },
  { code: "+213", pays: "Algerie" },
  { code: "+1", pays: "Etats-Unis" },
  { code: "+376", pays: "Andorre" },
  { code: "+244", pays: "Angola" },
  { code: "+1", pays: "Antigua-et-Barbuda" },
  { code: "+966", pays: "Arabie Saoudite" },
  { code: "+32", pays: "Belgique" },
  { code: "+229", pays: "Benin" },
  { code: "+1", pays: "Canada" },
  { code: "+236", pays: "Centrafrique" },
  { code: "+56", pays: "Chili" },
  { code: "+86", pays: "Chine" },
  { code: "+357", pays: "Chypre" },
  { code: "+225", pays: "Cote d'Ivoire" },
  { code: "+385", pays: "Croatie" },
  { code: "+45", pays: "Danemark" },
  { code: "+20", pays: "Egypte" },
  { code: "+971", pays: "Emirats Arabes Unis" },
  { code: "+34", pays: "Espagne" },
  { code: "+372", pays: "Estonie" },
  { code: "+251", pays: "Ethiopie" },
  { code: "+358", pays: "Finlande" },
  { code: "+33", pays: "France" },
  { code: "+995", pays: "Georgie" },
  { code: "+233", pays: "Ghana" },
  { code: "+350", pays: "Gibraltar" },
  { code: "+30", pays: "Grece" },
  { code: "+240", pays: "Guinee equatoriale" },
  { code: "+592", pays: "Guyana" },
  { code: "+509", pays: "Haiti" },
  { code: "+36", pays: "Hongrie" },
  { code: "+91", pays: "Inde" },
  { code: "+62", pays: "Indonesie" },
  { code: "+964", pays: "Irak" },
  { code: "+98", pays: "Iran" },
  { code: "+353", pays: "Irlande" },
  { code: "+972", pays: "Israel" },
  { code: "+39", pays: "Italie" },
  { code: "+81", pays: "Japon" },
  { code: "+254", pays: "Kenya" },
  { code: "+996", pays: "Kirghizistan" },
  { code: "+856", pays: "Laos" },
  { code: "+266", pays: "Lesotho" },
  { code: "+371", pays: "Lettonie" },
  { code: "+218", pays: "Libye" },
  { code: "+423", pays: "Liechtenstein" },
  { code: "+370", pays: "Lituanie" },
  { code: "+352", pays: "Luxembourg" },
  { code: "+853", pays: "Macao" },
  { code: "+389", pays: "Macedoine" },
  { code: "+261", pays: "Madagascar" },
  { code: "+60", pays: "Malaisie" },
  { code: "+223", pays: "Mali" },
  { code: "+356", pays: "Malte" },
  { code: "+212", pays: "Maroc" },
  { code: "+377", pays: "Monaco" },
  { code: "+976", pays: "Mongolie" },
  { code: "+382", pays: "Montenegro" },
  { code: "+95", pays: "Myanmar" },
  { code: "+264", pays: "Namibie" },
  { code: "+977", pays: "Nepal" },
  { code: "+31", pays: "Pays-Bas" },
  { code: "+234", pays: "Nigeria" },
  { code: "+47", pays: "Norvege" },
  { code: "+968", pays: "Oman" },
  { code: "+92", pays: "Pakistan" },
  { code: "+507", pays: "Panama" },
  { code: "+51", pays: "Perou" },
  { code: "+63", pays: "Philippines" },
  { code: "+48", pays: "Pologne" },
  { code: "+351", pays: "Portugal" },
  { code: "+1", pays: "Puerto Rico" },
  { code: "+974", pays: "Qatar" },
  { code: "+262", pays: "Reunion" },
  { code: "+40", pays: "Roumanie" },
  { code: "+7", pays: "Russie" },
  { code: "+250", pays: "Rwanda" },
  { code: "+1", pays: "Saint-Christophe-et-Nieves" },
  { code: "+1", pays: "Sainte-Lucie" },
  { code: "+1", pays: "Saint-Vincent-et-les-Grenadines" },
  { code: "+378", pays: "Saint-Marin" },
  { code: "+221", pays: "Senegal" },
  { code: "+248", pays: "Seychelles" },
  { code: "+232", pays: "Sierra Leone" },
  { code: "+65", pays: "Singapour" },
  { code: "+421", pays: "Slovaquie" },
  { code: "+386", pays: "Slovenie" },
  { code: "+252", pays: "Somalie" },
  { code: "+27", pays: "Afrique du Sud" },
  { code: "+82", pays: "Coree du Sud" },
  { code: "+94", pays: "Sri Lanka" },
  { code: "+249", pays: "Soudan" },
  { code: "+46", pays: "Suede" },
  { code: "+41", pays: "Suisse" },
  { code: "+963", pays: "Syrie" },
  { code: "+992", pays: "Tadjikistan" },
  { code: "+66", pays: "Thailande" },
  { code: "+228", pays: "Togo" },
  { code: "+216", pays: "Tunisie" },
  { code: "+993", pays: "Turkmenistan" },
  { code: "+90", pays: "Turquie" },
  { code: "+1", pays: "Iles Vierges americaines" },
  { code: "+380", pays: "Ukraine" },
  { code: "+44", pays: "Royaume-Uni" },
  { code: "+58", pays: "Venezuela" },
  { code: "+84", pays: "Vietnam" },
  { code: "+260", pays: "Zambie" },
  { code: "+263", pays: "Zimbabwe" },
];

export default function Student() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    dateNaiss: "",
    lieuNaiss: "",
    sexe: "",
    nationalite: "",
    telephone: "",
    email: "",
    typeBac: "",
    anneeBac: "",
    moyenneBac: "",
    mention: "",
    specialite: "",
    universite: "",
    copieBac: null,
    releveNotes: null,
    carteIdentite: null,
    photo: null,
    residence: null,
    cv: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+33");
  const [showRecapitulatif, setShowRecapitulatif] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleCountryCodeChange = (e) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const currentNumber = formData.telephone.replace(/^\+\d+\s*/, '');
    setFormData({
      ...formData,
      telephone: code + currentNumber,
    });
  };

  const handleTelephoneChange = (e) => {
    const value = e.target.value;
    const cleanNumber = value.replace(/^\+\d+\s*/, '');
    setFormData({
      ...formData,
      telephone: selectedCountryCode + cleanNumber,
    });
    if (errors.telephone) {
      setErrors({ ...errors, telephone: '' });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({
      ...formData,
      [name]: files[0] || null,
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis.';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis.';
    if (!formData.dateNaiss) newErrors.dateNaiss = 'La date de naissance est requise.';
    if (!formData.lieuNaiss.trim()) newErrors.lieuNaiss = 'Le lieu de naissance est requis.';
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis.';
    if (!formData.nationalite.trim()) newErrors.nationalite = 'La nationalite est requise.';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le numero de telephone est requis.';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide.';
    if (!formData.typeBac) newErrors.typeBac = 'Le type du bac est requis.';
    if (!formData.anneeBac) newErrors.anneeBac = 'L\'annee du bac est requise.';
    if (!formData.moyenneBac) newErrors.moyenneBac = 'La moyenne generale est requise.';
    if (!formData.specialite.trim()) newErrors.specialite = 'La specialite souhaitee est requise.';
    if (!formData.universite.trim()) newErrors.universite = 'L\'universite demandee est requise.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      alert("Candidature envoyée !");
      setIsSubmitted(true);
      setErrors({});
    }
  };

  return (
    <div className="page">
      <h1>Espace Étudiant</h1>
      <p>Déposer une candidature</p>
      <form onSubmit={handleSubmit} className="form">

        <h3>1. Informations Personnelles</h3>
        <div className="formRow">
          <div className="form-group">
            <input
              type="text"
              name="nom"
              placeholder="Nom"
              value={formData.nom}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.nom && <span className="error-message">{errors.nom}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="prenom"
              placeholder="Prénom"
              value={formData.prenom}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.prenom && <span className="error-message">{errors.prenom}</span>}
          </div>

        <div className="formRow">
          <div className="form-group">
            <input
              type="date"
              name="dateNaiss"
              placeholder="Date de naissance"
              value={formData.dateNaiss}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.dateNaiss && <span className="error-message">{errors.dateNaiss}</span>}
          </div>

          <div className="form-group">
            <select
              name="sexe"
              value={formData.sexe}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Sexe</option>
              <option value="Masculin">Masculin</option>
              <option value="Feminin">Feminin</option>
            </select>
            {errors.sexe && <span className="error-message">{errors.sexe}</span>}
          </div>

        <div className="formRow">
          <div className="form-group">
            <select
              name="nationalite"
              value={formData.nationalite}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Selectionnez un pays</option>
              <option value="Afghanistan">Afghanistan</option>
              <option value="Afrique du Sud">Afrique du Sud</option>
              <option value="Albanie">Albanie</option>
              <option value="Allemagne">Allemagne</option>
              <option value="Algerie">Algerie</option>
              <option value="Argentine">Argentine</option>
              <option value="Australie">Australie</option>
              <option value="Autriche">Autriche</option>
              <option value="Belgique">Belgique</option>
              <option value="Bresil">Bresil</option>
              <option value="Bulgarie">Bulgarie</option>
              <option value="Canada">Canada</option>
              <option value="Chili">Chili</option>
              <option value="Chine">Chine</option>
              <option value="Colombie">Colombie</option>
              <option value="Coree du Sud">Coree du Sud</option>
              <option value="Cote d'Ivoire">Cote d'Ivoire</option>
              <option value="Croatie">Croatie</option>
              <option value="Danemark">Danemark</option>
              <option value="Egypte">Egypte</option>
              <option value="Emirats Arabes Unis">Emirats Arabes Unis</option>
              <option value="Espagne">Espagne</option>
              <option value="Estonie">Estonie</option>
              <option value="Etats-Unis">Etats-Unis</option>
              <option value="Ethiopie">Ethiopie</option>
              <option value="Finlande">Finlande</option>
              <option value="France">France</option>
              <option value="Gabon">Gabon</option>
              <option value="Grece">Grece</option>
              <option value="Hongrie">Hongrie</option>
              <option value="Inde">Inde</option>
              <option value="Indonesie">Indonesie</option>
              <option value="Irak">Irak</option>
              <option value="Iran">Iran</option>
              <option value="Irlande">Irlande</option>
              <option value="Israel">Israel</option>
              <option value="Italie">Italie</option>
              <option value="Japon">Japon</option>
              <option value="Jordanie">Jordanie</option>
              <option value="Kenya">Kenya</option>
              <option value="Liban">Liban</option>
              <option value="Libye">Libye</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Malaisie">Malaisie</option>
              <option value="Mali">Mali</option>
              <option value="Maroc">Maroc</option>
              <option value="Mexique">Mexique</option>
              <option value="Monaco">Monaco</option>
              <option value="Norvege">Norvege</option>
              <option value="Nouvelle-Zelande">Nouvelle-Zelande</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Pays-Bas">Pays-Bas</option>
              <option value="Perou">Perou</option>
              <option value="Pologne">Pologne</option>
              <option value="Portugal">Portugal</option>
              <option value="Qatar">Qatar</option>
              <option value="Roumanie">Roumanie</option>
              <option value="Royaume-Uni">Royaume-Uni</option>
              <option value="Russie">Russie</option>
              <option value="Senegal">Senegal</option>
              <option value="Serbie">Serbie</option>
              <option value="Singapour">Singapour</option>
              <option value="Slovaquie">Slovaquie</option>
              <option value="Slovenie">Slovenie</option>
              <option value="Suede">Suede</option>
              <option value="Suisse">Suisse</option>
              <option value="Syrie">Syrie</option>
              <option value="Tunisie">Tunisie</option>
              <option value="Turquie">Turquie</option>
              <option value="Ukraine">Ukraine</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Vietnam">Vietnam</option>
            </select>
            {errors.nationalite && <span className="error-message">{errors.nationalite}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="lieuNaiss"
              placeholder="Lieu de naissance"
              value={formData.lieuNaiss}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.lieuNaiss && <span className="error-message">{errors.lieuNaiss}</span>}
          </div>

        <div className="formRow">
          <div className="form-group">
            <div className="phone-input-container">
              <select
                name="paysCode"
                value={selectedCountryCode}
                onChange={handleCountryCodeChange}
                className="form-input country-code-select"
                required
              >
                {countryCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} - {item.pays}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="telephone"
                placeholder="Numéro de téléphone"
                value={formData.telephone.replace(/^\+\d+\s*/, '')}
                onChange={handleTelephoneChange}
                className="form-input phone-number-input"
                required
              />
            </div>
            {errors.telephone && <span className="error-message">{errors.telephone}</span>}
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

        <h3>2. Informations Academiques</h3>
        <div className="formRow">
          <div className="form-group">
            <select
              name="typeBac"
              value={formData.typeBac}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Type du bac</option>
              <option value="Sciences">Sciences Expérimentales</option>
              <option value="Mathématiques">Mathématiques</option>
              <option value="Techniques Math">Sciences Techniques</option>
              <option value="Économie et Gestion">Économie et Gestion</option>
              <option value="Lettres et Philosophie">Lettres et Philosophie</option>
              <option value="Langues Étrangères">Langues Étrangères</option>
            </select>
            {errors.typeBac && <span className="error-message">{errors.typeBac}</span>}
          </div>

          <div className="form-group">
            <input
              type="number"
              name="anneeBac"
              placeholder="Annee du bac"
              value={formData.anneeBac}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.anneeBac && <span className="error-message">{errors.anneeBac}</span>}
          </div>

        <div className="formRow">
          <div className="form-group">
            <input
              type="number"
              step="0.01"
              name="moyenneBac"
              placeholder="Moyenne generale du bac"
              value={formData.moyenneBac}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.moyenneBac && <span className="error-message">{errors.moyenneBac}</span>}
          </div>

          <div className="form-group">
            <select
              name="mention"
              value={formData.mention}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Mention</option>
              <option value="Tres Bien">Tres Bien</option>
              <option value="Bien">Bien</option>
              <option value="Assez Bien">Assez Bien</option>
              <option value="Passable">Passable</option>
            </select>
          </div>

        <div className="formRow">
          <div className="form-group">
            <select
              name="specialite"
              value={formData.specialite}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Specialite souhaitee</option>
              <optgroup label="Sciences et Technologies">
                <option value="Informatique">Informatique</option>
                <option value="Mathematiques">Mathematiques</option>
                <option value="Physique">Physique</option>
                <option value="Chimie">Chimie</option>
                <option value="Biologie">Biologie</option>
              </optgroup>
            </select>
            {errors.specialite && <span className="error-message">{errors.specialite}</span>}
          </div>

          <div className="form-group">
            <select
              name="universite"
              value={formData.universite}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Université demandée</option>
              <optgroup label="Universités Publiques">
                <option value="Université d'Alger 1">Université d'Alger 1</option>
                <option value="Université d'Alger 2">Université d'Alger 2</option>
                <option value="Université d'Alger 3">Université d'Alger 3</option>
                <option value="Université de Constantine 1">Université de Constantine 1</option>
                <option value="Université de Constantine 2">Université de Constantine 2</option>
                <option value="Université de Constantine 3">Université de Constantine 3</option>
                <option value="Université d'Oran 1">Université d'Oran 1</option>
                <option value="Université d'Oran 2">Université d'Oran 2</option>
                <option value="Université de Annaba">Université de Annaba</option>
                <option value="Université de Tizi Ouzou">Université de Tizi Ouzou</option>
                <option value="Université de Béjaia">Université de Béjaia</option>
                <option value="Université de Blida 1">Université de Blida 1</option>
                <option value="Université de Blida 2">Université de Blida 2</option>
                <option value="Université de Mostaganem">Université de Mostaganem</option>
                <option value="Université de Mascara">Université de Mascara</option>
                <option value="Université de Sidi Bel Abbès">Université de Sidi Bel Abbès</option>
                <option value="Université de Tlemcen">Université de Tlemcen</option>
                <option value="Université de Biskra">Université de Biskra</option>
                <option value="Université de Ouargla">Université de Ouargla</option>
                <option value="Université de Ghardaia">Université de Ghardaia</option>
                <option value="Université de Batna 1">Université de Batna 1</option>
                <option value="Université de Batna 2">Université de Batna 2</option>
                <option value="Université de Sétif 1">Université de Sétif 1</option>
                <option value="Université de Sétif 2">Université de Sétif 2</option>
                <option value="Université de Jijel">Université de Jijel</option>
                <option value="Université de Skikda">Université de Skikda</option>
                <option value="Université de Constantine 4">Université de Constantine 4</option>
                <option value="Université de Médéa">Université de Médéa</option>
                <option value="Université de Ain Defla">Université de Ain Defla</option>
                <option value="Université de Tiaret">Université de Tiaret</option>
                <option value="Université de Bechar">Université de Bechar</option>
                <option value="Université de Djelfa">Université de Djelfa</option>
                <option value="Université de Laghouat">Université de Laghouat</option>
                <option value="Université de M'Sila">Université de M'Sila</option>
                <option value="Université de Bouira">Université de Bouira</option>
                <option value="Université de Tébessa">Université de Tébessa</option>
                <option value="Université de El Oued">Université de El Oued</option>
                <option value="Université de Khenchela">Université de Khenchela</option>
                <option value="Université de BBA">Université de BBA</option>
                <option value="Université de Guelma">Université de Guelma</option>
                <option value="Université de Souk Ahras">Université de Souk Ahras</option>
                <option value="Université de Tipaza">Université de Tipaza</option>
                <option value="Université de Chlef">Université de Chlef</option>
                <option value="Université de Naama">Université de Naama</option>
                <option value="Université de Illizi">Université de Illizi</option>
                <option value="Université de Tamanrasset">Université de Tamanrasset</option>
                <option value="Université de Adrar">Université de Adrar</option>
              </optgroup>
              <optgroup label="Écoles Supérieures">
                <option value="École Nationale Polytechnique">École Nationale Polytechnique</option>
                <option value="École Nationale Supérieure d'Informatique">École Nationale Supérieure d'Informatique</option>
                <option value="École Nationale Polytechnique de Constantine">École Nationale Polytechnique de Constantine</option>
                <option value="École Nationale Supérieure de Statistique et d'Économie Appliquée">École Nationale Supérieure de Statistique et d'Économie Appliquée</option>
                <option value="École Supérieure de Commerce">École Supérieure de Commerce</option>
                <option value="École Nationale des Travaux Publics">École Nationale des Travaux Publics</option>
                <option value="École Nationale Supérieure des Mines">École Nationale Supérieure des Mines</option>
                <option value="École Nationale Supérieure de Météorologie">École Nationale Supérieure de Météorologie</option>
                <option value="École Nationale Supérieure des Sciences de la Mer">École Nationale Supérieure des Sciences de la Mer</option>
              </optgroup>
            </select>
            {errors.universite && <span className="error-message">{errors.universite}</span>}
          </div>

        <h3>3. Documents a Fournir</h3>
        <div className="formRow">
          <div className="form-group">
            <label className="file-label">Copie du bac</label>
            <input
              type="file"
              name="copieBac"
              onChange={handleFileChange}
              className="form-input file-input"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {formData.copieBac && <span className="file-name">{formData.copieBac.name}</span>}
          </div>

          <div className="form-group">
            <label className="file-label">Releve de notes</label>
            <input
              type="file"
              name="releveNotes"
              onChange={handleFileChange}
              className="form-input file-input"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {formData.releveNotes && <span className="file-name">{formData.releveNotes.name}</span>}
          </div>

        <div className="formRow">
          <div className="form-group">
            <label className="file-label">Carte d'identite</label>
            <input
              type="file"
              name="carteIdentite"
              onChange={handleFileChange}
              className="form-input file-input"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {formData.carteIdentite && <span className="file-name">{formData.carteIdentite.name}</span>}
          </div>

          <div className="form-group">
            <label className="file-label">Photo</label>
            <input
              type="file"
              name="photo"
              onChange={handleFileChange}
              className="form-input file-input"
              accept=".jpg,.jpeg,.png"
            />
            {formData.photo && <span className="file-name">{formData.photo.name}</span>}
          </div>

        <div className="formRow">
          <div className="form-group">
            <label className="file-label">Residence</label>
            <input
              type="file"
              name="residence"
              onChange={handleFileChange}
              className="form-input file-input"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {formData.residence && <span className="file-name">{formData.residence.name}</span>}
          </div>

          <div className="form-group">
            <label className="file-label">CV</label>
            <input
              type="file"
              name="cv"
              onChange={handleFileChange}
              className="form-input file-input"
              accept=".pdf,.doc,.docx"
            />
            {formData.cv && <span className="file-name">{formData.cv.name}</span>}
          </div>

        <div className="actions">
          <Link to="/">
            <button type="button" className="retour-btn">Retour</button>
          </Link>
          <button type="button" className="recapitulatif-btn" onClick={() => setShowRecapitulatif(!showRecapitulatif)}>
            {showRecapitulatif ? "Masquer" : "Récapitulatif"}
          </button>
        </div>
      </form>

      {showRecapitulatif && (
        <div className="recapitulatif-section">
          <h3>Récapitulatif de votre candidature</h3>
          
          <div className="recap-part">
            <h4>1. Informations Personnelles</h4>
            <p><strong>Nom:</strong> {formData.nom}</p>
            <p><strong>Prénom:</strong> {formData.prenom}</p>
            <p><strong>Date de naissance:</strong> {formData.dateNaiss}</p>
            <p><strong>Lieu de naissance:</strong> {formData.lieuNaiss}</p>
            <p><strong>Sexe:</strong> {formData.sexe}</p>
            <p><strong>Nationalité:</strong> {formData.nationalite}</p>
            <p><strong>Téléphone:</strong> {formData.telephone}</p>
            <p><strong>Email:</strong> {formData.email}</p>
          </div>

          <div className="recap-part">
            <h4>2. Informations Académiques</h4>
            <p><strong>Type du bac:</strong> {formData.typeBac}</p>
            <p><strong>Année du bac:</strong> {formData.anneeBac}</p>
            <p><strong>Moyenne générale:</strong> {formData.moyenneBac}</p>
            <p><strong>Mention:</strong> {formData.mention || "Non spécifiée"}</p>
            <p><strong>Spécialité:</strong> {formData.specialite}</p>
            <p><strong>Université:</strong> {formData.universite}</p>
          </div>

          <div className="recap-part">
            <h4>3. Documents</h4>
            <p><strong>Copie du bac:</strong> {formData.copieBac ? formData.copieBac.name : "Non téléchargé"}</p>
            <p><strong>Relevé de notes:</strong> {formData.releveNotes ? formData.releveNotes.name : "Non téléchargé"}</p>
            <p><strong>Carte d'identité:</strong> {formData.carteIdentite ? formData.carteIdentite.name : "Non téléchargé"}</p>
            <p><strong>Photo:</strong> {formData.photo ? formData.photo.name : "Non téléchargé"}</p>
            <p><strong>Résidence:</strong> {formData.residence ? formData.residence.name : "Non téléchargé"}</p>
            <p><strong>CV:</strong> {formData.cv ? formData.cv.name : "Non téléchargé"}</p>
          </div>

          <div className="recap-actions">
            <button type="submit" className="valider-btn">Valider la candidature</button>
          </div>
      )}
    </div>
  );
