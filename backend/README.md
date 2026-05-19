# PFC Admissions Backend

Backend Node.js/Express pour l'API PFC Admissions.

## Stack

- Node.js
- Express.js
- MySQL via `mysql2`
- JWT et bcrypt pour l'authentification

## Installation

```bash
npm install
```

Copier `.env.example` vers `.env`, puis adapter les variables MySQL/JWT.

Variables minimales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pfc_admissions
JWT_SECRET=change_this_secret_before_production
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
PORT=5000

SUPER_ADMIN_NOM=Super
SUPER_ADMIN_PRENOM=Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=change_this_password
```

Au demarrage, le backend tente de creer automatiquement la base
`pfc_admissions` et la table `users` si l'utilisateur MySQL configure en a le droit.

Si la creation automatique echoue, creez la base manuellement dans MySQL:

```sql
CREATE DATABASE IF NOT EXISTS pfc_admissions
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

## Scripts

- `npm run dev` : serveur de developpement avec watch
- `npm start` : serveur Node
- `npm run check` : verification syntaxique du point d'entree

## Structure

```txt
backend/
  server.js
  app.js
  .env
  package.json
  config/
    db.js
  routes/
    auth.routes.js
    profile.routes.js
    application.routes.js
    document.routes.js
    admin.routes.js
    superAdmin.routes.js
  controllers/
    auth.controller.js
    profile.controller.js
    application.controller.js
    document.controller.js
    admin.controller.js
    superAdmin.controller.js
  middlewares/
    auth.middleware.js
    role.middleware.js
    error.middleware.js
  models/
    user.model.js
    profile.model.js
    application.model.js
    document.model.js
    superAdmin.model.js
  scripts/
    createSuperAdmin.js
  uploads/
```

## Endpoints de base

- `GET /` : message API
- `GET /api/health` : statut API
- `GET /api/health/db` : test explicite de connexion MySQL

## Roles

- `student` : depose une candidature, complete son profil et suit son dossier.
- `admin` : traite les candidatures, consulte les etudiants et verifie les documents.
- `super_admin` : gere les administrateurs et garde l'acces a l'espace admin.

## Authentification

Table MySQL creee au demarrage:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin', 'super_admin') NOT NULL DEFAULT 'student',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
);
```

Routes disponibles:

- `POST /api/auth/register` : inscription etudiant
- `POST /api/auth/login` : connexion utilisateur
- `GET /api/auth/me` : utilisateur connecte via `Authorization: Bearer <token>`

## Profil etudiant

Table MySQL creee au demarrage:

```sql
CREATE TABLE IF NOT EXISTS student_profiles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  telephone VARCHAR(30) NULL,
  date_naissance DATE NULL,
  nationalite VARCHAR(100) NULL,
  adresse VARCHAR(255) NULL,
  diplome_actuel VARCHAR(120) NULL,
  etablissement VARCHAR(160) NULL,
  specialite_actuelle VARCHAR(160) NULL,
  annee_obtention SMALLINT UNSIGNED NULL,
  moyenne DECIMAL(5,2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY student_profiles_user_id_unique (user_id),
  CONSTRAINT student_profiles_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

Routes protegees par JWT:

- `GET /api/profile/me` : lire le profil de l'etudiant connecte
- `PUT /api/profile/me` : mettre a jour le profil de l'etudiant connecte

## Candidatures etudiant

Table MySQL creee au demarrage:

```sql
CREATE TABLE IF NOT EXISTS applications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  universite VARCHAR(160) NOT NULL,
  formation VARCHAR(160) NOT NULL,
  niveau VARCHAR(80) NOT NULL,
  motivation TEXT NOT NULL,
  statut ENUM('En attente', 'Acceptée', 'Refusée') NOT NULL DEFAULT 'En attente',
  date_depot TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  commentaire_admin TEXT NULL,
  PRIMARY KEY (id),
  INDEX applications_student_id_index (student_id),
  CONSTRAINT applications_student_id_fk
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

Routes protegees par JWT:

- `POST /api/applications` : deposer une candidature
- `GET /api/applications/my` : lister les candidatures de l'etudiant connecte
- `GET /api/applications/:id` : consulter une candidature de l'etudiant connecte

## Documents etudiant

Table MySQL creee au demarrage:

```sql
CREATE TABLE IF NOT EXISTS documents (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  application_id INT UNSIGNED NULL,
  type_document VARCHAR(80) NOT NULL,
  nom_fichier VARCHAR(255) NOT NULL,
  chemin_fichier VARCHAR(255) NOT NULL,
  statut ENUM('En attente', 'Validé', 'Refusé') NOT NULL DEFAULT 'En attente',
  date_upload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX documents_student_id_index (student_id),
  INDEX documents_application_id_index (application_id),
  CONSTRAINT documents_student_id_fk
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT documents_application_id_fk
    FOREIGN KEY (application_id) REFERENCES applications(id)
    ON DELETE SET NULL
);
```

Routes protegees par JWT:

- `POST /api/documents` : deposer un document etudiant en `multipart/form-data`
- `GET /api/documents/my` : lister les documents de l'etudiant connecte
- `GET /api/documents/:id` : consulter un document de l'etudiant connecte
- `DELETE /api/documents/:id` : supprimer un document de l'etudiant connecte

Upload attendu pour `POST /api/documents`:

- champ fichier: `document`
- champ texte obligatoire: `type_document`
- champ texte optionnel: `application_id`
- formats acceptes: PDF, JPG, JPEG, PNG
- taille maximale: 5 Mo
- stockage local: `backend/uploads`

## Dashboard etudiant

Route protegee par JWT:

- `GET /api/student/dashboard` : resume profil, candidatures, documents, statut global et activite recente de l'etudiant connecte

## Dashboard admin

Routes protegees par JWT avec role `admin` ou `super_admin`:

- `GET /api/admin/dashboard` : statistiques globales, candidatures recentes, repartition des statuts, documents a verifier et activite recente
- `GET /api/admin/applications` : liste des candidatures
- `GET /api/admin/students` : liste des etudiants
- `GET /api/admin/documents` : liste des documents

## Super administrateur

Routes reservees au role `super_admin`:

- `GET /api/super-admin/admins` : lister les administrateurs classiques
- `POST /api/super-admin/admins` : creer un compte admin
- `PATCH /api/super-admin/admins/:id` : modifier nom, prenom et email d'un admin
- `PATCH /api/super-admin/admins/:id/status` : activer ou desactiver un admin

Le backend force toujours le role `admin` lors de la creation d'un administrateur.
Le frontend ne choisit jamais le role du compte cree.
Le champ `password_hash` n'est jamais renvoye dans les reponses publiques.

## Creer le premier super administrateur

Ajouter dans `backend/.env`:

```env
SUPER_ADMIN_NOM=Super
SUPER_ADMIN_PRENOM=Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=change_this_password
```

Puis lancer:

```bash
cd backend
npm run create-super-admin
```

Utilisez uniquement des valeurs d'exemple dans la documentation.
Les vrais identifiants restent dans le fichier `.env`, qui ne doit pas etre commit.

## Test rapide Super Admin

1. Creer le super administrateur avec le script.
2. Se connecter avec ce compte depuis le frontend.
3. Ouvrir `/super-admin`.
4. Ouvrir la gestion des administrateurs.
5. Creer un admin.
6. Desactiver puis reactiver cet admin.
7. Verifier qu'un admin desactive ne peut plus se connecter.
8. Verifier qu'un admin normal recoit un refus sur `/api/super-admin/admins`.
