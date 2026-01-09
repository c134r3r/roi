# Database Abstraction Layer

## Übersicht

Die Database Abstraction Layer ermöglicht einfachen Wechsel zwischen verschiedenen Datenbanken ohne Code-Änderungen in Routes/Services.

## Architektur

```
IDatabase (Interface)
    ├── InMemoryDatabase (MVP)
    └── PostgreSQLDatabase (Production)
```

## Aktuelle Situation (MVP)

- ✅ **In-Memory**: Verwendet (schnell für Development/Testing)
- 🔄 **PostgreSQL**: Template vorhanden, bereit für Implementierung

## Verwendung

### In `src/index.ts`:

```typescript
// MVP: In-Memory
import { InMemoryDatabase } from './database/index.js';
const db = new InMemoryDatabase();

// TODO: Production mit PostgreSQL
// import { PostgreSQLDatabase } from './database/index.js';
// const db = new PostgreSQLDatabase(process.env.DATABASE_URL);
```

### In Routes:

```typescript
// Die db Instanz ist verfügbar als wäre sie global
// Alle Methoden haben gleiche Signatur
await db.saveProject(project);
await db.getProjectById(id);
```

## Interface

```typescript
interface IDatabase {
  saveProject(project: Project): Promise<Project>;
  getProjectById(id: string): Promise<Project | null>;
  getProjectByCode(code: string, passphrase?: string): Promise<Project | null>;
  updateProject(project: Project): Promise<Project>;
  deleteProject(id: string): Promise<boolean>;
  cleanupExpiredProjects(days: number): Promise<number>;
  getStats(): Promise<{ totalProjects: number; totalCodes: number }>;
}
```

## Migration zu PostgreSQL

**Siehe**: `docs/POSTGRESQL_SETUP.md` für komplettes Setup-Guide

Kurz:
1. PostgreSQL einrichten
2. `src/database/adapters/postgresql.ts` implementieren (Template vorhanden)
3. In `src/index.ts` Adapter wechseln
4. Done! ✨

## Vorteile dieser Architektur

- ✅ **No Vendor Lock-in**: Wechsel ohne Code-Umschreiben
- ✅ **Testbar**: Mock-Adapter leicht zu erstellen
- ✅ **Skalierbar**: Neue Adapter können hinzugefügt werden
- ✅ **Clean Code**: Separation of Concerns

## Weitere Adapter

Falls nötig, können weitere Adapter hinzugefügt werden:

- MongoDB Adapter
- DynamoDB Adapter
- Firebase Adapter
- etc.

Einfach `IDatabase` implementieren und los geht's!
