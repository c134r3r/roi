# PostgreSQL Setup Guide

## Übersicht

Der ROI Calculator ist nun mit **PostgreSQL-Unterstützung** konfiguriert! Das System speichert alle Projekte zentral in einer PostgreSQL-Datenbank und ermöglicht sichere Online-Persistierung.

## Features

✅ **Zentrale Datenspeicherung**: Alle Projekte werden in PostgreSQL gespeichert
✅ **Sichere Passwörter**: bcrypt-Hashing für Passphrases
✅ **Automatische Schema-Erstellung**: Tabellen werden beim Start erstellt
✅ **Fallback zu In-Memory**: Funktioniert auch ohne PostgreSQL (für Entwicklung)
✅ **JSONB-Speicherung**: Flexible Projektdaten in JSONB-Format

## Installation

### 1. PostgreSQL installieren

**macOS (mit Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Oder: `choco install postgresql`

### 2. Datenbank erstellen

```bash
# Mit PostgreSQL verbinden
psql -U postgres

# Datenbank erstellen
CREATE DATABASE roi_calculator;

# Benutzer erstellen (optional, für Sicherheit)
CREATE USER roi_user WITH PASSWORD 'your_secure_password';
ALTER ROLE roi_user SET client_encoding TO 'utf8';
ALTER ROLE roi_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE roi_user SET default_transaction_deferrable TO on;
ALTER ROLE roi_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE roi_calculator TO roi_user;

# Verbindung testen
psql -U roi_user -d roi_calculator -h localhost
```

### 3. Backend konfigurieren

**Datei: `packages/backend/.env`**

```env
# Variante 1: Standard-User (postgres)
DATABASE_URL=postgresql://postgres:password@localhost:5432/roi_calculator

# Variante 2: Dedizierter User
DATABASE_URL=postgresql://roi_user:your_secure_password@localhost:5432/roi_calculator

# Variante 3: Mit Unix Socket (lokal, empfohlen)
DATABASE_URL=postgresql://roi_user@localhost/roi_calculator

# Aktiviere PostgreSQL
USE_POSTGRES=true

# Server-Port
PORT=3001

# Frontend CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Dependencies installieren

```bash
cd packages/backend
npm install
```

### 5. Server starten

```bash
# In packages/backend:
npm run dev

# Oder von Projekt-Root:
npm run dev
```

Du solltest sehen:
```
🗄️ Using PostgreSQL database...
✅ Database schema initialized
📊 ROI Calculator Server running on http://localhost:3001
```

## Datenbankschema

### Tabelle: `projects`

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  code VARCHAR(12) UNIQUE NOT NULL,
  passphrase_hash VARCHAR(255),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSONB NOT NULL
);

CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_last_accessed ON projects(last_accessed);
```

**Spalten:**
- `id`: Eindeutige Projekt-ID (UUID)
- `code`: 12-stelliger Hex-Code für Sharing (z.B. "A3F5B8C2D1E7")
- `passphrase_hash`: bcrypt-gehashte Passphrase (optional)
- `title`: Projektname
- `description`: Projektbeschreibung
- `created_at`: Erstellungsdatum
- `updated_at`: Aktualisierungsdatum
- `last_accessed`: Letzter Zugriff (für Cleanup)
- `data`: Vollständige Projektdaten im JSONB-Format

## Verwaltung

### Datenbankverbindung testen

```bash
psql postgresql://roi_user@localhost/roi_calculator

# Oder:
psql -U roi_user -d roi_calculator
```

### Alle Projekte anzeigen

```sql
SELECT id, code, title, created_at, updated_at FROM projects;
```

### Projekt löschen (manuell)

```sql
DELETE FROM projects WHERE code = 'A3F5B8C2D1E7';
```

### Cleanup durchführen (Projekte älter als 60 Tage)

```bash
curl http://localhost:3001/api/cleanup
```

Oder direkt via SQL:
```sql
DELETE FROM projects
WHERE last_accessed < NOW() - INTERVAL '60 days';
```

### Stats anzeigen

```bash
curl http://localhost:3001/api/stats
```

## Fehlersuche

### "DATABASE_URL not set"
- Stelle sicher, dass `.env` die `DATABASE_URL` enthält
- Format: `postgresql://user:password@host:port/database`

### "Connection refused"
- PostgreSQL läuft nicht: `sudo systemctl start postgresql` (Linux) oder `brew services start postgresql` (Mac)
- Port ist falsch (Standard: 5432)
- Firewall blockiert Verbindung

### "FATAL: role "postgres" does not exist"
- Du hast PostgreSQL mit anderer Rolle installiert
- `psql -l` zeigt verfügbare Datenbanken

### "FATAL: database "roi_calculator" does not exist"
- Datenbank nicht erstellt: Führe CREATE DATABASE aus

## Production Deployment

### 1. Sichere PostgreSQL-Konfiguration

```bash
# Remote-Verbindungen erlauben (nur von App-Server):
sudo nano /etc/postgresql/*/main/postgresql.conf
listen_addresses = 'localhost'  # Oder: spezifische IP

# pg_hba.conf anpassen
sudo nano /etc/postgresql/*/main/pg_hba.conf
host    roi_calculator    roi_user    192.168.1.100/32    md5
```

### 2. Backups erstellen

```bash
# Tägliches Backup
pg_dump postgresql://roi_user@localhost/roi_calculator > backup_$(date +%Y%m%d).sql

# Oder automatisiert (cron):
0 2 * * * pg_dump -U roi_user roi_calculator > /backups/roi_$(date +\%Y\%m\%d).sql
```

### 3. Connection Pooling (optional)

Nutze `pgBouncer` für Produktionsumgebungen:
```bash
# Installation:
sudo apt-get install pgbouncer

# Config: /etc/pgbouncer/pgbouncer.ini
[databases]
roi_calculator = host=localhost port=5432 dbname=roi_calculator

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## Migration von In-Memory zu PostgreSQL

1. **Alte Daten exportieren** (falls vorhanden):
   ```bash
   # localStorage Daten aus Frontend exportieren
   # (manuell im Browser: F12 → Application → localStorage)
   ```

2. **PostgreSQL aktivieren**:
   - `DATABASE_URL` in `.env` setzen
   - Server neustarten

3. **Schema wird automatisch erstellt**:
   - Der Server erstellt Tabellen beim Start
   - Keine Migration nötig!

## Support

- Dokumentation: https://www.postgresql.org/docs/
- pg Node.js Library: https://node-postgres.com/
- bcryptjs: https://www.npmjs.com/package/bcryptjs
