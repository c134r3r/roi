# NEON PostgreSQL Setup für Vercel

## Was ist NEON?

NEON ist ein **serverless PostgreSQL**-Anbieter, ideal für Vercel und andere Cloud-Platformen. Kostenlos für Entwicklung und mit Pay-as-you-go für Production.

- Website: https://neon.tech
- Perfekt für Vercel Deployments
- Automatische Backups
- SSL/TLS-Verbindungen
- Connection Pooling inklusive

## 1. NEON Projekt erstellen

### Schritt 1: Registrieren
1. Gehe zu https://neon.tech
2. Klicke "Sign up"
3. Mit GitHub verbinden (empfohlen für Vercel)

### Schritt 2: Neues Projekt erstellen
1. Dashboard → "New Project"
2. Wähle:
   - **PostgreSQL Version**: 17 (aktuell) oder 16
   - **Region**: Wähle nächst zur Vercel Region (z.B. Frankfurt, USA-Ost)
   - **Database**: `roi_calculator` (oder anderer Name)
3. Klicke "Create"

### Schritt 3: Connection String kopieren
Nach dem Erstellen siehst du die Connection Strings:

```
postgresql://neon_user:password@ep-xxx.region.neon.tech/roi_calculator?sslmode=require
```

**Wichtig:** Notiere den String mit `?sslmode=require` - das ist nötig für Vercel!

## 2. Vercel Integration

### Option A: Environment Variable über Vercel Dashboard

1. Vercel Dashboard → Projekt → Settings
2. → "Environment Variables"
3. Neue Variable hinzufügen:
   - **Name**: `DATABASE_URL`
   - **Value**: Dein NEON Connection String
   - **Environments**: Production, Preview, Development

```
postgresql://neon_user:password@ep-xxx.region.neon.tech/roi_calculator?sslmode=require
```

### Option B: Mit Vercel CLI

```bash
# Vercel CLI installieren
npm i -g vercel

# In dein Projekt-Verzeichnis
cd /path/to/roi

# Environment Variable setzen
vercel env add DATABASE_URL
# Paste dein NEON Connection String
# Select Production, Preview, Development

# Verifizieren
vercel env ls
```

## 3. Lokal mit NEON testen

### Schritt 1: .env Datei erstellen

**Datei: `packages/backend/.env`**

```env
# NEON Connection String (aus NEON Dashboard kopieren)
DATABASE_URL=postgresql://neon_user:password@ep-xxx.region.neon.tech/roi_calculator?sslmode=require

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Aktiviere PostgreSQL
USE_POSTGRES=true

NODE_ENV=development
```

### Schritt 2: Dependencies installieren

```bash
cd packages/backend
npm install
```

### Schritt 3: Server lokal starten

```bash
npm run dev
```

**Ausgabe sollte sein:**
```
🗄️ Using PostgreSQL database...
✅ Database schema initialized
📊 ROI Calculator Server running on http://localhost:3001
```

### Schritt 4: Testen

```bash
# Health Check
curl http://localhost:3001/api/health

# Stats anschauen
curl http://localhost:3001/api/stats
```

## 4. NEON Dashboard verwenden

### SQL Query ausführen

1. NEON Dashboard → SQL Editor
2. Oder nutze `psql` lokal:

```bash
# Mit SSL (für Remote NEON)
PGPASSWORD='your_password' psql \
  -h ep-xxx.region.neon.tech \
  -U neon_user \
  -d roi_calculator \
  -c "SELECT COUNT(*) FROM projects;"

# Oder einfacher mit Connection String:
psql "postgresql://neon_user:password@ep-xxx.region.neon.tech/roi_calculator?sslmode=require"

# Dann kannst du SQL ausführen:
SELECT * FROM projects;
DESCRIBE projects;
```

### Projekte anschauen

```sql
SELECT id, code, title, created_at FROM projects LIMIT 10;
```

### Cleanup durchführen

```sql
-- Projekte älter als 60 Tage löschen
DELETE FROM projects
WHERE last_accessed < NOW() - INTERVAL '60 days';
```

## 5. Vercel Deployment

### Schritt 1: Vercel konfigurieren

**Datei: `vercel.json` (im Root)**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "packages/frontend/dist",
  "env": {
    "DATABASE_URL": "@database_url"
  },
  "functions": {
    "packages/backend/src/index.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### Schritt 2: Deploy

```bash
# Mit Vercel CLI
vercel deploy --prod

# Oder einfach Git Push (wenn Vercel mit GitHub verbunden)
git push origin main
```

### Schritt 3: Verify Production

```bash
# Deine Vercel URL testen
curl https://your-project.vercel.app/api/health
curl https://your-project.vercel.app/api/stats
```

## Pricing & Kostensparen

### NEON Kostenlos:
- ✅ Bis zu 10 Projekte
- ✅ 3 GB Storage
- ✅ Kostenlose Branch-Datenbanken (für Tests)
- ✅ Automatische Backups

### Bei höherem Verbrauch:
- $0.16 pro Million Anfragen
- $0.14 pro GB Storage (über 3 GB)
- Flex-Slots ab $0.30/Std. für Auto-Scaling

**Tipp für Entwicklung:** Nutze NEON Free Tier, kostet fast nichts!

## Troubleshooting

### "Connection refused" auf Vercel

```
Error: connect ECONNREFUSED
```

**Lösungen:**
1. Überprüfe `DATABASE_URL` in Vercel Settings
2. Nutze `?sslmode=require` im Connection String
3. NEON Projekt ist nicht aktiv - prüfe NEON Dashboard

### "FATAL: password authentication failed"

```
password authentication failed
```

**Lösungen:**
1. Passwort im Connection String falsch
2. NEON User existiert nicht
3. Kopiere neuen Connection String vom NEON Dashboard

### Connection Timeout

```
error: timeout expired
```

**Lösungen:**
1. NEON Region ist zu weit weg - wähle nächste Region
2. Datenbank schläft - wärmauf mit erstem Request
3. Firewall blockiert - nutze SSL (`?sslmode=require`)

### "Database does not exist"

```
FATAL: database "roi_calculator" does not exist
```

**Lösung:**
1. Datenbank nicht erstellt im NEON Dashboard
2. Oder falscher Name im Connection String
3. Schema wird beim Start auto-erstellt, prüfe db.ts

## Best Practices

### 1. Connection Pooling nutzen
```
PostgreSQL Connection String mit `/` (für Pooling):
postgresql://user:password@pooler.host:6432/database
```

### 2. Backups automatisieren
- NEON macht täglich automatische Backups
- Export über NEON Dashboard möglich
- Oder nutze `pg_dump` mit Remote Connection

### 3. Monitoring
- NEON Dashboard zeigt Query-Performance
- Vercel Logs zeigen Fehler
- Kombinieren für Debugging

### 4. Sicherheit
- **Niemals** DATABASE_URL in Code committen
- **Nur** in `.env` (lokal) und Vercel Secrets
- Nutze `?sslmode=require` immer

## Weitere Ressourcen

- NEON Doku: https://neon.tech/docs
- PostgreSQL SSL: https://www.postgresql.org/docs/current/ssl-intro.html
- Vercel Environment Vars: https://vercel.com/docs/concepts/projects/environment-variables
- Debugging Guide: https://neon.tech/docs/guides/troubleshooting

## Checkliste für NEON + Vercel

- [ ] NEON Account erstellt
- [ ] Database `roi_calculator` erstellt
- [ ] Connection String mit `?sslmode=require` kopiert
- [ ] DATABASE_URL in Vercel hinzugefügt
- [ ] `.env` lokal konfiguriert
- [ ] Schema auto-erstellt (Server startet)
- [ ] Health Check funktioniert
- [ ] Vercel Deployment erfolgreich
- [ ] Production API antwortet

**Fertig!** Dein ROI Calculator nutzt nun zentrale NEON PostgreSQL! 🚀
