# PFC Admissions Backend

Backend Node.js/Express pour l'API PFC Admissions.

## Stack

- Node.js
- Express.js
- MySQL via `mysql2`
- Auth avec JWT + bcrypt
- Uploads avec multer

## Installation

```bash
npm install
```

Copier `.env.example` vers `.env`, puis adapter les variables MySQL/JWT.

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
- `POST /api/auth/register` : creation de compte
- `POST /api/auth/login` : connexion JWT
- `GET /api/auth/me` : utilisateur connecte
