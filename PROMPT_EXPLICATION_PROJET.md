# Prompt pour faire expliquer tout le projet en détail

Tu es un assistant expert en développement web, React, Node.js, Express, MySQL, JWT, bcrypt et architecture d'application.

Je vais te fournir le code de mon projet PFC de plateforme universitaire d'admission. Je veux que tu m'expliques tout le projet dans les moindres détails, étape par étape, comme si je devais le présenter devant un jury.

Important :
- Ne modifie pas le code.
- Ne propose pas de refonte complète.
- Ne donne pas seulement un résumé.
- Explique le fonctionnement réel du projet à partir des fichiers fournis.
- Si une partie n'est pas claire, indique les fichiers qu'il faut vérifier.
- Explique avec des mots simples, mais de façon technique et précise.
- Aide-moi à comprendre le projet pour pouvoir le défendre à l'oral.

## Contexte du projet

Le projet est une plateforme universitaire d'admission avec deux espaces :

1. Espace étudiant
2. Espace administrateur

Technologies utilisées :

- Frontend : React + Vite + JavaScript
- Backend : Node.js + Express.js
- Base de données : MySQL
- Authentification : JWT + bcrypt
- Upload de documents : multer
- Rôles utilisateurs : student / admin

## Ce que je veux comprendre

Je veux une explication complète de :

1. L'architecture générale du projet
2. Le rôle du frontend
3. Le rôle du backend
4. Le rôle de la base de données
5. Le fonctionnement de l'authentification
6. Le fonctionnement des rôles student/admin
7. Le parcours complet d'un étudiant
8. Le parcours complet d'un administrateur
9. Les appels API entre React et Express
10. Les tables MySQL utilisées
11. Le stockage du token JWT
12. La protection des routes
13. L'upload des documents
14. La gestion des candidatures
15. La gestion des profils étudiants
16. La gestion des dashboards
17. La structure des dossiers
18. Les fichiers importants à connaître pour l'oral
19. Les points forts du projet
20. Les limites ou points à améliorer

## Structure importante du projet

Le frontend se trouve dans :

```txt
src/
```

Le backend se trouve dans :

```txt
backend/
```

Les fichiers frontend importants sont probablement :

```txt
src/main.jsx
src/App.jsx
src/pages/Auth/Login.jsx
src/pages/Auth/Register.jsx
src/pages/Student/StudentDashboard.jsx
src/pages/Student/Profil.jsx
src/pages/Student/MesCandidatures.jsx
src/pages/Student/StudentStep1.jsx
src/pages/Student/StudentStep2.jsx
src/pages/Student/StudentStep3.jsx
src/pages/Student/StudentRecapitulatif.jsx
src/pages/Admin/DashboardAdmin.jsx
src/pages/Admin/CandidaturesAdmin.jsx
src/pages/Admin/DetailCandidaturesAdmin.jsx
src/pages/Admin/EtudiantsAdmin.jsx
src/pages/Admin/DetailEtudiantAdmin.jsx
src/pages/Admin/DocumentsAdmin.jsx
src/pages/Admin/DetailDocumentAdmin.jsx
src/services/
src/context/
src/components/
src/utils/
```

Les fichiers backend importants sont probablement :

```txt
backend/server.js
backend/app.js
backend/config/db.js
backend/routes/auth.routes.js
backend/routes/profile.routes.js
backend/routes/application.routes.js
backend/routes/document.routes.js
backend/routes/student.routes.js
backend/routes/admin.routes.js
backend/controllers/
backend/models/
backend/middlewares/auth.middleware.js
backend/middlewares/role.middleware.js
backend/middlewares/upload.middleware.js
```

## Ce que je veux comme format de réponse

Explique le projet dans cet ordre :

### 1. Vue d'ensemble

Explique ce que fait le projet, qui l'utilise et à quoi servent les espaces étudiant et admin.

### 2. Architecture globale

Explique la séparation :

- React pour l'interface
- Express pour l'API
- MySQL pour les données
- JWT pour la session
- bcrypt pour les mots de passe
- multer pour les fichiers

### 3. Démarrage de l'application

Explique :

- comment le frontend démarre
- comment le backend démarre
- le rôle de `main.jsx`
- le rôle de `App.jsx`
- le rôle de `server.js`
- le rôle de `app.js`

### 4. Frontend React

Explique :

- le routing
- les pages publiques
- les pages étudiant
- les pages admin
- les composants réutilisables
- les services API
- les contextes React
- le stockage local avec `localStorage`

### 5. Backend Express

Explique :

- les routes
- les controllers
- les models
- les middlewares
- la connexion MySQL
- la gestion des erreurs
- la logique de sécurité

### 6. Authentification

Explique en détail :

- inscription
- connexion
- hashage du mot de passe avec bcrypt
- génération du token JWT
- stockage du token côté frontend
- envoi du token dans les requêtes protégées
- récupération de l'utilisateur connecté
- déconnexion

### 7. Protection des routes

Explique :

- protection frontend
- protection backend
- rôle du middleware auth
- rôle du middleware role
- différence entre erreur 401 et erreur 403
- pourquoi un étudiant ne peut pas accéder aux routes admin

### 8. Parcours étudiant complet

Explique étape par étape :

1. création du compte
2. connexion
3. accès au dashboard étudiant
4. remplissage du profil
5. dépôt d'une candidature
6. ajout de documents
7. validation finale
8. suivi dans Mes candidatures
9. consultation des statuts
10. déconnexion

Pour chaque étape, explique :

- la page React utilisée
- le service frontend appelé
- la route backend appelée
- le controller backend utilisé
- le model backend utilisé
- la table MySQL concernée
- la réponse renvoyée au frontend

### 9. Parcours administrateur complet

Explique étape par étape :

1. connexion admin
2. accès au dashboard admin
3. consultation des statistiques
4. consultation des candidatures
5. détail d'une candidature
6. acceptation/refus/remise en attente
7. consultation des étudiants
8. détail d'un étudiant
9. consultation des documents
10. détail d'un document
11. validation/refus d'un document
12. déconnexion

Pour chaque étape, explique :

- la page React utilisée
- l'appel API
- la route backend
- la requête MySQL
- l'effet visible dans l'interface

### 10. Base de données

Explique toutes les tables importantes :

- `users`
- `student_profiles`
- `applications`
- `documents`

Pour chaque table, explique :

- son rôle
- ses colonnes
- ses relations
- quelles pages l'utilisent
- quelles routes l'utilisent

### 11. Upload des documents

Explique :

- comment React envoie un fichier
- pourquoi on utilise `FormData`
- comment multer reçoit le fichier
- où le fichier est stocké
- ce qui est enregistré en base
- comment l'admin peut consulter ou valider le document

### 12. Dashboards

Explique :

- dashboard étudiant
- dashboard admin
- statistiques calculées
- données affichées
- routes backend utilisées
- tables utilisées

### 13. Gestion des erreurs

Explique :

- erreurs frontend
- erreurs backend
- backend indisponible
- token absent
- token expiré
- accès refusé
- fichier invalide
- formulaire incomplet

### 14. Fichiers à connaître pour l'oral

Donne-moi une liste des fichiers les plus importants à maîtriser, avec pour chacun :

- son rôle
- pourquoi il est important
- ce que je dois savoir expliquer devant le jury

### 15. Questions possibles du jury

Prépare une liste de questions que le jury pourrait me poser, avec des réponses simples.

Exemples :

- Pourquoi avoir choisi React ?
- Pourquoi Express ?
- Pourquoi MySQL ?
- Pourquoi JWT ?
- Pourquoi bcrypt ?
- Comment protégez-vous les routes admin ?
- Où sont stockés les fichiers ?
- Comment évitez-vous qu'un étudiant voie les données d'un autre ?
- Comment une candidature est-elle créée ?
- Comment un document est-il validé ?

### 16. Résumé final

Termine par :

- un résumé simple du fonctionnement global
- les points forts du projet
- les limites actuelles
- les améliorations possibles
- les notions que je dois absolument maîtriser pour la soutenance

## Style attendu

Je veux une explication :

- très détaillée
- claire
- pédagogique
- en français
- adaptée à un étudiant
- orientée soutenance
- avec des schémas textuels si utile
- avec des exemples de flux comme :

```txt
Utilisateur -> Frontend React -> Service API -> Backend Express -> Controller -> Model -> MySQL -> Réponse JSON -> Interface React
```

Ne réponds pas trop vite. Analyse les fichiers fournis et explique progressivement.

