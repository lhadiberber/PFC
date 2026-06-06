# PFC Admissions

Plateforme universitaire d'admission avec un espace etudiant, un espace administrateur et un espace super administrateur.

## Stack

- Frontend : React, Vite, JavaScript
- Backend : Node.js, Express.js
- Base de donnees : MySQL
- Authentification : JWT et bcrypt
- Upload documents : multer

## Lancer le projet

Commande recommandee depuis la racine du projet :

```bash
npm install
npm run dev
```

Cette commande demarre automatiquement :

- le backend Express sur `http://127.0.0.1:5000`
- le frontend Vite sur `http://localhost:5178`

Health checks utiles :

```bash
curl http://127.0.0.1:5000/api/health
curl http://localhost:5178/api/health
```

Si vous lancez les serveurs separement :

```bash
cd backend
npm start
```

```bash
npm run dev:frontend
```

## Roles disponibles

- `student` : complete son profil, depose une candidature, ajoute des documents et suit son dossier.
- `admin` : consulte les candidatures, traite les dossiers, consulte les etudiants et verifie les documents.
- `super_admin` : gere les comptes administrateurs et conserve l'acces a l'espace admin.

## Super administrateur

Le super administrateur est le compte qui gere les administrateurs de la plateforme.

Il peut :

- creer un compte admin ;
- activer ou desactiver un admin ;
- acceder a l'espace admin classique ;
- ouvrir la page de gestion des administrateurs.

Un admin classique ne peut pas acceder a l'espace super administrateur.

## Creer le premier super administrateur

Dans `backend/.env`, ajouter des valeurs d'exemple adaptees a votre machine :

```env
SUPER_ADMIN_NOM=Super
SUPER_ADMIN_PRENOM=Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=change_this_password
```

Puis lancer :

```bash
cd backend
npm run create-super-admin
```

Ensuite, se connecter depuis l'interface avec ce compte.

Ne mettez jamais de vrais identifiants sensibles dans le README.

## Test rapide Super Admin

1. Creer le super administrateur avec le script.
2. Se connecter avec ce compte.
3. Ouvrir `/super-admin`.
4. Ouvrir `Gestion des administrateurs`.
5. Creer un admin.
6. Desactiver puis reactiver un admin.
7. Verifier qu'un admin desactive ne peut plus se connecter.
8. Verifier qu'un admin normal ne peut pas ouvrir `/super-admin`.

## Structure utile

- `src/App.jsx` : routes et protection frontend par role.
- `src/pages/Auth/` : connexion, inscription et confirmation.
- `src/pages/Student/` : parcours etudiant.
- `src/pages/Admin/` : espace administrateur.
- `src/pages/SuperAdmin/` : espace super administrateur.
- `src/services/` : appels API frontend.
- `backend/routes/` : routes Express.
- `backend/controllers/` : logique des routes.
- `backend/models/` : acces MySQL.
