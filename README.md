# ROI Calculator

Professional ROI & Amortization Calculator for SaaS/IT Investments.

## Project Structure

```
roi/
├── packages/
│   ├── shared/          # Shared types, calculations, utilities
│   ├── backend/         # Express API server
│   └── frontend/        # React application
├── package.json         # Root configuration
└── README.md           # This file
```

## Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Shared**: TypeScript utilities & calculation engine
- **Database**: In-memory (MVP), PostgreSQL (planned)

## Getting Started

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001/api`

### Build

```bash
# Build all packages
npm run build
```

## Features (MVP)

- ✅ Project basis configuration
- ✅ Cost component builder
- ✅ Benefit quantification wizard
- ✅ Automatic scenario generation (Conservative/Realistic/Optimistic)
- ✅ KPI calculations (ROI, Payback, NPV, IRR)
- ✅ Sensitivity analysis
- 🔄 Chart visualizations
- 🔄 Save/Load without login (code + optional passphrase)
- 🔄 Export to PDF / Google Slides

## Architecture

### Core Calculation Engine

The `@roi/shared` package contains:

1. **Data Types** (`types.ts`): All TypeScript interfaces
2. **Calculation Engine** (`calculations.ts`):
   - NPV, IRR, Payback Period calculations
   - Scenario generation (Conservative/Realistic/Optimistic)
   - Sensitivity analysis (Tornado diagram)
   - Adoption curves (Linear/S-curve/Immediate)

### Backend API

The backend provides REST endpoints:

- `POST /api/projects` - Create new project
- `GET /api/projects/:code` - Load project by code
- `PUT /api/projects/:id` - Update project
- `POST /api/projects/:id/investments` - Add investment

### Frontend

Multi-step wizard interface:
1. Project Basis Setup
2. Cost Builder
3. Benefits Quantification
4. Scenarios & Sensitivity
5. Results & Export

## Development Roadmap

### Phase 1 (MVP)
- [x] Core data model
- [x] Calculation engine
- [x] Backend scaffolding
- [x] Frontend scaffolding
- [ ] Cost builder UI
- [ ] Benefits wizard UI
- [ ] Chart components
- [ ] Export functionality
- [ ] Save/Load system

### Phase 2
- [ ] Multiple investment comparison
- [ ] Detailed formula editor
- [ ] Interactive sensitivity sliders
- [ ] PPTX export
- [ ] Project versioning

### Phase 3
- [ ] Google Slides API integration
- [ ] Monte Carlo simulation
- [ ] More templates
- [ ] Team collaboration
- [ ] Mobile optimization

## Contributing

When making changes:

1. Work on the `claude/roi-calculator-*` branch
2. Make changes to relevant packages
3. Test locally
4. Commit with descriptive messages
5. Push to the feature branch

## Notes

- This is a professional tool for financial analysis - ensure accuracy in calculations
- All cost/benefit assumptions must be clearly documented
- Sensitivity analysis helps communicate uncertainty
- No user authentication required (MVP) - projects expire after 60 days
