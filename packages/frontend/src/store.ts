/**
 * Global State Management (Zustand)
 */

import { create } from 'zustand';
import { Project, Investment } from '@roi/shared';

interface AppState {
  // Project Management
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  saveProjectToDatabase: (project: Project) => Promise<Project>;

  // Investment Management
  selectedInvestmentId: string | null;
  setSelectedInvestmentId: (id: string | null) => void;

  // UI State
  currentStep: 'landing' | 'basis' | 'costs' | 'benefits' | 'scenarios' | 'results';
  setCurrentStep: (step: any) => void;

  // Wizard State
  wizardData: Record<string, any>;
  setWizardData: (data: Record<string, any>) => void;
  updateWizardData: (partial: Record<string, any>) => void;

  // UI Helpers
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;
}

const STORAGE_KEY = 'roi-calculator-project';

// Hilfsfunktion um Projects zu serialisieren
function serializeProject(project: Project): string {
  return JSON.stringify({
    ...project,
    createdAt: new Date(project.createdAt).toISOString(),
    updatedAt: new Date(project.updatedAt).toISOString(),
  });
}

// Hilfsfunktion um Projects zu deserialisieren
function deserializeProject(json: string): Project {
  const data = JSON.parse(json);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

export const useAppStore = create<AppState>((set) => ({
  currentProject: (() => {
    // Versuche, Projekt aus localStorage zu laden (als Fallback)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const project = deserializeProject(stored);
        console.log('[Store] Loaded project from localStorage (fallback):', project.title);
        return project;
      }
    } catch (error) {
      console.warn('[Store] Failed to load from localStorage:', error);
    }
    return null;
  })(),

  setCurrentProject: (project) => {
    // Speichere in localStorage als Fallback für offline-Nutzung
    if (project) {
      try {
        localStorage.setItem(STORAGE_KEY, serializeProject(project));
        console.log('[Store] Saved project to localStorage (backup):', project.title);
      } catch (error) {
        console.warn('[Store] Failed to save to localStorage:', error);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ currentProject: project });
  },

  saveProjectToDatabase: async (project: Project) => {
    try {
      console.log('[Store] Saving project to database:', project.title);
      const saved = await apiClient.saveProject(project);
      console.log('[Store] Project saved successfully. Code:', saved.code);
      set({ currentProject: saved });
      return saved;
    } catch (error) {
      console.error('[Store] Failed to save to database:', error);
      throw error;
    }
  },

  selectedInvestmentId: null,
  setSelectedInvestmentId: (id) => set({ selectedInvestmentId: id }),

  currentStep: 'landing',
  setCurrentStep: (step) => set({ currentStep: step }),

  wizardData: {},
  setWizardData: (data) => set({ wizardData: data }),
  updateWizardData: (partial) => set((state) => ({
    wizardData: { ...state.wizardData, ...partial },
  })),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  error: null,
  setError: (error) => set({ error }),
}));

/**
 * API Client
 */
declare const __API_URL__: string;

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else {
      // Use __API_URL__ from vite.config.ts define, or fall back to relative /api
      const apiBaseUrl = typeof __API_URL__ !== 'undefined' ? __API_URL__ : 'http://localhost:3001';
      this.baseUrl = `${apiBaseUrl}/api`;
    }
  }

  async createProject(project: Project) {
    const url = `${this.baseUrl}/projects`;
    console.log(`[API] POST ${url}`, project.title);
    console.log(`[API] Base URL: ${this.baseUrl}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          settings: project.settings,
          passphrase: project.passphrase,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[API] Project created:`, result.code);
      return result;
    } catch (error) {
      console.error('[API] Failed to create project at:', url, error);
      throw error;
    }
  }

  async saveProject(project: Project) {
    console.log(`[API] SAVE project:`, project.title, '| Code:', project.code);

    try {
      // If project has no code, it's a new project
      if (!project.code) {
        return await this.createProject(project);
      }

      // Otherwise update existing project
      return await this.updateProject(project.id, project);
    } catch (error) {
      console.error('[API] Failed to save project:', error);
      throw error;
    }
  }

  async loadProject(code: string, passphrase?: string) {
    const url = `${this.baseUrl}/projects/${code}`;
    const urlWithParams = new URL(url);
    if (passphrase) urlWithParams.searchParams.set('passphrase', passphrase);

    console.log(`[API] Loading project:`, code, 'from', urlWithParams.toString());

    try {
      const response = await fetch(urlWithParams.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Project not found`);
      }
      const result = await response.json();
      console.log(`[API] Project loaded:`, result.title);
      return result;
    } catch (error) {
      console.error('[API] Failed to load project:', error);
      throw error;
    }
  }

  async updateProject(id: string, project: Project) {
    console.log(`[API] PUT ${this.baseUrl}/projects/${id}`, project.title);

    try {
      const response = await fetch(`${this.baseUrl}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[API] Project updated:`, result.code);
      return result;
    } catch (error) {
      console.error('[API] Failed to update project:', error);
      throw error;
    }
  }

  async addInvestment(projectId: string, data: { name: string; template?: string }) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export const apiClient = new ApiClient();
