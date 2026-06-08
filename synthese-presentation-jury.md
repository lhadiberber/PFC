# Synthèse Du Projet PFC - Présentation Jury

Analyse basée sur le code réel du projet. Aucun fichier de code n'a été modifié.

## A. Résumé Du Projet

Le projet **UniPass / PFC** est une plateforme web d'orientation et de gestion des candidatures universitaires. Elle permet à un étudiant de créer un compte, compléter son profil, choisir une filière et un établissement, déposer les documents demandés puis suivre l'état de sa candidature.

Côté administration, les agents consultent les dossiers, vérifient les pièces, appliquent des règles de présélection et prennent une décision. Le super administrateur pilote les comptes administrateurs et les utilisateurs.

Architecture réelle :

- **Frontend** : React + Vite, routes dans `src/App.jsx`
- **Backend** : Express + MySQL, point d'entrée `backend/app.js`
- **Authentification** : JWT + bcrypt
- **Stockage** : tables `users`, `student_profiles`, `applications`, `documents`, `selection_rules`

## B. Acteurs Du Système

### Étudiant

Crée son compte, complète son profil, dépose une candidature, téléverse ses documents et suit son dossier.

### Admin

Consulte et traite les candidatures, valide ou refuse les documents, applique les règles de sélection et exporte les listes.

### Super Admin

Gère les administrateurs, les utilisateurs, leurs rôles, leur activation et leur périmètre.

### Système Backend

Sécurise les accès, stocke les données, vérifie les rôles, gère les fichiers et communique avec la base MySQL.

## C. Fonctionnalités Étudiant

### 1. Accueil Et Présentation

- **Description** : page publique avec présentation d'UniPass, choix de langue, accès inscription et connexion.
- **Objectif** : introduire la plateforme et guider l'étudiant.
- **Page / route** : `/`
- **Fichiers probables** : `src/pages/Home.jsx`, `src/context/LanguageContext.jsx`
- **Phrase à dire** : "La page d'accueil donne une entrée simple vers l'inscription, la connexion et l'information sur la plateforme."

### 2. Inscription Étudiant

- **Description** : création d'un compte avec nom, prénom, email, téléphone et mot de passe.
- **Objectif** : ouvrir un espace personnel étudiant.
- **Page / API** : `/register`, `POST /api/auth/register`
- **Fichiers probables** : `src/pages/Auth/Register.jsx`, `backend/controllers/auth.controller.js`, `backend/models/user.model.js`
- **Phrase à dire** : "L'inscription crée un compte étudiant sécurisé avec mot de passe hashé côté serveur."

### 3. Connexion

- **Description** : connexion par email ou numéro d'inscription bac si le profil existe.
- **Objectif** : authentifier l'utilisateur et le rediriger selon son rôle.
- **Page / API** : `/login`, `POST /api/auth/login`
- **Fichiers probables** : `src/pages/Auth/Login.jsx`, `src/services/authService.js`, `backend/controllers/auth.controller.js`
- **Phrase à dire** : "Le système redirige automatiquement l'étudiant, l'admin ou le super admin vers son espace."

### 4. Profil Étudiant

- **Description** : gestion des informations personnelles, contact, bac, moyenne, série et établissement d'origine.
- **Objectif** : constituer le dossier administratif de base.
- **Page / API** : `/profil`, `GET /api/profile/me`, `PUT /api/profile/me`
- **Fichiers probables** : `src/pages/Student/Profil.jsx`, `backend/controllers/profile.controller.js`, `backend/models/profile.model.js`
- **Phrase à dire** : "Le profil centralise les données nécessaires pour évaluer la candidature."

### 5. Tableau De Bord Étudiant

- **Description** : résumé du profil, candidatures, documents, statut global et activité récente.
- **Objectif** : donner à l'étudiant une vision claire de son avancement.
- **Page / API** : `/dashboard`, `GET /api/student/dashboard`
- **Fichiers probables** : `src/pages/Student/StudentDashboard.jsx`, `backend/controllers/student.controller.js`
- **Phrase à dire** : "Le dashboard montre immédiatement ce qui est complet, incomplet ou en attente."

### 6. Choix De Filière

- **Description** : sélection du domaine, de la filière et de l'année universitaire.
- **Objectif** : définir le choix académique de l'étudiant.
- **Page / route** : `/student-step1`
- **Fichiers probables** : `src/pages/Student/StudentStep1.jsx`, `src/data/formationsBachelier.js`, `src/context/AdmissionsContext.jsx`
- **Phrase à dire** : "Le parcours de candidature commence par un choix guidé de filière."

### 7. Choix D'Établissement

- **Description** : choix d'un établissement compatible avec la filière.
- **Objectif** : éviter les choix incohérents et préremplir les informations utiles.
- **Page / route** : `/student-step2`
- **Fichiers probables** : `src/pages/Student/StudentStep2.jsx`, `src/data/formationsBachelier.js`
- **Phrase à dire** : "Les établissements proposés dépendent de la filière sélectionnée."

### 8. Dépôt Des Documents

- **Description** : upload de pièces justificatives PDF, JPG ou PNG, maximum 5 Mo.
- **Objectif** : fournir les preuves nécessaires au traitement du dossier.
- **Page / API** : `/student-step3`, `POST /api/documents`
- **Fichiers probables** : `src/pages/Student/StudentStep3.jsx`, `backend/controllers/document.controller.js`, `backend/middlewares/upload.middleware.js`
- **Phrase à dire** : "Les documents sont contrôlés par format et taille avant d'être stockés."

### 9. Récapitulatif Et Soumission

- **Description** : résumé du profil, du choix, des documents, puis envoi de la candidature.
- **Objectif** : permettre à l'étudiant de vérifier avant dépôt final.
- **Page / API** : `/student-recapitulatif`, `POST /api/applications`
- **Fichiers probables** : `src/pages/Student/StudentRecapitulatif.jsx`, `backend/controllers/application.controller.js`
- **Phrase à dire** : "Avant l'envoi, l'étudiant voit un récapitulatif complet pour limiter les erreurs."

### 10. Page De Succès

- **Description** : confirmation de dépôt avec numéro de dossier, date et prochaines étapes.
- **Objectif** : rassurer l'étudiant après la soumission.
- **Page / route** : `/success`
- **Fichiers probables** : `src/pages/Auth/Success.jsx`
- **Phrase à dire** : "Après la soumission, l'étudiant reçoit un numéro de dossier pour le suivi."

### 11. Suivi Des Candidatures

- **Description** : liste des candidatures, filtres, statuts, documents et commentaires admin.
- **Objectif** : suivre l'évolution du dossier après dépôt.
- **Page / API** : `/mes-candidatures`, `GET /api/applications/my`, `GET /api/documents/my`
- **Fichiers probables** : `src/pages/Student/MesCandidatures.jsx`, `src/services/applicationService.js`, `src/services/documentService.js`
- **Phrase à dire** : "L'étudiant peut suivre ses dossiers et lire les retours de l'administration."

## D. Fonctionnalités Admin

### 1. Dashboard Admin

- **Description** : statistiques, candidatures récentes, documents à traiter, répartition des statuts.
- **Objectif** : prioriser le travail administratif.
- **Page / API** : `/admin`, `GET /api/admin/dashboard`
- **Fichiers probables** : `src/pages/Admin/DashboardAdmin.jsx`, `backend/controllers/admin.controller.js`
- **Phrase à dire** : "L'admin dispose d'un tableau de bord pour piloter le traitement des dossiers."

### 2. Liste Des Candidatures

- **Description** : recherche, filtres, pagination, tri, export CSV/PDF.
- **Objectif** : retrouver rapidement les dossiers à traiter.
- **Page / API** : `/admin/candidatures`, `GET /api/admin/applications`
- **Fichiers probables** : `src/pages/Admin/CandidaturesAdmin.jsx`, `src/services/adminService.js`, `src/utils/exportCsv.js`, `src/utils/exportPdf.js`
- **Phrase à dire** : "Les candidatures peuvent être filtrées, triées et exportées."

### 3. Détail Candidature Et Décision

- **Description** : consultation du dossier complet, documents, profil, présélection et décision finale.
- **Objectif** : accepter, refuser ou laisser en attente une candidature.
- **Page / API** : `/admin/candidatures/:id`, `PATCH /api/admin/applications/:id/status`
- **Fichiers probables** : `src/pages/Admin/DetailCandidaturesAdmin.jsx`, `backend/controllers/admin.controller.js`, `backend/models/application.model.js`
- **Phrase à dire** : "La décision finale reste contrôlée par l'administrateur."

### 4. Gestion Des Documents

- **Description** : liste des pièces déposées avec statut et filtres.
- **Objectif** : organiser la vérification documentaire.
- **Page / API** : `/admin/documents`, `GET /api/admin/documents`
- **Fichiers probables** : `src/pages/Admin/DocumentsAdmin.jsx`, `backend/controllers/admin.controller.js`
- **Phrase à dire** : "L'administration peut suivre les documents en attente, validés ou refusés."

### 5. Validation Ou Refus D'Un Document

- **Description** : visualisation, téléchargement, validation ou refus avec commentaire.
- **Objectif** : justifier les retours administratifs.
- **Page / API** : `/admin/documents/:documentId`, `PATCH /api/admin/documents/:id/status`
- **Fichiers probables** : `src/pages/Admin/DetailDocumentAdmin.jsx`, `backend/models/document.model.js`, `backend/controllers/admin.controller.js`
- **Phrase à dire** : "Chaque document peut être validé ou refusé avec un commentaire explicatif."

### 6. Gestion Des Étudiants

- **Description** : liste et détail des étudiants, profil, candidatures et documents associés.
- **Objectif** : avoir une vision centrée sur l'étudiant.
- **Page / API** : `/admin/etudiants`, `/admin/etudiants/:id`
- **Fichiers probables** : `src/pages/Admin/EtudiantsAdmin.jsx`, `src/pages/Admin/DetailEtudiantAdmin.jsx`
- **Phrase à dire** : "L'admin peut consulter l'historique complet d'un étudiant."

### 7. Règles De Sélection

- **Description** : création de règles par filière : moyenne minimale, séries acceptées, documents obligatoires.
- **Objectif** : aider la présélection des dossiers.
- **Page / API** : `/admin/regles-selection`, `/api/admin/selection-rules`
- **Fichiers probables** : `src/pages/Admin/SelectionRulesAdmin.jsx`, `backend/controllers/selectionRule.controller.js`, `backend/models/selectionRule.model.js`
- **Phrase à dire** : "Les règles permettent d'automatiser une première évaluation, sans remplacer la décision humaine."

### 8. Périmètre Admin

- **Description** : un admin peut être limité par université et département.
- **Objectif** : répartir le travail entre services.
- **Page / API** : filtrage dans les routes admin.
- **Fichiers probables** : `backend/models/admin.model.js`, `backend/middlewares/auth.middleware.js`, `backend/models/superAdmin.model.js`
- **Phrase à dire** : "Les administrateurs peuvent être rattachés à un périmètre de traitement."

### 9. Profil Admin

- **Description** : consultation et édition locale du profil admin.
- **Objectif** : afficher les informations du compte administrateur.
- **Page / route** : `/admin/profil`
- **Fichiers probables** : `src/pages/Admin/ProfilAdmin.jsx`, `src/utils/adminAccount.js`
- **Phrase à dire** : "L'admin possède aussi un espace profil, même si certaines modifications restent locales côté interface."

## E. Fonctionnalités Super Admin

### 1. Dashboard Super Admin

- **Description** : statistiques globales admins, utilisateurs, étudiants et candidatures.
- **Objectif** : superviser toute la plateforme.
- **Page / API** : `/super-admin`, `GET /api/super-admin/dashboard`
- **Fichiers probables** : `src/pages/SuperAdmin/SuperAdminDashboard.jsx`, `backend/controllers/superAdmin.controller.js`
- **Phrase à dire** : "Le super admin a une vue globale de la plateforme."

### 2. Gestion Des Administrateurs

- **Description** : création, modification, activation et désactivation d'admins.
- **Objectif** : contrôler les comptes administratifs.
- **Page / API** : `/super-admin/admins`, `/api/super-admin/admins`
- **Fichiers probables** : `src/pages/SuperAdmin/AdminsManagement.jsx`, `backend/models/superAdmin.model.js`
- **Phrase à dire** : "Le super admin peut créer des administrateurs et définir leur périmètre."

### 3. Gestion Des Utilisateurs

- **Description** : liste des utilisateurs, changement de rôle étudiant/admin, activation/désactivation.
- **Objectif** : administrer les accès.
- **Page / API** : `/super-admin/users`, `/api/super-admin/users`
- **Fichiers probables** : `src/pages/SuperAdmin/UsersManagement.jsx`, `backend/controllers/superAdmin.controller.js`
- **Phrase à dire** : "La gestion des rôles est centralisée côté super admin."

### 4. Protection Des Comptes Sensibles

- **Description** : impossibilité de désactiver son propre compte ou de gérer un super admin comme un utilisateur normal.
- **Objectif** : éviter les blocages administratifs.
- **Fichiers probables** : `backend/controllers/superAdmin.controller.js`, `backend/models/superAdmin.model.js`
- **Phrase à dire** : "Des garde-fous empêchent certaines actions dangereuses sur les comptes critiques."

### 5. Profil Super Admin

- **Description** : page de profil du super admin avec informations de session.
- **Objectif** : identifier le compte connecté et accéder rapidement aux fonctions de supervision.
- **Page / route** : `/super-admin/profil`
- **Fichiers probables** : `src/pages/SuperAdmin/SuperAdminProfile.jsx`
- **Phrase à dire** : "Le super admin dispose d'un espace de consultation de son profil et de raccourcis vers la gestion."

## F. Fonctionnalités Techniques Transversales

- **Authentification JWT** : le backend vérifie un token Bearer pour protéger les routes.
  - Fichiers : `backend/middlewares/auth.middleware.js`, `src/services/authService.js`

- **Hashage des mots de passe** : bcrypt est utilisé à l'inscription, à la connexion et à la création d'admins.
  - Fichiers : `backend/controllers/auth.controller.js`, `backend/models/superAdmin.model.js`

- **Contrôle des rôles** : séparation étudiant, admin et super admin.
  - Fichiers : `backend/middlewares/role.middleware.js`, `src/components/ProtectedRoute` ou logique dans `src/App.jsx`

- **Base MySQL relationnelle** : tables utilisateurs, profils, candidatures, documents et règles.
  - Fichiers : `backend/server.js`, `backend/models/*.js`

- **Upload de documents** : formats limités PDF/JPG/JPEG/PNG, taille maximum 5 Mo.
  - Fichier : `backend/middlewares/upload.middleware.js`

- **Architecture frontend/backend séparée** : le frontend passe par des services API.
  - Fichiers : `src/services/*.js`, `backend/routes/*.routes.js`

- **Internationalisation partielle** : support français, anglais et arabe dans l'interface.
  - Fichiers : `src/context/LanguageContext.jsx`, `src/components/LanguageSelector.jsx`

- **Exports admin** : génération CSV et PDF imprimable.
  - Fichiers : `src/utils/exportCsv.js`, `src/utils/exportPdf.js`

- **Health checks et CORS** : endpoints de santé et configuration des origines autorisées.
  - Fichier : `backend/app.js`

- **Présélection semi-automatique** : évaluation selon moyenne, série du bac et documents requis.
  - Fichier : `backend/models/selectionRule.model.js`

## G. Points Forts À Dire Au Jury

- "Le projet couvre tout le cycle de candidature : inscription, profil, choix, documents, soumission, traitement et décision."
- "Les rôles sont bien séparés : étudiant, admin et super admin."
- "La sécurité de base est présente : JWT, bcrypt, contrôle des rôles et blocage des comptes inactifs."
- "Le système ne se limite pas à un formulaire : il inclut suivi, dashboard, documents, règles de sélection et exports."
- "La présélection aide l'administration, mais la décision finale reste humaine."
- "Le backend et le frontend sont séparés, ce qui rend le projet plus maintenable."
- "Le super admin permet de gérer les comptes et les périmètres des administrateurs."
- "L'interface admin permet un traitement opérationnel avec filtres, détails, décisions et export."

## H. Limites Et Perspectives

### Limites Actuelles

- Le lien "mot de passe oublié" existe côté interface, mais aucune route réelle n'est définie dans `src/App.jsx`.
- Le changement de mot de passe étudiant/admin semble local côté frontend, pas relié à une API backend.
- Le pilotage interne admin comme priorité, assignation ou notes internes est partiellement local côté frontend.
- L'ajout manuel d'un étudiant côté admin affiche "bientôt disponible".
- Pas d'OCR ni de vérification automatique réelle des documents.
- Pas d'intégration avec une base officielle du bac ou des universités.
- Les documents uploadés avant la création de candidature peuvent rester liés à l'étudiant plutôt qu'à une candidature précise.
- Le périmètre multi-université repose surtout sur des champs texte comme `university_scope` et `assigned_department`.

### Perspectives

- Ajouter une récupération de mot de passe complète.
- Ajouter des notifications email ou SMS.
- Ajouter un historique backend complet des actions administratives.
- Ajouter des journaux d'audit pour les décisions sensibles.
- Relier plus précisément les documents à chaque candidature.
- Ajouter des tests automatisés frontend/backend.
- Ajouter une vérification automatique ou semi-automatique des documents.
- Ajouter une vraie gestion référentielle des universités, facultés et filières.

## I. Scénario De Démonstration

1. Ouvrir `/` et présenter UniPass.
2. Montrer le changement de langue si nécessaire.
3. Créer un compte étudiant sur `/register`.
4. Se connecter via `/login`.
5. Compléter le profil étudiant sur `/profil`.
6. Aller au dashboard étudiant `/dashboard` et montrer la progression.
7. Créer une candidature : `/student-step1`, `/student-step2`, `/student-step3`.
8. Montrer le dépôt des documents.
9. Afficher le récapitulatif `/student-recapitulatif` et soumettre.
10. Montrer la page `/success` avec le numéro de dossier.
11. Aller sur `/mes-candidatures` pour montrer le suivi.
12. Se connecter comme admin et ouvrir `/admin`.
13. Consulter `/admin/candidatures`, ouvrir une candidature et changer son statut.
14. Aller sur `/admin/documents`, ouvrir un document, le valider ou le refuser avec commentaire.
15. Montrer `/admin/regles-selection` pour expliquer la présélection.
16. Se connecter comme super admin et ouvrir `/super-admin`.
17. Montrer la gestion des admins `/super-admin/admins`.
18. Montrer la gestion des utilisateurs `/super-admin/users`.

## J. Questions Possibles Du Jury Et Réponses

### Pourquoi trois rôles ?

Pour séparer clairement les responsabilités : l'étudiant dépose son dossier, l'admin traite les candidatures, et le super admin supervise les utilisateurs et les administrateurs.

### Comment sécurisez-vous les mots de passe ?

Les mots de passe sont hashés avec bcrypt côté backend avant stockage. Le mot de passe réel n'est donc pas enregistré en clair.

### Comment savez-vous qu'un utilisateur est autorisé ?

Le backend vérifie le JWT envoyé dans le header Authorization, puis contrôle le rôle de l'utilisateur avec des middlewares.

### La présélection remplace-t-elle l'admin ?

Non. Elle aide à repérer les dossiers éligibles, incomplets ou non éligibles selon des règles, mais la décision finale reste prise par l'administrateur.

### Quels documents sont demandés ?

Les documents principaux sont : relevé de notes, attestation de réussite bac, pièce d'identité, photo et certificat de résidence. Un justificatif particulier peut aussi être ajouté.

### Que se passe-t-il si un document est refusé ?

L'admin peut refuser le document avec un commentaire. Ce commentaire peut ensuite être affiché côté suivi étudiant.

### Le projet est-il multi-université ?

Partiellement oui. Les admins peuvent avoir un périmètre avec `university_scope` et `assigned_department`, mais il n'existe pas encore une vraie table complète des universités et départements.

### Quelle est la principale limite actuelle ?

Certaines fonctions avancées sont encore partielles, notamment la récupération de mot de passe, les notifications et les notes internes persistées côté backend.

### Quelle amélioration prioritaire feriez-vous ?

J'ajouterais un historique backend complet des actions administratives, avec notifications pour informer les étudiants quand leur dossier ou leurs documents changent de statut.

### Pourquoi utiliser React et Express ?

React permet une interface dynamique et modulaire, tandis qu'Express permet de construire rapidement une API REST claire entre le frontend et la base MySQL.

### Comment les fichiers sont-ils sécurisés ?

L'upload limite les formats acceptés et la taille des fichiers. Les fichiers sont renommés automatiquement et stockés dans le dossier d'uploads côté backend.

### Comment expliquez-vous le workflow global ?

Le workflow est simple : l'étudiant prépare et soumet son dossier, l'administration vérifie les informations et les documents, puis une décision finale est enregistrée et visible dans le suivi.

## Conclusion Courte Pour La Présentation

UniPass est une plateforme complète de gestion des candidatures universitaires. Elle couvre les besoins principaux des étudiants, des administrateurs et du super administrateur, avec une architecture frontend/backend séparée, une authentification sécurisée, une base MySQL et un système de documents. Le projet est fonctionnel sur le cœur du processus, avec des perspectives claires pour aller vers une plateforme plus complète : notifications, audit, récupération de mot de passe, vérification documentaire et meilleure gestion multi-université.
