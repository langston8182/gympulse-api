# CI/CD - Pipeline AWS (CodePipeline + CodeBuild)

Pipeline : **Source (GitHub)** → **Deploy Dev** (tests + `serverless deploy --stage dev`) → **Approbation manuelle** → **Deploy Prod** (tests + `serverless deploy --stage prod`).

## 1. Créer la connexion GitHub (CodeStar Connection) — une seule fois

```bash
aws codestar-connections create-connection \
  --provider-type GitHub \
  --connection-name gympulse-api-github \
  --region eu-west-3
```

Récupère le `ConnectionArn` retourné, puis va dans la console AWS :
**Developer Tools > Settings > Connections** → clique sur la connexion (statut `Pending`) → **Update pending connection** → autorise l'accès à GitHub (installation de l'app AWS Connector for GitHub sur `langston8182/gympulse-api`). Le statut doit passer à `Available`.

> Cette étape manuelle (clic dans la console) est obligatoire : AWS ne peut pas authentifier GitHub en CLI pur.

## 2. Secret Secrets Manager (déjà créé)

Le secret `gympulse/secrets` contient déjà les deux environnements :

```json
{
  "preprod": { "MONGO_URI": "...", "DB_NAME": "gympulse" },
  "prod": { "MONGO_URI": "...", "DB_NAME": "gympulse" }
}
```

Le stage `dev` du pipeline lit la clé `preprod`, le stage `prod` lit la clé `prod`.
Chaque build récupère le secret via `aws secretsmanager get-secret-value` et exporte
`MONGODB_URI` / `MONGODB_DB_NAME` avant `serverless deploy` (voir `buildspec-dev.yml` /
`buildspec-prod.yml`).

## 3. Déployer le pipeline (CloudFormation)

```bash
aws cloudformation deploy \
  --template-file infra/pipeline.yml \
  --stack-name gympulse-api-pipeline \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-3 \
  --parameter-overrides \
      CodeStarConnectionArn=<ARN_DE_LA_CONNEXION> \
      GitHubOwner=langston8182 \
      GitHubRepo=gympulse-api \
      GitHubBranch=main \
      SecretsManagerSecretName=gympulse/secrets \
      SecretsManagerSecretArn=arn:aws:secretsmanager:eu-west-3:489767271637:secret:gympulse/secrets-<suffixe>
```

## 4. Déclenchement

Chaque `git push` sur `main` déclenche automatiquement : build + tests + déploiement `dev`. Le pipeline s'arrête ensuite sur l'étape d'approbation manuelle (visible dans la console CodePipeline) avant de déployer en `prod`.

## Fichiers

- `infra/pipeline.yml` — Stack CloudFormation (CodePipeline, CodeBuild, rôles IAM, bucket d'artefacts).
- `infra/buildspec-dev.yml` — Build + tests (unit + intégration) + `serverless deploy --stage dev`.
- `infra/buildspec-prod.yml` — Build + tests unitaires + `serverless deploy --stage prod`.

## Mise à jour du pipeline

Si tu modifies `infra/pipeline.yml`, relance la commande `aws cloudformation deploy` de l'étape 3 pour appliquer les changements (pas besoin de recréer la stack).
