/**
 * ROI Calculator API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  Investment,
  ProjectSettings,
  ApiResponse,
  computeInvestment,
} from '@roi/shared';
import { db } from './db.js';

const router = Router();

// Validation Schemas
const ProjectSettingsSchema = z.object({
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF', 'JPY']),
  horizon: z.enum(['3', '5', '7']).transform(Number),
  discountRate: z.number().min(0).max(1),
  baseCurrency: z.string(),
});

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  settings: ProjectSettingsSchema,
  passphrase: z.string().optional(),
});

/**
 * POST /api/projects - Neues Projekt erstellen
 */
router.post('/projects', (req, res) => {
  try {
    const validated = CreateProjectSchema.parse(req.body);

    const project: Project = {
      id: uuidv4(),
      code: '', // Wird beim Save generiert
      title: validated.title,
      description: validated.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: [],
      investments: [],
      settings: {
        currency: validated.settings.currency,
        horizon: validated.settings.horizon as 3 | 5 | 7,
        discountRate: validated.settings.discountRate,
        baseCurrency: validated.settings.baseCurrency,
      },
    };

    if (validated.passphrase) {
      project.passphrase = validated.passphrase;
    }

    const saved = db.saveProject(project);

    const response: ApiResponse<Project> = {
      success: true,
      data: saved,
    };

    res.status(201).json(response);
  } catch (error) {
    handleValidationError(res, error);
  }
});

/**
 * GET /api/projects/:code - Projekt laden per Code
 */
router.get('/projects/:code', (req, res) => {
  try {
    const { code } = req.params;
    const { passphrase } = req.query;

    const project = db.getProjectByCode(code, passphrase as string | undefined);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse<null>);
    }

    const response: ApiResponse<Project> = {
      success: true,
      data: project,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/projects/:id - Projekt aktualisieren
 */
router.put('/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, investments, settings } = req.body;

    const project = db.getProjectById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse<null>);
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (settings) project.settings = settings;
    if (investments) project.investments = investments;

    // Recalculate all investments
    for (const investment of project.investments) {
      computeInvestment(investment, project.settings.discountRate, project.settings.horizon);
    }

    const updated = db.updateProject(project);

    const response: ApiResponse<Project> = {
      success: true,
      data: updated,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/projects/:id/investments - Neue Investment hinzufügen
 */
router.post('/projects/:id/investments', (req, res) => {
  try {
    const { id } = req.params;
    const { name, template } = req.body;

    const project = db.getProjectById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse<null>);
    }

    const investment: Investment = {
      id: uuidv4(),
      name: name || 'Untitled Investment',
      template: template,
      status: 'DRAFT',
      costs: [],
      benefits: [],
      scenarios: [],
      computedKPIs: {
        roi: 0,
        roiAbsolute: 0,
        paybackPeriod: 0,
        discountedPayback: 0,
        npv: 0,
        irr: 0,
        profitabilityIndex: 0,
      },
      cashflows: [],
      sensitivity: { drivers: [] },
    };

    project.investments.push(investment);
    db.updateProject(project);

    const response: ApiResponse<Investment> = {
      success: true,
      data: investment,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<null>);
  }
});

/**
 * Health Check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

/**
 * Stats
 */
router.get('/stats', (req, res) => {
  res.json(db.getStats());
});

/**
 * Error Handler
 */
function handleValidationError(res: any, error: any) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors,
    } as ApiResponse<null>);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } as ApiResponse<null>);
}

export default router;
