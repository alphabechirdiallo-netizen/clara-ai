# Déploiement Clara AI sur Netlify

## Ton site est déjà créé : https://clara-ai-app.netlify.app

## Variables d'environnement déjà configurées sur Netlify ✅
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- GROQ_API_KEY
- NEXT_PUBLIC_APP_URL

## Base de données Supabase déjà initialisée ✅
- 12 tables créées avec RLS
- Triggers automatiques
- Indexes de performance

## Option 1 — Déployer via GitHub (Recommandé)

1. Crée un repo GitHub (ex: `clara-ai`)
2. Push le code :
   ```bash
   git init
   git add .
   git commit -m "Clara AI - Initial deploy"
   git remote add origin https://github.com/TON_USER/clara-ai.git
   git push -u origin main
   ```
3. Va sur [Netlify](https://app.netlify.com/projects/clara-ai-app)
4. Clique **"Link to Git"** → sélectionne ton repo GitHub
5. Netlify détecte automatiquement Next.js et déploie

## Option 2 — Déployer via Netlify CLI

```bash
# Installe la CLI
npm install -g netlify-cli

# Connecte-toi
netlify login

# Déploie
netlify deploy --prod --dir=.next --site=6acba2ac-1ea4-4a86-bfcb-86f33a6c4a90
```

## Option 3 — Drag & Drop

1. Lance `npm run build`
2. Va sur https://app.netlify.com/projects/clara-ai-app
3. Glisse le dossier `.next` dans l'interface Netlify

## Dernière étape — Service Role Key Supabase

Pour activer les fonctionnalités admin (optionnel) :
1. Va sur https://supabase.com/dashboard/project/zhbyfdvmnjuwadiiynvu/settings/api
2. Copie la **service_role** key
3. Ajoute-la sur Netlify : SUPABASE_SERVICE_ROLE_KEY

## URL finale : https://clara-ai-app.netlify.app
