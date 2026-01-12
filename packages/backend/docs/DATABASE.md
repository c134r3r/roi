# Datenbankdokumentation für ROI Calculator

## Übersicht

Der ROI Calculator unterstützt **drei Datenbankoptionen**:

| Typ | Einsatzbereich | Datenpersistenz | Setup |
|-----|-----------------|-----------------|-------|
| **In-Memory** | 💻 Lokal Entwicklung | ❌ Session-basiert | ✅ Keine Config nötig |
| **PostgreSQL** | 🏠 Selbst gehostete Server | ✅ Persistent | ⚙️ Lokal installieren |
| **NEON** | ☁️ Vercel + Cloud | ✅ Persistent + Serverless | 🚀 Beste Option |

## 1. Schnelleinstieg

### Scenario A: Lokal entwickeln (In-Memory)
```bash
# Keine Konfiguration nötig!
npm run dev
# Server startet mit In-Memory Database
```

### Scenario B: Auf Vercel mit NEON
1. Account auf https://neon.tech erstellen
2. Database erstellen → Connection String kopieren
3. In Vercel: Settings → Environment Variables → `DATABASE_URLROI` setzen
4. Code push → automatisches Deployment

**→ Siehe: `docs/NEON_SETUP.md` für detaillierte Anleitung**

### Scenario C: Lokale PostgreSQL
1. PostgreSQL installieren
2. Database `roi_calculator` erstellen
3. `.env` mit `DATABASE_URLROI` konfigurieren
4. `npm run dev`

**→ Siehe: `docs/POSTGRESQL_SETUP.md` für detaillierte Anleitung**

## 2. Datenbankauswahl

### Automatische Auswahl

Das System wählt automatisch:

```typescript
// In packages/backend/src/index.ts
const usePostgres = process.env.USE_POSTGRES === 'true' || !!process.env.DATABASE_URLROI;

if (usePostgres && process.env.DATABASE_URLROI) {
  db = new PostgreSQLDatabase();  // ← PostgreSQL wenn DATABASE_URLROI gesetzt
} else {
  db = new InMemoryDatabase();     // ← In-Memory default
}
```

**Praktisch:** Einfach nur `DATABASE_URLROI` setzen, alles andere funktioniert automagisch!

## 3. Connection Strings

### PostgreSQL lokal
```
postgresql://postgres:password@localhost:5432/roi_calculator
postgresql://roi_user:password@localhost/roi_calculator
```

### NEON (für Vercel)
```
postgresql://neon_user:password@ep-xxx.region.neon.tech/roi_calculator?sslmode=require
```

**Wichtig:** `?sslmode=require` ist für NEON und Cloud-Umgebungen erforderlich!

### Connection Pool (pgBouncer)
```
postgresql://roi_user:password@pooler.example.com:6432/roi_calculator
```

## 4. Environment Variables

```env
# Erforderlich für PostgreSQL
DATABASE_URLROI=postgresql://user:pass@host:5432/roi_calculator

# Optional
USE_POSTGRES=true          # Explizit PostgreSQL erzwingen
PORT=3001                  # Server-Port
CORS_ORIGIN=http://localhost:5173  # Frontend URL
NODE_ENV=development       # oder: production
```

## 5. Schema & Datenstruktur

### Tabelle: projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  code VARCHAR(12) UNIQUE,         -- Projekt-Sharing Code (z.B. "A3F5B8C2D1E7")
  passphrase_hash VARCHAR(255),    -- bcrypt-gehashte Passphrase
  title VARCHAR(200),              -- Projektname
  description TEXT,                -- Projektbeschreibung
  created_at TIMESTAMP,            -- Erstellungsdatum
  updated_at TIMESTAMP,            -- Zuletzt aktualisiert
  last_accessed TIMESTAMP,         -- Für Cleanup
  data JSONB                       -- Vollständige Projektdaten
);

-- Indizes für Performance
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_last_accessed ON projects(last_accessed);
```

### Beispiel-Daten in data JSONB

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "A3F5B8C2D1E7",
  "title": "Salesforce Migration 2024",
  "description": "ROI analysis for CRM migration",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-18T14:22:00Z",
  "settings": {
    "currency": "EUR",
    "horizon": 5,
    "discountRate": 0.08,
    "baseCurrency": "EUR"
  },
  "investments": [
    {
      "id": "inv-1",
      "name": "Salesforce CRM",
      "status": "FINALIZED",
      "costs": [...],
      "benefits": [...],
      "scenarios": [...],
      "computedKPIs": {
        "roi": 245.5,
        "npv": 125000,
        "irr": 0.34,
        ...
      }
    }
  ],
  "versions": []
}
```

## 6. API Endpoints

### Projekt erstellen
```http
POST /api/projects
Content-Type: application/json

{
  "title": "My Project",
  "description": "...",
  "settings": {
    "currency": "EUR",
    "horizon": 5,
    "discountRate": 0.08,
    "baseCurrency": "EUR"
  },
  "passphrase": "optional-secret"  // Optional
}

→ Response: { "success": true, "data": { "id": "...", "code": "A3F5..." } }
```

### Projekt laden
```http
GET /api/projects/A3F5B8C2D1E7
GET /api/projects/A3F5B8C2D1E7?passphrase=secret

→ Response: { "success": true, "data": { ...full project... } }
```

### Projekt aktualisieren
```http
PUT /api/projects/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "investments": [...],
  "settings": {...}
}

→ Response: { "success": true, "data": { ...updated project... } }
```

### Stats anschauen
```http
GET /api/stats

→ Response: { "totalProjects": 42, "totalCodes": 42 }
```

## 7. Sicherheitsfeatures

### ✅ Passwort-Hashing
- bcrypt mit 10 Salt Rounds
- Passphrases werden NIE im Klartext gespeichert oder zurückgegeben
- Sichere Verifikation mit bcryptjs.compare()

### ✅ SQL Injection Protection
- Prepared Statements (PostgreSQL)
- Parametrisierte Queries
- Type-safe Eingabe-Validierung mit Zod

### ✅ SSL/TLS
- Für Remote-Datenbanken: `?sslmode=require` in Connection String
- NEON erzwingt SSL automatisch

### ✅ Rate Limiting
- Express Middleware möglich (nicht implementiert, optional)
- Vercel edge middleware kann hinzugefügt werden

## 8. Datensicherung & Cleanup

### Automatischer Cleanup
```typescript
// Projekte älter als 60 Tage werden gelöscht
await db.cleanupExpiredProjects(60);
```

### Manuelle Sicherung (PostgreSQL)
```bash
# Vollständiger Export
pg_dump postgresql://user:pass@host/roi_calculator > backup.sql

# Mit Komprimierung
pg_dump postgresql://user:pass@host/roi_calculator | gzip > backup.sql.gz

# Restore
psql postgresql://user:pass@host/roi_calculator < backup.sql
```

### NEON Backups
- Automatische tägliche Backups
- NEON Dashboard → Branch Backups
- Export über SQL Editor möglich

## 9. Performance & Skalierung

### Indizes
```sql
-- Code-Lookup (schnell)
CREATE INDEX idx_projects_code ON projects(code);

-- Cleanup Performance
CREATE INDEX idx_projects_last_accessed ON projects(last_accessed);
```

### Connection Pooling
```
Produktiv: 25-50 Connections (pgBouncer/NEON)
Entwicklung: 5-10 Connections
```

### JSONB Queries
```sql
-- Suche in JSONB-Daten
SELECT * FROM projects WHERE data->>'title' ILIKE '%Salesforce%';
SELECT * FROM projects WHERE (data->'settings'->>'currency')::text = 'EUR';
```

## 10. Debugging & Troubleshooting

### Logs prüfen
```bash
# Vercel Production
vercel logs -f

# Lokal
npm run dev  # Siehe console output
```

### Datenbank direkt prüfen
```bash
# PostgreSQL
psql $DATABASE_URLROI
SELECT * FROM projects;

# NEON
psql "postgresql://user:pass@ep-xxx.region.neon.tech/roi_calculator?sslmode=require"
```

### Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| "DATABASE_URLROI not set" | Env var fehlt | In Vercel Settings setzen |
| "ECONNREFUSED" | PostgreSQL läuft nicht | `brew services start postgresql` |
| "password authentication failed" | Falsches Passwort | Connection String überprüfen |
| "timeout expired" | Datenbank zu weit weg | NEON Region ändern |
| "database does not exist" | Schema nicht erstellt | Server startet und erstellt Schema automagisch |

→ Siehe auch: `docs/ERROR_ANALYSIS.md` und `docs/POSTGRESQL_SETUP.md`

## 11. Migrationen & Versioning

### Schema-Updates
```typescript
// In postgresql.ts initializeSchema():
await client.query(`
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
`);
```

### Daten-Migrations
```bash
# Manuell mit PostgreSQL
psql $DATABASE_URLROI -c "UPDATE projects SET ... WHERE ..."

# Oder Node.js Script
node scripts/migrate-data.js
```

## 12. Production Checklist

- [ ] NEON Account erstellt und Projekt konfiguriert
- [ ] Connection String aus NEON kopiert
- [ ] DATABASE_URLROI in Vercel Environment Variables gesetzt
- [ ] `.env` hat NICHT den Secret - nur im Vercel Dashboard!
- [ ] `.env` ist in `.gitignore` eingetragen
- [ ] HTTPS wird erzwungen (`?sslmode=require`)
- [ ] Regelmäßige Backups eingerichtet
- [ ] Monitoring & Alerts konfiguriert
- [ ] Rate Limiting erwogen
- [ ] Secrets Rotation geplant (falls nötig)

## Weitere Ressourcen

- **PostgreSQL**: https://www.postgresql.org/docs/
- **NEON**: https://neon.tech/docs
- **node-postgres**: https://node-postgres.com/
- **bcryptjs**: https://www.npmjs.com/package/bcryptjs
- **Vercel Database**: https://vercel.com/docs/storage/postgres

## Support & Kontakt

Für Probleme:
1. Überprüfe `docs/ERROR_ANALYSIS.md`
2. Sieh dir die spezifische Datenbank-Anleitung an
3. Checke Server-Logs: `npm run dev`
4. Teste Direct-Connection zur DB

---

**Nächste Schritte nach Database Setup:**
1. ✅ Database konfigurieren (In-Memory, PostgreSQL oder NEON)
2. ✅ `.env` datei erstellen
3. ✅ Backend starten
4. ✅ API Endpoints testen
5. ✅ Frontend deployen
6. ✅ Production Deployment vornehmen
