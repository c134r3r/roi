/**
 * In-Memory Database Adapter
 * MVP und Testing - keine externe DB nötig
 */

import { Project } from '@roi/shared';
import { randomBytes } from 'crypto';
import { IDatabase } from '../index.js';

interface ProjectRecord {
  data: Project;
  lastAccessed: Date;
}

export class InMemoryDatabase implements IDatabase {
  private projects: Map<string, ProjectRecord> = new Map();
  private projectCodes: Map<string, string> = new Map(); // code -> project id

  /**
   * Generiert einen eindeutigen Projekt-Code
   */
  private generateProjectCode(): string {
    let code: string;
    do {
      const bytes = randomBytes(6);
      code = bytes.toString('hex').toUpperCase().slice(0, 12);
    } while (this.projectCodes.has(code));
    return code;
  }

  /**
   * Speichert ein Projekt
   */
  async saveProject(project: Project): Promise<Project> {
    if (!project.code) {
      project.code = this.generateProjectCode();
    }

    this.projects.set(project.id, {
      data: project,
      lastAccessed: new Date(),
    });

    this.projectCodes.set(project.code, project.id);
    return project;
  }

  /**
   * Lädt Projekt per ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const record = this.projects.get(id);
    if (record) {
      record.lastAccessed = new Date();
      return record.data;
    }
    return null;
  }

  /**
   * Lädt Projekt per Code (mit optionaler Passphrase)
   */
  async getProjectByCode(code: string, passphrase?: string): Promise<Project | null> {
    const projectId = this.projectCodes.get(code);
    if (!projectId) return null;

    const record = this.projects.get(projectId);
    if (!record) return null;

    const project = record.data;

    // Passphrase-Verifikation (vereinfacht)
    if (project.passphrase && project.passphrase !== passphrase) {
      return null;
    }

    record.lastAccessed = new Date();
    return project;
  }

  /**
   * Aktualisiert Projekt
   */
  async updateProject(project: Project): Promise<Project> {
    project.updatedAt = new Date();
    this.projects.set(project.id, {
      data: project,
      lastAccessed: new Date(),
    });
    return project;
  }

  /**
   * Löscht Projekt
   */
  async deleteProject(id: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (project) {
      this.projectCodes.delete(project.data.code);
      this.projects.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Cleanup: Lösche Projekte älter als X Tage
   */
  async cleanupExpiredProjects(days: number = 60): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Collect IDs first to avoid modifying collection during iteration
    const idsToDelete: string[] = [];
    for (const [id, record] of this.projects.entries()) {
      if (record.lastAccessed < cutoff) {
        idsToDelete.push(id);
      }
    }

    // Delete collected IDs
    for (const id of idsToDelete) {
      await this.deleteProject(id);
    }

    return idsToDelete.length;
  }

  /**
   * Stats für Monitoring
   */
  async getStats(): Promise<{ totalProjects: number; totalCodes: number }> {
    return {
      totalProjects: this.projects.size,
      totalCodes: this.projectCodes.size,
    };
  }
}
