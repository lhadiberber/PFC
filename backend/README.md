# PFC Admissions Backend

Backend Node.js/Express pour l'API PFC Admissions.

## Stack

- Node.js
- Express.js
- MySQL via `mysql2`
- Connexion MySQL via `mysql2`

## Installation

```bash
npm install
```

Copier `.env.example` vers `.env`, puis adapter les variables MySQL/JWT.

Variables minimales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=pfc_user
DB_PASSWORD=
DB_NAME=pfc_admissions
JWT_SECRET=change_this_secret_before_production
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
PORT=5000
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
  controllers/
    auth.controller.js
    profile.controller.js
    application.controller.js
    document.controller.js
    admin.controller.js
  middlewares/
    auth.middleware.js
    role.middleware.js
    error.middleware.js
  models/
    user.model.js
    profile.model.js
    application.model.js
    document.model.js
  uploads/
```

## Endpoints de base

- `GET /` : message API
- `GET /api/health` : statut API
- `GET /api/health/db` : test explicite de connexion MySQL

## Authentification

Table MySQL creee au demarrage:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
);
```

Routes disponibles:

- `POST /api/auth/register` : inscription etudiant
- `POST /api/auth/login` : connexion utilisateur
- `GET /api/auth/me` : utilisateur connecte via `Authorization: Bearer <token>`
