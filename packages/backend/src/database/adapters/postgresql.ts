/**
 * PostgreSQL Database Adapter
 * TODO: Implementieren wenn PostgreSQL eingerichtet ist
 *
 * Setup:
 * 1. npm install pg
 * 2. Siehe docs/POSTGRESQL_SETUP.md für Anleitung
 */

import { Project } from '@roi/shared';
import { IDatabase } from '../index.js';

export class PostgreSQLDatabase implements IDatabase {
  /**
   * TODO: Implementierung mit node-postgres (pg)
   *
   * Beispiel:
   * import { Pool } from 'pg';
   * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   */

  async saveProject(project: Project): Promise<Project> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert. Siehe docs/POSTGRESQL_SETUP.md');
  }

  async getProjectById(id: string): Promise<Project | null> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert');
  }

  async getProjectByCode(code: string, passphrase?: string): Promise<Project | null> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert');
  }

  async updateProject(project: Project): Promise<Project> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert');
  }

  async deleteProject(id: string): Promise<boolean> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert');
  }

  async cleanupExpiredProjects(days: number): Promise<number> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert');
  }

  async getStats(): Promise<{ totalProjects: number; totalCodes: number }> {
    throw new Error('PostgreSQL Adapter noch nicht implementiert');
  }
}
