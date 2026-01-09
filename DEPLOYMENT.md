# Vercel Deployment Guide

## Overview

Das Projekt ist ein **Monorepo** mit zwei separaten Deployments:

- **Frontend** (React/Vite) → **Vercel** ✅
- **Backend** (Express/Node.js) → Separater Service erforderlich (Railway, Render, Heroku, etc.)

## Frontend Deployment (Vercel)

### Automatische Konfiguration

Vercel wird automatisch mit `vercel.json` konfiguriert:

```json
{
  "buildCommand": "npm --prefix packages/shared run build && npm --prefix packages/frontend run build",
  "installCommand": "npm install && npm --prefix packages/shared install && npm --prefix packages/backend install && npm --prefix packages/frontend install",
  "outputDirectory": "packages/frontend/dist"
}
```

### Deployment Steps

1. **Repository verbinden**
   - Gehe zu [vercel.com](https://vercel.com)
   - Klicke "New Project"
   - Wähle dein Git-Repository aus
   - Vercel erkennt automatisch die Monorepo-Struktur

2. **Environment Variablen konfigurieren**

   In Vercel Project Settings → Environment Variables:

   ```
   VITE_API_URL=https://your-backend-url.com
   ```

   **Beispiele:**
   - `https://roi-backend.railway.app` (Railway)
   - `https://roi-backend.render.com` (Render)
   - `https://roi-backend.herokuapp.com` (Heroku)

3. **Deploy triggern**
   - Push zu Branch `claude/roi-calculator-5vmrJ`
   - Vercel deployed automatisch
   - Production-URL wird nach dem Build angezeigt

## Backend Deployment (Separater Service)

Der Backend **läuft nicht auf Vercel**. Du brauchst einen separaten Host:

### Option 1: Railway.app (Empfohlen)

```bash
# 1. Railway CLI installieren
npm i -g @railway/cli

# 2. Anmelden
railway login

# 3. Neues Projekt erstellen
railway init

# 4. Umgebungsvariablen setzen
railway variable add PORT=3001
railway variable add NODE_ENV=production

# 5. Deploy
railway up
```

### Option 2: Render.com

1. Gehe zu [render.com](https://render.com)
2. Klicke "New +" → "Web Service"
3. Wähle dein Git-Repository
4. Konfiguration:
   - **Build Command**: `npm --prefix packages/backend run build`
   - **Start Command**: `npm --prefix packages/backend run start`
   - **Root Directory**: `packages/backend`
5. Deploy

### Option 3: Heroku (Legacy, nicht empfohlen)

```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

## Environment Variables

### Development (localhost)

```bash
# Terminal 1
cd packages/backend
npm run dev
# Läuft auf http://localhost:3001

# Terminal 2
cd packages/frontend
npm run dev
# Läuft auf http://localhost:5173
# Proxy zu localhost:3001 auto-configured
```

### Production (Vercel + External Backend)

**Vercel Project Settings:**

```
VITE_API_URL=https://your-backend-domain.com
```

Beim Build wird diese Variable injiziert und der API-Client nutzt sie für alle Requests.

## Testing des Deployments

### Lokal testen (Production Build)

```bash
# Backend starten
cd packages/backend
npm run start  # Production build

# Frontend bauen
cd packages/frontend
npm run build
npm run preview
```

### Vercel Preview Deployment

Jeder Push zu einem Feature-Branch erzeugt eine Preview-URL:
- Gehe zu deinem Vercel Project
- Klicke auf einen Deployment
- Klicke "Visit Preview"

## Troubleshooting

### ❌ Error: "tsc: command not found"

**Lösung:** `vercel.json` Datei überprüfen:
```json
{
  "installCommand": "npm install && npm --prefix packages/shared install && npm --prefix packages/backend install && npm --prefix packages/frontend install",
  "buildCommand": "npm --prefix packages/shared run build && npm --prefix packages/frontend run build"
}
```

### ❌ API Calls schlagen fehl (404)

**Ursache:** `VITE_API_URL` nicht gesetzt oder falsch

**Lösung:**
1. Vercel Project Settings öffnen
2. "Environment Variables" klicken
3. `VITE_API_URL` hinzufügen
4. Neuen Build triggern

```bash
# Oder über CLI
vercel env add VITE_API_URL https://your-backend-url.com
```

### ❌ CORS Errors

**Ursache:** Backend CORS nicht konfiguriert

**Lösung:** In `packages/backend/src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
```

Setze Backend Environment Variable:
```
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

## Monitoring & Logs

### Vercel Logs

```bash
# CLI Logs anschauen
vercel logs --follow

# Oder in Vercel Dashboard:
# Project → Deployments → Details → Logs
```

### Backend Logs

Abhängig vom Service:
- **Railway**: Gehe zu Project → Logs
- **Render**: Gehe zu Service → Logs
- **Heroku**: `heroku logs --tail`

## Sicherheit

### Secrets Management

**Niemals commiten:**
```
.env
.env.local
.env.*.local
node_modules/
```

Diese sind bereits in `.gitignore`.

**Secrets in Vercel:**
- Gehe zu Project Settings → Environment Variables
- Nutze `VERCEL_ENV_ENCRYPT_` Prefix für sensitive Daten
- Niemals Secrets in Code hardcoden

## Production Checklist

- [ ] Backend deployed und läuft
- [ ] `VITE_API_URL` in Vercel gesetzt
- [ ] CORS konfiguriert (Backend + Frontend Domain)
- [ ] Environment Variablen alle gesetzt
- [ ] Keine Secrets committed
- [ ] Frontend Build erfolgreich
- [ ] API Calls funktionieren
- [ ] Datenbank gesichert (wenn nicht in-memory)

## Nächste Schritte

1. **Backend Host wählen** (Railway, Render, Heroku)
2. **Backend deployen**
3. **`VITE_API_URL` in Vercel setzen**
4. **Frontend deployen**
5. **Testen und Monitoring einrichten**

## Weitere Ressourcen

- [Vercel Docs](https://vercel.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
