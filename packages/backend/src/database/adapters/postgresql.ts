/**
 * PostgreSQL Database Adapter
 * Zentrale Datenspeicherung für ROI Calculator
 */

import { Pool, PoolClient } from 'pg';
import { Project } from '@roi/shared';
import { IDatabase } from '../index.js';
import { randomBytes } from 'crypto';
import bcryptjs from 'bcryptjs';

export class PostgreSQLDatabase implements IDatabase {
  private pool: Pool;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL environment variable not set. See docs/POSTGRESQL_SETUP.md'
      );
    }

    this.pool = new Pool({ connectionString: dbUrl });
    this.initializeSchema();
  }

  /**
   * Initialisiert Datenbankschema beim Start
   */
  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
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

        CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
        CREATE INDEX IF NOT EXISTS idx_projects_last_accessed ON projects(last_accessed);
      `);
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generiert eindeutigen Projekt-Code
   */
  private generateProjectCode(): string {
    return randomBytes(6).toString('hex').toUpperCase().slice(0, 12);
  }

  /**
   * Hashiert Passwort mit bcrypt
   */
  private async hashPassphrase(passphrase: string): Promise<string> {
    return bcryptjs.hash(passphrase, 10);
  }

  /**
   * Verifiziert Passphrase
   */
  private async verifyPassphrase(
    plaintext: string,
    hash: string
  ): Promise<boolean> {
    return bcryptjs.compare(plaintext, hash);
  }

  /**
   * Speichert Projekt in PostgreSQL
   */
  async saveProject(project: Project): Promise<Project> {
    const client = await this.pool.connect();
    try {
      if (!project.code) {
        project.code = this.generateProjectCode();
      }

      const passphraseHash = project.passphrase
        ? await this.hashPassphrase(project.passphrase)
        : null;

      await client.query(
        `INSERT INTO projects (id, code, passphrase_hash, title, description, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          project.id,
          project.code,
          passphraseHash,
          project.title,
          project.description,
          JSON.stringify(project),
        ]
      );

      // Entferne Passphrase aus Rückgabewert
      delete project.passphrase;
      return project;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lädt Projekt per ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT data, last_accessed FROM projects WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Update last_accessed
      await client.query(
        `UPDATE projects SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      return result.rows[0].data as Project;
    } catch (error) {
      console.error('Error getting project by ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lädt Projekt per Code mit optionalem Passphrase-Check
   */
  async getProjectByCode(code: string, passphrase?: string): Promise<Project | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT data, passphrase_hash FROM projects WHERE code = $1`,
        [code]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const { data, passphrase_hash } = result.rows[0];

      // Verifiziere Passphrase wenn nötig
      if (passphrase_hash) {
        if (!passphrase) {
          return null;
        }
        const isValid = await this.verifyPassphrase(passphrase, passphrase_hash);
        if (!isValid) {
          return null;
        }
      }

      // Update last_accessed
      await client.query(
        `UPDATE projects SET last_accessed = CURRENT_TIMESTAMP WHERE code = $1`,
        [code]
      );

      return data as Project;
    } catch (error) {
      console.error('Error getting project by code:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Aktualisiert Projekt
   */
  async updateProject(project: Project): Promise<Project> {
    const client = await this.pool.connect();
    try {
      project.updatedAt = new Date();

      const passphraseHash = project.passphrase
        ? await this.hashPassphrase(project.passphrase)
        : null;

      await client.query(
        `UPDATE projects
         SET data = $1, updated_at = CURRENT_TIMESTAMP, passphrase_hash = $2,
             title = $3, description = $4
         WHERE id = $5`,
        [
          JSON.stringify(project),
          passphraseHash,
          project.title,
          project.description,
          project.id,
        ]
      );

      // Entferne Passphrase aus Rückgabewert
      delete project.passphrase;
      return project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Löscht Projekt
   */
  async deleteProject(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`DELETE FROM projects WHERE id = $1`, [
        id,
      ]);
      return result.rowCount === 1;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup: Löscht alte Projekte
   */
  async cleanupExpiredProjects(days: number = 60): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM projects
         WHERE last_accessed < NOW() - INTERVAL '${days} days'`
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired projects:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Statistiken zur Datenbank
   */
  async getStats(): Promise<{ totalProjects: number; totalCodes: number }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as total FROM projects`
      );
      return {
        totalProjects: parseInt(result.rows[0].total, 10),
        totalCodes: parseInt(result.rows[0].total, 10),
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Schließt Datenbankverbindung
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
