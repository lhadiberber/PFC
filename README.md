# PFC Admissions

Frontend React/Vite pour une plateforme de candidature universitaire.

## Stack

- React 19
- Vite 7
- React Router 7
- CSS custom

## Lancer le projet

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` : serveur de developpement
- `npm run build` : build de production
- `npm run preview` : preview du build
- `npm run lint` : lint du projet

## Fonctionnalites frontend actuelles

- page d'accueil publique
- inscription et connexion
- espace etudiant
- formulaire de candidature en plusieurs etapes
- dashboard etudiant
- dashboard administrateur

## Stockage actuel

Le projet est encore en phase frontend.

- l'authentification est simulee
- une partie des donnees est stockee dans `localStorage`
- plusieurs vues utilisent encore des donnees mockees

## Compte admin de demonstration

- email : `lhadiberber@gmail.com`
- mot de passe : `123`

## Structure utile

- `src/App.jsx` : routes et etat global
- `src/pages/Student/` : parcours etudiant
- `src/pages/Admin/` : espace admin
- `src/components/` : composants partages
- `src/utils/` : helpers frontend
