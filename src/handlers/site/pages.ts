import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/** Pages publiques exigées par Google (écran de consentement) et Google Play. Contenu statique, sans base de données. */

const CONTACT = 'cyril.marchive@gmail.com';
const UPDATED = '6 novembre 2026';

function page(title: string, body: string): APIGatewayProxyStructuredResultV2 {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · GymPulse</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 760px; margin: 0 auto; padding: 24px 20px 64px; }
  h1 { font-size: 1.9rem; margin-bottom: .25rem; }
  h2 { font-size: 1.2rem; margin-top: 2rem; }
  nav a { margin-right: 14px; }
  .muted { opacity: .7; font-size: .9rem; }
  a { color: #2f7d00; }
  @media (prefers-color-scheme: dark) { a { color: #c8f23a; } }
</style>
</head>
<body>
<nav><a href="/">GymPulse</a><a href="/confidentialite">Confidentialité</a><a href="/conditions">Conditions</a><a href="/suppression-compte">Supprimer mon compte</a></nav>
<h1>${title}</h1>
${body}
<p class="muted">Dernière mise à jour : ${UPDATED}.</p>
</body>
</html>`;
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    body: html,
  };
}

export const home = async () =>
  page(
    'GymPulse',
    `<p>GymPulse est une application Android de suivi de musculation : composez vos séances et vos programmes, lancez une séance avec minuteur de repos automatique, et suivez votre progression (volume, records, historique).</p>
<ul>
  <li>Séances et programmes personnalisables, bibliothèque d'exercices.</li>
  <li>Mode séance pensé pour la salle, avec repos automatique.</li>
  <li>Suggestion de séance selon votre lieu d'entraînement.</li>
  <li>Synchronisation de vos données entre vos appareils grâce à votre compte Google.</li>
</ul>
<p>Contact : <a href="mailto:${CONTACT}">${CONTACT}</a></p>
<p><a href="/confidentialite">Politique de confidentialité</a> · <a href="/conditions">Conditions d'utilisation</a> · <a href="/suppression-compte">Supprimer mon compte</a></p>`,
  );

export const privacy = async () =>
  page(
    'Politique de confidentialité',
    `<p>Cette politique explique quelles données l'application Android GymPulse collecte, pourquoi, et comment les supprimer.</p>

<h2>Données collectées</h2>
<ul>
  <li><strong>Compte</strong> : en vous connectant avec Google, nous recevons votre adresse e-mail, votre prénom et un identifiant de compte. Nous ne recevons jamais votre mot de passe Google.</li>
  <li><strong>Vos contenus</strong> : vos exercices, séances, programmes, lieux d'entraînement (nom, adresse facultative, coordonnées, rayon, matériel), l'historique de vos séances et vos préférences.</li>
  <li><strong>Position</strong> : avec votre autorisation, la position de l'appareil sert à reconnaître votre lieu d'entraînement. Elle est lue ponctuellement sur l'appareil, sans suivi en arrière-plan, et <em>n'est pas envoyée</em> à nos serveurs. Seules les coordonnées des lieux que vous enregistrez sont conservées.</li>
  <li><strong>Photos d'exercices</strong> : elles restent sur votre téléphone et ne sont pas envoyées.</li>
</ul>

<h2>Pourquoi ces données</h2>
<p>Pour faire fonctionner l'application (affichage de vos séances, statistiques, suggestions selon le lieu) et pour les synchroniser entre vos appareils. Nous ne les utilisons ni pour de la publicité ni pour du profilage, et nous ne les vendons pas.</p>

<h2>Hébergement et prestataires</h2>
<ul>
  <li>Authentification : Amazon Cognito (AWS), avec Google comme fournisseur de connexion.</li>
  <li>API et traitement : AWS (région Europe, Paris).</li>
  <li>Base de données : MongoDB Atlas.</li>
  <li>Carte des lieux : fonds de carte OpenStreetMap, chargés depuis openstreetmap.org uniquement lorsque vous ouvrez l'écran d'édition d'un lieu (votre adresse IP et la zone affichée leur sont alors transmises).</li>
</ul>
<p>Ces prestataires traitent les données pour notre compte uniquement.</p>

<h2>Conservation et suppression</h2>
<p>Vos données sont conservées tant que votre compte existe. Vous pouvez supprimer définitivement votre compte et toutes vos données depuis l'application (<em>Réglages → Compte → Supprimer mon compte</em>), ou via la page <a href="/suppression-compte">Supprimer mon compte</a>. La suppression est immédiate et irréversible.</p>

<h2>Vos droits</h2>
<p>Vous pouvez demander l'accès à vos données, leur rectification ou leur suppression en écrivant à <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>

<h2>Sécurité</h2>
<p>Les échanges avec le serveur sont chiffrés (HTTPS). Les jetons de connexion sont stockés chiffrés sur l'appareil.</p>

<h2>Contact</h2>
<p><a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
  );

export const terms = async () =>
  page(
    "Conditions d'utilisation",
    `<p>En utilisant GymPulse, vous acceptez les conditions suivantes.</p>

<h2>Service</h2>
<p>GymPulse est un outil de suivi d'entraînement, fourni gratuitement « en l'état ». Nous nous efforçons de le maintenir disponible mais ne garantissons pas l'absence d'interruption ou d'erreur.</p>

<h2>Santé et sécurité</h2>
<p>Les suggestions et statistiques de l'application sont informatives et ne remplacent pas l'avis d'un professionnel de santé ou d'un coach. Vous vous entraînez sous votre propre responsabilité ; consultez un médecin en cas de doute.</p>

<h2>Compte</h2>
<p>Vous êtes responsable de l'accès à votre compte Google. Vous pouvez supprimer votre compte à tout moment (voir <a href="/suppression-compte">Supprimer mon compte</a>).</p>

<h2>Utilisation acceptable</h2>
<p>Il est interdit d'utiliser le service pour perturber son fonctionnement, accéder aux données d'autres utilisateurs ou en abuser.</p>

<h2>Responsabilité</h2>
<p>Dans la limite permise par la loi, nous ne sommes pas responsables des pertes de données ou des dommages indirects liés à l'utilisation de l'application. Pensez à ne conserver aucune information vitale uniquement dans l'application.</p>

<h2>Évolution</h2>
<p>Ces conditions peuvent évoluer ; la date de dernière mise à jour figure en bas de page.</p>

<h2>Contact</h2>
<p><a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
  );

export const deleteAccount = async () =>
  page(
    'Supprimer mon compte',
    `<p>Vous pouvez supprimer votre compte GymPulse et toutes les données associées.</p>

<h2>Depuis l'application (recommandé)</h2>
<ol>
  <li>Ouvrez GymPulse, puis <em>Profil → Réglages</em>.</li>
  <li>Dans la section <em>Compte</em>, touchez <strong>Supprimer mon compte</strong> et confirmez.</li>
</ol>
<p>Vos exercices, séances, programmes, lieux, historique et préférences sont effacés définitivement du serveur, ainsi que votre compte de connexion. Cette action est irréversible.</p>

<h2>Sans l'application</h2>
<p>Si vous n'avez plus accès à l'application, écrivez à <a href="mailto:${CONTACT}?subject=Suppression%20de%20mon%20compte%20GymPulse">${CONTACT}</a> depuis l'adresse e-mail de votre compte Google. Nous supprimons le compte et les données associées dans un délai de 30 jours maximum.</p>

<h2>Données concernées</h2>
<p>Adresse e-mail et prénom du compte, exercices, séances, programmes, lieux, historique des séances et préférences. Aucune donnée n'est conservée après la suppression, hors sauvegardes techniques qui expirent automatiquement.</p>`,
  );
