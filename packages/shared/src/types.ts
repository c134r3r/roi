/**
 * ROI Calculator - Core Type Definitions
 */

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY';
export type Horizon = 3 | 5 | 7;
export type CostCategory = 'LICENSES' | 'IMPLEMENTATION' | 'MIGRATION' | 'INFRASTRUCTURE' | 'TRAINING' | 'SUPPORT' | 'OTHER';
export type BenefitType = 'TIME_SAVINGS' | 'ERROR_REDUCTION' | 'REVENUE' | 'COST_REDUCTION' | 'OTHER';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AdoptionPattern = 'LINEAR' | 'SCURVE' | 'IMMEDIATE';
export type InvestmentTemplate = 'SAAS' | 'INFRASTRUCTURE' | 'AUTOMATION' | 'DEVELOPMENT' | 'IMPLEMENTATION';
export type ScenarioType = 'REALISTIC' | 'CONSERVATIVE' | 'OPTIMISTIC' | 'CUSTOM';

// Settings
export interface ProjectSettings {
  currency: Currency;
  horizon: Horizon;
  discountRate: number; // e.g., 0.08 for 8%
  baseCurrency: string;
}

// Cost Management
export interface CostItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  frequency: 'ONE_TIME' | 'MONTHLY' | 'YEARLY';
  startMonth?: number;
}

export interface CostBlock {
  id: string;
  category: CostCategory;
  name: string;
  items: CostItem[];
  annualGrowth?: number; // e.g., 0.03 for 3%
  computedAmount?: number;
}

// Benefit Management
export interface AdoptionConfig {
  fullAdoptionMonth: number;
  pattern: AdoptionPattern;
}

export interface ConfidenceBand {
  low: number;  // e.g., 0.5 for ±50%
  high: number; // e.g., 0.3 for ±30%
}

export interface BenefitBlock {
  id: string;
  name: string;
  type: BenefitType;
  description: string;
  parameters: Record<string, {
    label: string;
    value: number;
    unit: string;
    min?: number;
    max?: number;
  }>;
  formulaText: string;
  adoption: AdoptionConfig;
  confidence: ConfidenceLevel;
  confidenceBand?: ConfidenceBand;
  cashflowByYear: number[];
}

// Calculations
export interface CashflowYear {
  year: number;
  costs: number;
  benefits: number;
  netCashflow: number;
  cumulativeCashflow: number;
  discountedCashflow: number;
  discountFactor: number;
}

export interface KPIs {
  roi: number; // %
  roiAbsolute: number; // EUR
  paybackPeriod: number; // years (decimal)
  paybackMonth?: number;
  discountedPayback: number;
  npv: number; // EUR
  irr: number; // %
  profitabilityIndex: number;
  breakEvenDate?: Date;
  riskScore?: number;
}

// Scenarios
export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  overrides: Record<string, number>;
  computedKPIs: KPIs;
}

// Sensitivity
export interface SensitivityDriver {
  name: string;
  impact: number;
  range: [number, number];
}

export interface SensitivityAnalysis {
  drivers: SensitivityDriver[];
}

// Investment
export interface Investment {
  id: string;
  name: string;
  template?: InvestmentTemplate;
  status: 'DRAFT' | 'FINALIZED';
  costs: CostBlock[];
  benefits: BenefitBlock[];
  scenarios: Scenario[];
  computedKPIs: KPIs;
  cashflows: CashflowYear[];
  sensitivity: SensitivityAnalysis;
}

// Version Management
export interface Version {
  versionId: string;
  timestamp: Date;
  snapshot: Investment[];
  changes: string[];
}

// Project
export interface Project {
  id: string;
  code: string;
  passphrase?: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  versions: Version[];
  investments: Investment[];
  settings: ProjectSettings;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProjectLoadResponse {
  project: Project;
  version: Version;
}
