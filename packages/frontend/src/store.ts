/**
 * Global State Management (Zustand)
 */

import { create } from 'zustand';
import { Project, Investment } from '@roi/shared';

interface AppState {
  // Project Management
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

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

export const useAppStore = create<AppState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

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

  async createProject(data: {
    title: string;
    description: string;
    settings: any;
    passphrase?: string;
  }) {
    console.log(`[API] POST ${this.baseUrl}/projects`, data);

    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[API] Response:`, result);
    return result;
  }

  async loadProject(code: string, passphrase?: string) {
    const url = new URL(`/api/projects/${code}`, this.baseUrl);
    if (passphrase) url.searchParams.set('passphrase', passphrase);

    const response = await fetch(url);
    return response.json();
  }

  async updateProject(id: string, data: Partial<Project>) {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
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
