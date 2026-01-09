/**
 * Database Abstraction Layer
 * Ermöglicht einfachen Wechsel zwischen In-Memory und PostgreSQL
 */

import { Project } from '@roi/shared';

export interface IDatabase {
  saveProject(project: Project): Promise<Project>;
  getProjectById(id: string): Promise<Project | null>;
  getProjectByCode(code: string, passphrase?: string): Promise<Project | null>;
  updateProject(project: Project): Promise<Project>;
  deleteProject(id: string): Promise<boolean>;
  cleanupExpiredProjects(days: number): Promise<number>;
  getStats(): Promise<{ totalProjects: number; totalCodes: number }>;
}

export { InMemoryDatabase } from './adapters/in-memory.js';
export { PostgreSQLDatabase } from './adapters/postgresql.js';
