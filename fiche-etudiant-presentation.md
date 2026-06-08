# Fiche Étudiant - Présentation Jury

Cette fiche résume uniquement la partie **étudiant** du projet UniPass / PFC.

## 1. Rôle De L'Étudiant

L'étudiant est l'utilisateur principal de la plateforme. Il utilise UniPass pour :

- créer son compte ;
- compléter son profil personnel et scolaire ;
- choisir une filière et un établissement ;
- déposer les documents demandés ;
- soumettre sa candidature ;
- suivre l'état de son dossier.

Phrase à dire :

> "L'espace étudiant accompagne le candidat depuis la création du compte jusqu'au suivi final de sa candidature."

## 2. Parcours Étudiant Complet

### Étape 1 : Accéder À La Plateforme

- **Page** : `/`
- **Fichier** : `src/pages/Home.jsx`
- **Description** : l'étudiant arrive sur la page d'accueil UniPass.
- **Objectif** : comprendre le service et accéder à l'inscription ou à la connexion.

Phrase à dire :

> "La page d'accueil présente la plateforme et donne accès rapidement à l'inscription ou à la connexion."

### Étape 2 : Créer Un Compte

- **Page** : `/register`
- **API** : `POST /api/auth/register`
- **Fichiers** :
  - `src/pages/Auth/Register.jsx`
  - `backend/controllers/auth.controller.js`
  - `backend/models/user.model.js`
- **Description** : l'étudiant saisit ses informations de base et son mot de passe.
- **Objectif** : créer un compte étudiant sécurisé.

Phrase à dire :

> "Lors de l'inscription, le compte est créé côté backend et le mot de passe est sécurisé avec bcrypt."

### Étape 3 : Se Connecter

- **Page** : `/login`
- **API** : `POST /api/auth/login`
- **Fichiers** :
  - `src/pages/Auth/Login.jsx`
  - `src/services/authService.js`
  - `backend/controllers/auth.controller.js`
- **Description** : l'étudiant se connecte avec son email ou son numéro d'inscription bac si son profil existe.
- **Objectif** : accéder à son espace personnel.

Phrase à dire :

> "Après connexion, l'étudiant est automatiquement redirigé vers son espace."

### Étape 4 : Compléter Le Profil

- **Page** : `/profil`
- **API** : `GET /api/profile/me`, `PUT /api/profile/me`
- **Fichiers** :
  - `src/pages/Student/Profil.jsx`
  - `backend/controllers/profile.controller.js`
  - `backend/models/profile.model.js`
- **Description** : l'étudiant complète ses informations personnelles, son adresse, son bac, sa série et sa moyenne.
- **Objectif** : préparer les données nécessaires à l'étude du dossier.

Phrase à dire :

> "Le profil étudiant contient les informations personnelles et scolaires nécessaires au traitement de la candidature."

### Étape 5 : Voir Le Tableau De Bord

- **Page** : `/dashboard`
- **API** : `GET /api/student/dashboard`
- **Fichiers** :
  - `src/pages/Student/StudentDashboard.jsx`
  - `backend/controllers/student.controller.js`
- **Description** : le dashboard affiche l'état du profil, des documents et des candidatures.
- **Objectif** : aider l'étudiant à savoir ce qui est complet ou manquant.

Phrase à dire :

> "Le tableau de bord permet à l'étudiant de suivre l'avancement de son dossier en un coup d'œil."

### Étape 6 : Choisir Une Filière

- **Page** : `/student-step1`
- **Fichiers** :
  - `src/pages/Student/StudentStep1.jsx`
  - `src/data/formationsBachelier.js`
  - `src/context/AdmissionsContext.jsx`
- **Description** : l'étudiant choisit un domaine, une filière et l'année universitaire.
- **Objectif** : définir son choix académique.

Phrase à dire :

> "La candidature commence par le choix du domaine et de la filière."

### Étape 7 : Choisir Un Établissement

- **Page** : `/student-step2`
- **Fichiers** :
  - `src/pages/Student/StudentStep2.jsx`
  - `src/data/formationsBachelier.js`
- **Description** : l'étudiant choisit un établissement compatible avec sa filière.
- **Objectif** : éviter les choix incohérents.

Phrase à dire :

> "Les établissements proposés sont liés à la filière choisie par l'étudiant."

### Étape 8 : Déposer Les Documents

- **Page** : `/student-step3`
- **API** : `POST /api/documents`
- **Fichiers** :
  - `src/pages/Student/StudentStep3.jsx`
  - `backend/controllers/document.controller.js`
  - `backend/middlewares/upload.middleware.js`
- **Description** : l'étudiant dépose ses pièces justificatives.
- **Objectif** : fournir les preuves nécessaires pour vérifier son dossier.
- **Formats acceptés** : PDF, JPG, JPEG, PNG.
- **Taille maximale** : 5 Mo.

Documents principaux :

- relevé de notes ;
- attestation de réussite du bac ;
- pièce d'identité ;
- photo ;
- certificat de résidence ;
- justificatif particulier si nécessaire.

Phrase à dire :

> "Le dépôt des documents est contrôlé par format et par taille afin d'éviter les fichiers invalides."

### Étape 9 : Vérifier Le Récapitulatif

- **Page** : `/student-recapitulatif`
- **API** : `POST /api/applications`
- **Fichiers** :
  - `src/pages/Student/StudentRecapitulatif.jsx`
  - `backend/controllers/application.controller.js`
- **Description** : l'étudiant vérifie ses informations avant de soumettre.
- **Objectif** : réduire les erreurs avant l'envoi final.

Phrase à dire :

> "Avant la soumission, l'étudiant peut relire toutes les informations de son dossier."

### Étape 10 : Soumettre La Candidature

- **Page de confirmation** : `/success`
- **Fichier** : `src/pages/Auth/Success.jsx`
- **Description** : après dépôt, une page de succès affiche le numéro de dossier.
- **Objectif** : confirmer que la candidature a bien été envoyée.

Phrase à dire :

> "Après la soumission, l'étudiant reçoit un numéro de dossier qui servira pour le suivi."

### Étape 11 : Suivre Les Candidatures

- **Page** : `/mes-candidatures`
- **API** : `GET /api/applications/my`, `GET /api/documents/my`
- **Fichiers** :
  - `src/pages/Student/MesCandidatures.jsx`
  - `src/services/applicationService.js`
  - `src/services/documentService.js`
- **Description** : l'étudiant consulte ses candidatures, les statuts et les commentaires admin.
- **Objectif** : rester informé de l'évolution du dossier.

Phrase à dire :

> "L'étudiant peut suivre ses candidatures et voir les retours de l'administration."

## 3. Statuts Visibles Pour L'Étudiant

### Statuts De Candidature

- `En attente` : dossier soumis, pas encore accepté ou refusé.
- `Acceptée` : candidature validée par l'administration.
- `Refusée` : candidature refusée par l'administration.

### Statuts De Documents

- `En attente` : document déposé, pas encore vérifié.
- `Validé` : document accepté par l'admin.
- `Refusé` : document refusé, généralement avec un commentaire.

Phrase à dire :

> "L'étudiant ne reste pas sans information : il peut voir l'état de ses documents et de sa candidature."

## 4. Points Forts De L'Espace Étudiant

- Parcours guidé étape par étape.
- Profil complet avec informations personnelles et bac.
- Choix de filière organisé par domaine.
- Établissements filtrés selon la filière.
- Dépôt de documents avec contrôle du format et de la taille.
- Récapitulatif avant soumission.
- Numéro de dossier après dépôt.
- Suivi des candidatures et des commentaires admin.
- Dashboard clair pour voir l'avancement.
- Interface séparée des espaces admin et super admin.

## 5. Limites Côté Étudiant

- La récupération de mot de passe n'est pas encore réellement implémentée.
- Le changement de mot de passe côté profil semble local et pas relié à une API backend complète.
- Les notifications email ou SMS ne sont pas encore présentes.
- Les documents déposés avant création de candidature peuvent rester liés à l'étudiant plutôt qu'à une candidature précise.
- Il n'y a pas encore de vérification automatique officielle des données du bac.

## 6. Scénario Démo Étudiant

1. Ouvrir la page d'accueil `/`.
2. Cliquer sur inscription et créer un compte étudiant.
3. Se connecter avec l'email et le mot de passe.
4. Compléter le profil étudiant.
5. Ouvrir le dashboard pour montrer l'état du dossier.
6. Choisir une filière dans `/student-step1`.
7. Choisir un établissement dans `/student-step2`.
8. Déposer les documents dans `/student-step3`.
9. Vérifier le récapitulatif.
10. Soumettre la candidature.
11. Afficher la page de succès avec le numéro de dossier.
12. Aller dans `/mes-candidatures` pour montrer le suivi.

## 7. Questions Jury Sur La Partie Étudiant

### Pourquoi obliger l'étudiant à compléter son profil ?

Parce que le profil contient les informations nécessaires pour étudier le dossier : identité, contact, série du bac, moyenne et établissement d'origine.

### Pourquoi utiliser un parcours en plusieurs étapes ?

Pour rendre la candidature plus claire. L'étudiant avance progressivement : choix de filière, choix d'établissement, documents, puis récapitulatif.

### Comment évitez-vous les dossiers incomplets ?

Le système affiche les documents attendus et le dashboard indique l'état du profil, des documents et de la candidature.

### Pourquoi afficher un récapitulatif ?

Le récapitulatif permet à l'étudiant de vérifier ses informations avant l'envoi final.

### Comment l'étudiant sait-il que son dossier est déposé ?

Après la soumission, une page de succès affiche un numéro de dossier et les prochaines étapes.

### Comment l'étudiant suit-il la décision ?

Il peut aller dans `Mes candidatures` pour voir le statut de ses candidatures et les commentaires de l'administration.

### Que se passe-t-il si un document est refusé ?

L'étudiant peut voir le statut `Refusé` et le commentaire associé, ce qui l'aide à comprendre le problème.

## 8. Mini Discours Pour Présenter L'Espace Étudiant

> "Dans l'espace étudiant, l'objectif est de simplifier le dépôt d'une candidature universitaire. L'étudiant commence par créer son compte, puis il complète son profil avec ses informations personnelles et les informations du bac. Ensuite, il suit un parcours guidé : choix de la filière, choix de l'établissement, dépôt des documents, puis vérification du récapitulatif. Une fois la candidature soumise, il reçoit un numéro de dossier et peut suivre l'évolution de son statut dans la page Mes candidatures. Cette partie permet donc de rendre le processus plus clair, plus structuré et plus facile à suivre pour l'étudiant."
