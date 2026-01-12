# Cloud Deployment Guide - ROI Calculator mit NEON

Dieses Projekt ist optimiert für Cloud-Deployment ohne lokales Backend-Hosting.

## 🏗️ Architektur

```
Frontend (Vercel)  →  Backend API (Vercel)  →  NEON PostgreSQL
```

## 🚀 Deployment auf Vercel

### 1. Vercel Projekte erstellen

```bash
# Backend deployen
cd packages/backend
vercel deploy --prod

# Frontend deployen
cd packages/frontend
vercel deploy --prod
```

### 2. Environment Variables setzen

#### Backend (Vercel)
```
DATABASE_URLROI=postgresql://...  # Von NEON (postgres://...)
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

#### Frontend (Vercel)
```
VITE_API_URL=https://your-backend-domain.vercel.app
```

### 3. Automatisches URL-Detection

Das Frontend erkennt die API automatisch:

1. **VITE_API_URL** Environment Variable (wenn gesetzt)
2. **Relative /api Path** (wenn Frontend und Backend auf gleicher Domain)
3. **Localhost:3001** (nur für lokale Entwicklung)

## 🔧 Alternative: Same-Origin Deployment

Wenn Frontend und Backend auf der **gleichen Domain** deployed sind (z.B. Monorepo):

```
Frontend: https://yourapp.vercel.app/
Backend:  https://yourapp.vercel.app/api/
```

**Vorteil:** Keine CORS-Probleme, keine separaten URLs nötig.

## 📝 .env.production

```bash
# Backend
DATABASE_URLROI="postgresql://user:password@host/database"
CORS_ORIGIN="https://your-frontend-domain.vercel.app"
USE_POSTGRES=true

# Frontend
VITE_API_URL="https://your-backend-domain.vercel.app"
```

## ✅ Testing

Nach dem Deployment:

1. Öffne Frontend: `https://your-frontend-domain.vercel.app`
2. Öffne Browser Console (F12)
3. Schaue auf "Network" Tab
4. Erstelle ein neues Projekt
5. Überprüfe: `POST https://your-api-domain.vercel.app/api/projects`

**Erwartete Logs:**
```
[ApiClient] Using __API_URL__ from Vite: https://...
[API] POST https://your-api-domain.vercel.app/api/projects
[API] Project created: ABC123DEF456
```

## 🛠️ Troubleshooting

### Fehler: "Fetch API cannot load"
- Überprüfe: `CORS_ORIGIN` Backend env variable
- Stelle sicher: `VITE_API_URL` im Frontend gesetzt ist

### Fehler: "CORS rejected origin"
- Backend-Log: `⚠️ CORS rejected origin: https://...`
- Lösung: `CORS_ORIGIN` im Backend anpassen

### Fehler: "Project not found" nach Create
- Überprüfe: `DATABASE_URLROI` zeigt auf NEON
- Überprüfe: Backend lädt PostgreSQL-Adapter

## 🔐 Sicherheit

- ✅ Passphrase über X-Passphrase Header (nicht in URL)
- ✅ HTTPS auf allen Domains
- ✅ CORS eingeschränkt auf erlaubte Domains
- ✅ bcryptjs für Passwort-Hashing
- ⚠️ Datenbank-Verschlüsselung: TODO (siehe DSGVO-Anforderungen)

## 📦 Docker Alternative (wenn nicht Vercel)

```dockerfile
# Backend
FROM node:18
WORKDIR /app
COPY packages/backend .
RUN npm install
EXPOSE 3001
CMD ["node", "dist/src/index.js"]

# Frontend
FROM node:18 as builder
WORKDIR /app
COPY packages/frontend .
ENV VITE_API_URL=https://api.example.com
RUN npm install && npm run build

FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 🌐 Domain Setup

Wenn separate Domains:

**Frontend:** `app.example.com` → Vercel
**Backend:** `api.example.com` → Vercel
**Database:** `neon.tech` (NEON)

Environment Variables:
```
Frontend:  VITE_API_URL=https://api.example.com
Backend:   CORS_ORIGIN=https://app.example.com
```

---

**Wichtig:** Nutze keinen localhost für Production! Nutze Cloud-Deployment mit NEON!
