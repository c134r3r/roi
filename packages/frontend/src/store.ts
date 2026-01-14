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
        return deserializeProject(stored);
      }
    } catch {
      // Failed to load from localStorage - ignore
    }
    return null;
  })(),

  setCurrentProject: (project) => {
    // Speichere in localStorage als Fallback für offline-Nutzung
    if (project) {
      try {
        localStorage.setItem(STORAGE_KEY, serializeProject(project));
      } catch {
        // Failed to save to localStorage - ignore
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ currentProject: project });
  },

  saveProjectToDatabase: async (project: Project) => {
    const saved = await apiClient.saveProject(project);
    set({ currentProject: saved });
    return saved;
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
      // Automatically detect API URL based on environment
      const apiBaseUrl = this.detectApiUrl();
      this.baseUrl = `${apiBaseUrl}/api`;
    }
  }

  private detectApiUrl(): string {
    // 1. Try environment variable from build-time (Vite)
    if (typeof __API_URL__ !== 'undefined' && __API_URL__) {
      return __API_URL__;
    }

    // 2. Try runtime environment variable
    if (typeof window !== 'undefined' && (window as any).env?.VITE_API_URL) {
      return (window as any).env.VITE_API_URL;
    }

    // 3. Use relative path for same-origin (when frontend and backend are on same domain)
    const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentHost && !currentHost.includes('localhost')) {
      // In production, use relative path
      return '';
    }

    // 4. Fallback for local development (if backend is running locally)
    return 'http://localhost:3001';
  }

  async createProject(project: Project) {
    const url = `${this.baseUrl}/projects`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(project.passphrase && { 'X-Passphrase': project.passphrase }),
      },
      body: JSON.stringify({
        title: project.title,
        description: project.description,
        settings: project.settings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create project');
    }
    return result.data;
  }

  async saveProject(project: Project) {
    // If project has no code, it's a new project
    if (!project.code) {
      return await this.createProject(project);
    }

    // Otherwise update existing project
    return await this.updateProject(project.id, project);
  }

  async loadProject(code: string, passphrase?: string) {
    const url = `${this.baseUrl}/projects/${code}`;
    const urlWithParams = new URL(url);
    if (passphrase) urlWithParams.searchParams.set('passphrase', passphrase);

    const response = await fetch(urlWithParams.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Project not found`);
    }
    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Project not found');
    }
    return result.data;
  }

  async updateProject(id: string, project: Project) {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update project');
    }
    return result.data;
  }

  async addInvestment(projectId: string, data: { name: string; template?: string }) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to add investment');
    }
    return result.data;
  }
}

export const apiClient = new ApiClient();
