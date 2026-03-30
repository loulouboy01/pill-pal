# Clarimed

Clarimed est une application pensée pour simplifier le suivi médical au quotidien. Elle permet de garder une trace de ses médicaments, de scanner une ordonnance pour l'importer automatiquement, et d'enregistrer ses consultations chez le médecin pour en obtenir un compte-rendu structuré.

L'objectif est simple : ne plus jamais oublier un médicament, une posologie, ou ce que le médecin a dit.

Vous pouvez tester l'application sur www.clarimed.boyot.eu
---

## Ce que fait l'application

### Mes médicaments
Ajoutez vos médicaments manuellement ou en scannant directement une ordonnance. Clarimed extrait automatiquement le nom, le dosage, la forme et la posologie. Chaque médicament est consultable en détail avec sa notice officielle.

### Scanner une ordonnance
Prenez en photo votre ordonnance — l'IA analyse l'image et importe les médicaments en quelques secondes. Vous pouvez ensuite vérifier et corriger les informations avant de les enregistrer.

### Consulter chez le médecin
Enregistrez votre consultation en direct. L'application transcrit la conversation en temps réel, puis génère un compte-rendu médical structuré : diagnostic, traitements prescrits, examens à faire, prochain rendez-vous.

### Chatbot IA
Posez des questions sur un médicament ou sur une consultation directement depuis l'application. L'IA répond en tenant compte du contexte de votre dossier.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | TailwindCSS + Shadcn/ui |
| Backend | Supabase Edge Functions (Deno) |
| Base de données médicaments | API BDPM (base française officielle) |
| Transcription audio | OpenAI Whisper |
| Analyse IA | Anthropic Claude |
| Stockage données | localStorage (client) | Pas de base de données ou de compte client 

## Edge Functions Supabase

| Fonction | Rôle |
|---|---|
| `analyze-prescription` | Extraction des médicaments depuis une image d'ordonnance |
| `search-medicament` | Recherche dans la base BDPM française |
| `get-notice` / `fetch-notice` | Récupération des notices officielles |
| `transcribe-audio` | Transcription audio via Whisper |
| `generate-consultation-report` | Génération du compte-rendu médical |
| `generate-medication-report` | Rapport détaillé d'un médicament |
| `chat-medicament` | Chatbot IA sur un médicament |
| `chat-consultation` | Chatbot IA sur une consultation |

---

## Installation

### Prérequis

- Node.js 20+
- Compte [Supabase](https://supabase.com)
- Clé API [Anthropic](https://console.anthropic.com)
- Clé API [OpenAI](https://platform.openai.com)

### Configuration

Créez un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

Les clés API OpenAI et Anthropic sont à configurer dans les secrets Supabase :

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### Lancement en développement

```bash
npm install
npm run dev
```

### Déploiement des Edge Functions

```bash
supabase link --project-ref <project-ref>
supabase functions deploy --all
```

## Hébergement sur Docker

Un Dockerfile multi-stage est fourni pour l'auto-hébergement.

```bash
docker buildx build --platform linux/amd64 \
  --build-arg VITE_SUPABASE_PROJECT_ID=... \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=... \
  --build-arg VITE_SUPABASE_URL=... \
  -t clarimed .

docker run -d -p 3333:80 --restart unless-stopped --name clarimed clarimed
```

L'app est accessible sur `http://localhost:3333`.

## Branches

| Branche | Description |
|---|---|
| `main` | Code de production |
| `v-nas` | Configuration Docker / NAS |
| `v_mobile` | Version iOS (Capacitor) |
