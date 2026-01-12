# Same-Origin Deployment auf Vercel

**Eine URL, ein Vercel-Projekt, kein CORS!**

## 🎯 Architektur

```
https://your-app.vercel.app/
├── /                    → Frontend (React)
├── /api/*              → Backend API (Serverless Function)
└── Database            → NEON PostgreSQL
```

**Vorteile:**
- ✅ Keine CORS-Fehler
- ✅ Ein Vercel-Projekt
- ✅ Einfach zu deployen
- ✅ Production-ready

---

## 🚀 Schritt 1: Vercel Projekt erstellen

1. Gehe zu **https://vercel.com**
2. Klick auf **"Add New"** → **"Project"**
3. Verbinde dein GitHub-Repository
4. **Framework:** Node.js
5. **Root Directory:** Leer lassen (Monorepo)
6. Klick **"Deploy"**

**Warte bis Status grün ist** ✅

---

## 🔧 Schritt 2: Environment Variables setzen

Im Vercel Dashboard auf deinem Projekt:

1. Klick auf **"Settings"** (oben)
2. Klick auf **"Environment Variables"** (links)
3. Füge folgende Variable hinzu:

```
DATABASE_URLROI = postgresql://user:password@...neon.tech/...
```

**Die Variable-Namen müssen EXAKT so heißen!**

4. Wähle: **"Production, Preview, Development"**
5. Klick **"Save"**

---

## 📝 Schritt 3: Automatisches Re-Deploy

Nach dem Setzen der Environment Variables:

1. Gehe zu **"Deployments"**
2. Klick auf das älteste Deployment (meist rot "Failed")
3. Klick auf **"Redeploy"** Button oben rechts
4. Wähle **"Yes, redeploy"**

**Warte bis Status grün ist** ✅

---

## ✅ Schritt 4: Testen

### 4.1 Frontend öffnen
```
https://your-app-xyz.vercel.app/
```

### 4.2 Browser Console checken (F12)
Du solltest sehen:
```
[ApiClient] Using API URL: /api
```

### 4.3 Neues Projekt erstellen
1. Fülle das Formular aus
2. Klick **"Weiter zu Kosten"**
3. Im Console Tab (F12) solltest du sehen:
```
✅ [API] POST /api/projects
✅ [API] Project created: ABC123DEF456
```

**Wenn das erscheint → Alles funktioniert! 🎉**

---

## 🆘 Fehlerbehandlung

### Fehler: "GET /api/projects 404"
**Problem:** Vercel hat das Backend nicht gebaut

**Lösung:**
1. Deployments → Klick auf rotes X-Deployment
2. Schaue unter **"Runtime logs"** nach Fehlern
3. Häufig: Node-Module nicht installiert
4. Lösung: Repository neu pushen

### Fehler: "Database connection failed"
**Problem:** DATABASE_URLROI ist falsch oder nicht gesetzt

**Lösung:**
1. Settings → Environment Variables
2. Überprüfe: DATABASE_URLROI ist wirklich gesetzt
3. Kopiere die Connection String von NEON Dashboard
4. Settings → Redeploy

### Fehler: "Cannot read property 'db' of undefined"
**Problem:** Backend wird nicht richtig geladen

**Lösung:**
1. api/index.ts wurde nicht korrekt deployed
2. Deployments → Klick auf grünes Deployment
3. Schaue unter "Runtime logs" nach TypeScript-Fehlern
4. Behebe die Fehler lokal und push wieder

---

## 📊 URLs nach dem Deploy

| Komponente | URL |
|-----------|-----|
| **Frontend** | `https://your-app-xyz.vercel.app/` |
| **API** | `https://your-app-xyz.vercel.app/api/projects` |
| **Database** | NEON (nicht direkt erreichbar) |

---

## 🔐 Sicherheit

✅ Alles automatisch mit HTTPS
✅ Environment Variables sind Secrets (nicht sichtbar)
✅ Backend läuft in Serverless Function (isoliert)
✅ Datenbank nur über Backend erreichbar

---

## 📈 Performance

- Frontend: ⚡ Ultra-schnell (CDN)
- Backend: 🚀 Serverless (Scale bei Bedarf)
- Database: 🗄️ NEON (Serverless PostgreSQL)

---

## 💡 Lokale Entwicklung

Während der Entwicklung (lokal):

```bash
npm run dev
```

Das startet:
- Frontend auf `http://localhost:5173`
- Backend auf `http://localhost:3001`
- Automatischer Proxy `/api` → `http://localhost:3001/api`

**Keine Änderungen nötig!** Der Code funktioniert lokal und in der Cloud gleich.

---

## 🔄 Updates deployen

Dein Code ist automatisch mit GitHub verbunden:

1. Mache Änderungen lokal
2. `git push` zum Repository
3. Vercel baut und deployed automatisch
4. ~3-5 Minuten später live

**Kein weiteres Setup nötig!**

---

## 📞 Support

### Logs debuggen
1. Vercel Dashboard → Deployments
2. Klick auf Deployment
3. **"Runtime logs"** Tab (unten)
4. Suchst du nach `[API]` oder Fehlern

### Environment Variablen checken
1. Settings → Environment Variables
2. Alle Variablen sollten dort sichtbar sein
3. Keine Geheimnisse in Code!

---

**Done! Deine ROI-Calculator App läuft jetzt in der Cloud! 🚀**
