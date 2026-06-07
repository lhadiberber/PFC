# Checklist production PFC

## Avant livraison

- Verifier que `npm run lint` passe sans erreur.
- Verifier que `npm run build` passe sans erreur bloquante.
- Lancer le backend avec `npm run dev` et confirmer que `/api/health` repond.
- Tester un parcours etudiant complet : inscription, connexion, profil, depot de candidature, depot des documents, recapitulatif.
- Tester un parcours admin complet : dashboard, liste des candidatures, ouverture d'un dossier, validation/refus, documents, fiche etudiant.
- Tester un parcours super admin complet : dashboard, gestion des administrateurs, gestion des utilisateurs.

## Backend et donnees

- Configurer `backend/.env` avec `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CLIENT_URL`.
- Redemarrer le backend une fois en local pour laisser les tables ajouter les colonnes manquantes automatiquement.
- Verifier que le dossier `backend/uploads` existe et reste accessible en lecture par le backend.
- Verifier que les documents uploades s'ouvrent bien depuis `/uploads/...`.
- Remplacer les comptes de test par des comptes reels ou supprimer les donnees de demonstration.

## Securite

- Utiliser un `JWT_SECRET` fort et different de l'exemple.
- Restreindre `CLIENT_URL` au vrai domaine de production.
- Verifier que les fichiers acceptes restent limites aux formats prevus.
- Verifier les droits : etudiant, admin, super admin.
- Ne jamais exposer les mots de passe, hashes ou variables `.env`.

## UX finale

- Relire les textes visibles importants sur les pages etudiant, admin et super admin.
- Tester les erreurs API avec backend coupe : les pages doivent afficher un message propre et un bouton `Reessayer`.
- Tester mobile et desktop pour le depot de documents, les tableaux admin, et les pages detail.
- Verifier que les notifications flottantes ne reapparaissent pas.

## Points a optimiser ensuite

- Decouper le bundle avec `dynamic import()` si l'avertissement Vite sur les chunks devient important.
- Ajouter des tests automatises sur les services API et les parcours critiques.
- Prevoir une vraie adresse institutionnelle pour le contact etudiant.
