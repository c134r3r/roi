/**
 * Simple In-Memory Database (MVP)
 * Later: Replace with PostgreSQL
 */

import { Project, Investment } from '@roi/shared';
import { randomBytes } from 'crypto';

interface ProjectRecord {
  data: Project;
  lastAccessed: Date;
}

class Database {
  private projects: Map<string, ProjectRecord> = new Map();
  private projectCodes: Map<string, string> = new Map(); // code -> project id mapping

  /**
   * Generiert einen eindeutigen Projekt-Code (nicht erraten)
   */
  generateProjectCode(): string {
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
  saveProject(project: Project): Project {
    // Generiere Code wenn nicht vorhanden
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
   * Lädt ein Projekt per ID
   */
  getProjectById(id: string): Project | null {
    const record = this.projects.get(id);
    if (record) {
      record.lastAccessed = new Date();
      return record.data;
    }
    return null;
  }

  /**
   * Lädt ein Projekt per Code (mit optionaler Passphrase-Verifikation)
   */
  getProjectByCode(code: string, passphrase?: string): Project | null {
    const projectId = this.projectCodes.get(code);
    if (!projectId) return null;

    const record = this.projects.get(projectId);
    if (!record) return null;

    const project = record.data;

    // Passphrase-Verifikation (vereinfacht - in Produktion: proper hashing)
    if (project.passphrase && project.passphrase !== passphrase) {
      return null;
    }

    record.lastAccessed = new Date();
    return project;
  }

  /**
   * Aktualisiert ein Projekt
   */
  updateProject(project: Project): Project {
    project.updatedAt = new Date();
    this.projects.set(project.id, {
      data: project,
      lastAccessed: new Date(),
    });
    return project;
  }

  /**
   * Löscht ein Projekt
   */
  deleteProject(id: string): boolean {
    const project = this.projects.get(id);
    if (project) {
      this.projectCodes.delete(project.data.code);
      this.projects.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Cleanup: Lösche Projekte älter als 60 Tage
   */
  cleanupExpiredProjects(days: number = 60): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let count = 0;

    for (const [id, record] of this.projects.entries()) {
      if (record.lastAccessed < cutoff) {
        this.deleteProject(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Stats für Monitoring
   */
  getStats() {
    return {
      totalProjects: this.projects.size,
      totalCodes: this.projectCodes.size,
    };
  }
}

export const db = new Database();
