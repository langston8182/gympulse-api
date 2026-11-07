# GymPulse API

API REST serverless (AWS Lambda + API Gateway HTTP API) pour l'application Android [gympulse-apk](../gympulse-apk), persistée sur **MongoDB Atlas**.
Elle reprend le contrat de `GymPulseApi` / `Dtos.kt` de l'app (champs `ref`, `exerciseRef`, `locationRefs`…) et y ajoute ce dont l'app aura besoin une fois connectée : CRUD, séance en cours, historique, records, statistiques, préférences et données de démo.

## Stack

- Node.js 20 + TypeScript
- [Serverless Framework](https://www.serverless.com/) (`serverless-esbuild`, `serverless-offline`, `serverless-dotenv-plugin`)
- MongoDB Atlas via Mongoose
- Jest (tests unitaires + intégration via `mongodb-memory-server`)

## Structure

```
src/
  config/db.ts        # Connexion MongoDB (cache pour les warm starts Lambda)
  models/             # Schémas Mongoose (exercise, session, program, location, workout, preferences)
  mappers/            # Documents Mongo -> DTO (alignés sur les DTO Kotlin)
  validators/         # Validation des payloads
  services/           # Résolution des références, séance -> instantané, démo, historique
  domain/             # Cœur métier pur : bibliothèque d'exercices, 1RM/volume, records, statistiques, démo
  handlers/<domaine>/ # Une lambda par route (enveloppe commune : utils/handler.ts)
  utils/              # Réponses HTTP, erreurs, auth, fuseaux horaires
tests/unit | integration
serverless.yml        # Fonctions Lambda + routes HTTP API
infra/                # buildspecs CodeBuild
```

## Conventions

- **Identifiants** : chaque ressource expose `ref` (ObjectId en chaîne). Les références croisées sont des chaînes opaques ; un `exerciseRef` est soit une clé de la bibliothèque fournie (`bench_db`…), soit le `ref` d'un exercice de l'utilisateur.
- **Isolation** : toutes les données sont filtrées par utilisateur (`userId`).
- **Authentification** : `userId` = claim `sub` du **jeton d'accès Cognito** (`Authorization: Bearer …`), vérifié dans la lambda (signature, émetteur, client, expiration) avec `aws-jwt-verify`. Le pool et le client se règlent par stage dans `custom.cognito` de `serverless.yml` (variables `COGNITO_USER_POOL_ID` et `COGNITO_CLIENT_ID`). En stage `dev` uniquement, l'en-tête `x-user-id` reste accepté (`ALLOW_DEV_USER_HEADER`). Sans identifiant valide, toutes les routes (sauf `/v1/health`) répondent `401`. Un authorizer API Gateway reste possible (le claim `sub` est alors lu en premier).
- **Erreurs** : `{ "message": string, "details"?: any }` avec 400 / 401 / 404 / 409 / 500.
- **Horodatages** : millisecondes epoch (comme l'app). `createdAt` / `updatedAt` en ISO 8601.
- **Charges** : toujours en kg (la conversion lb est côté app).
- **Historique figé** : une séance réalisée embarque un instantané des exercices (nom, type, charge, muscles…). Elle reste exacte si l'exercice ou la séance sont modifiés ou supprimés.
- **Statistiques** : `?tz=Europe/Paris` (défaut) pour découper jours/semaines/mois.

## Routes (préfixe `/v1`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | Santé (sans auth) |
| GET | `/exercises/library` | Bibliothèque fournie (46 exercices, statique) |
| GET, POST | `/exercises` | Exercices de l'utilisateur |
| GET, PUT, DELETE | `/exercises/{id}` | `DELETE` → 409 `{sessionCount}` si utilisé, sauf `?force=true` |
| GET, POST | `/sessions` | Séances |
| GET, PUT, DELETE | `/sessions/{id}` | Supprime aussi la séance des programmes |
| POST | `/sessions/{id}/duplicate` | Body optionnel `{name}` |
| PUT | `/sessions/{id}/favorite` | `{favorite}` |
| GET, POST | `/programs` | Programmes |
| GET, PUT, DELETE | `/programs/{id}` | |
| GET, POST | `/locations` | Lieux (nom, adresse facultative, position, rayon, type, matériel) |
| GET, PUT, DELETE | `/locations/{id}` | Nettoie les liens et le choix manuel |
| PUT | `/locations/{id}/sessions` | `{sessionRefs}` remplace les séances liées |
| PUT | `/locations/{id}/programs` | `{programRefs}` remplace les programmes liés |
| GET | `/`, `/confidentialite`, `/conditions`, `/suppression-compte` | Pages publiques HTML (sans authentification), exigées par Google (écran de consentement) et Google Play |
| DELETE | `/account` | Suppression définitive du compte : `{confirm: true}` ; efface toutes les données puis l'utilisateur Cognito (IAM `cognito-idp:AdminDeleteUser`) |
| GET | `/catalog` | `{locations, sessions, programs}` (= `CatalogDto`) |
| GET | `/workouts` | Historique terminé, récent d'abord (`limit`, `before`, `from`, `to`) |
| POST | `/workouts` | Enregistre une séance terminée (= `WorkoutDto`, enrichi) ; renvoie aussi `records` |
| GET, PUT, DELETE | `/workouts/{id}` | |
| GET | `/workouts/{id}/records` | Records battus pendant la séance |
| GET | `/workouts/active` | Séance en cours (204 si aucune) |
| PUT | `/workouts/active` | Upsert de l'état complet (minuteurs, série courante…) à chaque action |
| DELETE | `/workouts/active` | Abandon |
| POST | `/workouts/active/complete` | « Terminer et enregistrer » → séance + `records` |
| GET | `/stats/dashboard?period=` | `WEEK\|MONTH\|QUARTER\|HALF_YEAR\|YEAR\|ALL` |
| GET | `/stats/exercises/{ref}?period=` | Progression, records, rep-max, séries par métrique, comparaison de périodes |
| GET | `/stats/last-performances` | Dernière performance de chaque exercice, par `exerciseRef` |
| GET | `/stats/last-performance/{ref}?sessionRef=&excluding=` | 204 si aucune |
| GET, PUT | `/preferences` | Préférences (mise à jour partielle) |
| GET, POST, DELETE | `/demo` | Statut, génération (~5 mois d'historique, `?tz=`), suppression |

Les champs d'une séance réalisée : `sessionRef`, `sessionName`, `goal`, `status` (`IN_PROGRESS|PAUSED|COMPLETED|CANCELLED`), `startedAt`, `endedAt`, `locationRef`, `notes`, `exercises[]` (`exerciseRef`, `restSeconds`, `sets[]` avec `targetReps/targetWeightKg/targetDurationSeconds/restSeconds/reps/weightKg/durationSeconds/actualRestSeconds/completedAt`), plus l'état d'exécution pour une séance en cours (`pausedAt`, `totalPausedMs`, `currentExerciseIndex`, `currentSetIndex`, `rest`, `setTimer`). Les champs d'instantané (`name`, `type`, `loadMode`, `muscleGroups`, `equipment`) sont déduits de `exerciseRef` s'ils sont absents.

## Installation

```bash
npm install
cp .env.example .env   # renseigner MONGODB_URI
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | URI MongoDB Atlas |
| `MONGODB_DB_NAME` | Base (`gympulse` par défaut) |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | Pool et client Cognito du stage (voir `custom.cognito`) |

## Développement, tests, déploiement

```bash
npm run dev               # serverless-offline (utiliser l'en-tête x-user-id: demo)
npm run test:unit
npm run test:integration  # MongoDB en mémoire
npm run deploy            # stage dev ; deploy:prod pour la prod
```

Exemple local : `curl -H 'x-user-id: demo' -X POST localhost:3000/v1/demo` puis `curl -H 'x-user-id: demo' localhost:3000/v1/catalog`.

## Pipeline CI/CD

`infra/pipeline.yml` (CodePipeline + CodeBuild : Source → Deploy Dev → approbation manuelle → Deploy Prod) et les buildspecs sont dans `infra/`. Le secret Secrets Manager attendu est `gympulse/secrets` (clés `preprod` et `prod`, chacune avec `MONGO_URI` et `DB_NAME`). Détail et commande de création du pipeline : [infra/README.md](infra/README.md).
