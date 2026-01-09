# PostgreSQL Setup Guide

## Überblick

Dieses Guide zeigt, wie man die **In-Memory Datenbank durch PostgreSQL ersetzt**.

Das ist für **Production** erforderlich, wenn die Daten persistent bleiben sollen.

## Status

- ✅ **Jetzt (MVP)**: In-Memory Datenbank (`packages/backend/src/db.ts`)
- 🔄 **Später**: PostgreSQL Datenbank
- 📝 **Vorbereitet**: Abstraktion Layer für einfache Migration

---

## Schritt 1: PostgreSQL lokal einrichten (Development)

### Option A: Mit Docker (empfohlen)

```bash
# PostgreSQL starten
docker run -d \
  --name roi-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=roi_user \
  -e POSTGRES_PASSWORD=roi_password \
  -e POSTGRES_DB=roi_calculator \
  postgres:15-alpine

# Verifizieren
docker ps | grep roi-postgres
```

### Option B: Lokal installiert

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-15
sudo service postgresql start

# Windows
# https://www.postgresql.org/download/windows/
```

### Datenbank erstellen

```bash
psql -U postgres

# In PostgreSQL:
CREATE DATABASE roi_calculator;
CREATE USER roi_user WITH PASSWORD 'roi_password';
ALTER ROLE roi_user SET client_encoding TO 'utf8';
ALTER ROLE roi_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE roi_calculator TO roi_user;
\q
```

---

## Schritt 2: Backend Dependencies

```bash
cd packages/backend

# Installiere PostgreSQL Driver
npm install pg
npm install --save-dev @types/pg
```

---

## Schritt 3: Migrate Backend Code

### 3a. Implementiere PostgreSQL Adapter

Ersetze `src/database/adapters/postgresql.ts`:

```typescript
import { Pool, PoolClient } from 'pg';
import { Project } from '@roi/shared';
import { IDatabase } from '../index.js';
import { randomBytes } from 'crypto';

export class PostgreSQLDatabase implements IDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.init();
  }

  private async init() {
    const client = await this.pool.connect();
    try {
      // Erstelle Tabellen beim Start
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(36) PRIMARY KEY,
          code VARCHAR(12) UNIQUE NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          passphrase VARCHAR(255),
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_accessed TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_code ON projects(code);
        CREATE INDEX IF NOT EXISTS idx_last_accessed ON projects(last_accessed);
      `);
    } finally {
      client.release();
    }
  }

  private generateProjectCode(): string {
    let code: string;
    do {
      const bytes = randomBytes(6);
      code = bytes.toString('hex').toUpperCase().slice(0, 12);
    } while (code);
    return code;
  }

  async saveProject(project: Project): Promise<Project> {
    if (!project.code) {
      project.code = this.generateProjectCode();
    }

    const result = await this.pool.query(
      `INSERT INTO projects (id, code, title, description, passphrase, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         title = $3, description = $4, data = $6, updated_at = NOW()
       RETURNING data`,
      [
        project.id,
        project.code,
        project.title,
        project.description,
        project.passphrase,
        JSON.stringify(project),
      ]
    );

    return result.rows[0].data;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const result = await this.pool.query(
      'SELECT data FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;

    await this.pool.query(
      'UPDATE projects SET last_accessed = NOW() WHERE id = $1',
      [id]
    );

    return result.rows[0].data;
  }

  async getProjectByCode(code: string, passphrase?: string): Promise<Project | null> {
    const result = await this.pool.query(
      'SELECT data, passphrase FROM projects WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const project = row.data;

    if (project.passphrase && project.passphrase !== passphrase) {
      return null;
    }

    await this.pool.query(
      'UPDATE projects SET last_accessed = NOW() WHERE code = $1',
      [code]
    );

    return project;
  }

  async updateProject(project: Project): Promise<Project> {
    await this.pool.query(
      `UPDATE projects SET data = $1, updated_at = NOW(), last_accessed = NOW()
       WHERE id = $2`,
      [JSON.stringify(project), project.id]
    );
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM projects WHERE id = $1',
      [id]
    );
    return result.rowCount === 1;
  }

  async cleanupExpiredProjects(days: number): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM projects
       WHERE last_accessed < NOW() - INTERVAL '${days} days'`
    );
    return result.rowCount || 0;
  }

  async getStats(): Promise<{ totalProjects: number; totalCodes: number }> {
    const result = await this.pool.query('SELECT COUNT(*) FROM projects');
    return {
      totalProjects: parseInt(result.rows[0].count),
      totalCodes: parseInt(result.rows[0].count),
    };
  }

  async close() {
    await this.pool.end();
  }
}
```

### 3b. Update `src/db.ts`

```typescript
import { PostgreSQLDatabase } from './database/index.js';

// PostgreSQL aktivieren
const connectionString = process.env.DATABASE_URL ||
  'postgresql://roi_user:roi_password@localhost:5432/roi_calculator';

export const db = new PostgreSQLDatabase(connectionString);
```

### 3c. Update `.env` und `.env.example`

```bash
# .env.local (lokal)
DATABASE_URL=postgresql://roi_user:roi_password@localhost:5432/roi_calculator

# Vercel Environment Variables (Production)
DATABASE_URL=postgresql://username:password@db.railway.app:5432/roi_calculator
```

---

## Schritt 4: Database Migrations

### Schema Migration

```bash
# Mit Vercel PostgreSQL oder Railway, erstelle die Tabellen:
# Nutze SQL direkt in der DB Admin Console
```

---

## Schritt 5: Deploy

### Lokales Testen

```bash
# Start PostgreSQL
docker start roi-postgres

# Start Backend
cd packages/backend
npm run dev
```

### Production (Railway)

```bash
# 1. Erstelle Projekt auf railway.app
# 2. Verbinde PostgreSQL Plugin
# 3. Kopiere DATABASE_URL von Railway
# 4. Setze Environment Variable im Backend
# 5. Deploy
```

---

## Tipps

- **Backups**: Regelmäßige Backups via Railway/Vercel einrichten
- **Monitoring**: Logs in Railway/Vercel Dashboard checken
- **Performance**: Indizes auf `code` und `last_accessed` für schnelle Queries
- **Security**: Niemals Credentials in Code hardcoden - immer Environment Variables nutzen

---

## Rollback auf In-Memory

Falls etwas schiefgeht:

```typescript
// In src/db.ts
import { InMemoryDatabase } from './database/index.js';
export const db = new InMemoryDatabase();
```

---

## Weitere Ressourcen

- [node-postgres Docs](https://node-postgres.com/)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Vercel PostgreSQL](https://vercel.com/docs/storage/vercel-postgres)
