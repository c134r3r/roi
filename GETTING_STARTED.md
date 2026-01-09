# Getting Started - ROI Calculator Development

## Quick Start

### 1. Install Dependencies
All dependencies are already installed. If you need to reinstall:

```bash
npm run install:all
```

### 2. Start Development Servers

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

The backend will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

Or run both in parallel:
```bash
npm run dev
```

### 3. Access the Application
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`

## Project Architecture

### Packages

**`packages/shared`**
- Shared TypeScript types and calculation engine
- `src/types.ts` - All data structures
- `src/calculations.ts` - Financial calculations (NPV, IRR, Payback, etc.)

**`packages/backend`**
- Express API server
- `src/db.ts` - In-memory database (MVP)
- `src/routes.ts` - API endpoints
- `src/index.ts` - Server entry point

**`packages/frontend`**
- React application with Vite
- `src/App.tsx` - Main application shell
- `src/pages/` - Step-by-step wizard pages
- `src/components/` - Reusable components
- `src/store.ts` - Zustand state management + API client

## Development Workflow

### Adding a Feature

1. **Update Types** (if needed)
   ```bash
   cd packages/shared/src
   # Edit types.ts
   npm run build
   ```

2. **Update Calculations** (if needed)
   ```bash
   cd packages/shared/src
   # Edit calculations.ts
   npm run build
   ```

3. **Update Backend API** (if needed)
   ```bash
   cd packages/backend/src
   # Edit routes.ts or db.ts
   # Auto-reloads in dev mode
   ```

4. **Update Frontend** (if needed)
   ```bash
   cd packages/frontend/src
   # Edit React components
   # Hot reload enabled
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "Feature: [description]"
   git push origin claude/roi-calculator-5vmrJ
   ```

## Current Implementation Status

### ✅ Completed
- [x] Monorepo structure (shared, backend, frontend)
- [x] Core data model (types.ts)
- [x] Calculation engine (NPV, IRR, Payback Period, Scenarios, Sensitivity)
- [x] Backend scaffolding (Express + Routes + In-memory DB)
- [x] Frontend scaffolding (React + Vite + Tailwind)
- [x] Landing page
- [x] Project basis form (Step 1)
- [x] Cost builder component (Step 2) - Full implementation with expandable blocks
- [x] Navigation component with progress bar
- [x] Project load dialog

### 🔄 In Progress / Planned
- [ ] Benefit wizard (Step 3) - Time savings, Error reduction, Revenue, Cost reduction
- [ ] Scenario generation UI
- [ ] Sensitivity analysis visualization (Tornado chart)
- [ ] Results summary page
- [ ] Chart components (Cashflow, Cumulative, Break-even)
- [ ] Export to PDF
- [ ] Export to Google Slides
- [ ] Save/Load system (Code + Passphrase)
- [ ] Project versioning

## Key Features to Implement

### Step 3: Benefits Wizard
The benefits wizard should guide users through quantifying qualitative effects:

1. **Time Savings**
   - Process name
   - Number of people affected
   - Hours saved per person per week
   - Fully-loaded hourly cost
   - Adoption curve (Linear/S-curve/Immediate)
   - Confidence level (Low/Medium/High)

2. **Error Reduction**
   - Error type description
   - Current error frequency
   - Time to fix per error
   - Error reduction percentage
   - Confidence level

3. **Revenue Impact**
   - Type of revenue increase
   - Number of new customers/projects
   - Average margin per unit
   - Growth trajectory

4. **Cost Reduction**
   - Current cost
   - Reduced cost
   - Timeline for reduction

### Step 4: Scenarios & Sensitivity
Automatically generate three scenarios based on confidence levels:
- **Conservative**: -50% benefits, +20% costs
- **Realistic**: No adjustments (base case)
- **Optimistic**: +30% benefits, no cost overruns

Show sensitivity/tornado analysis for top 5 drivers.

### Step 5-6: Results & Export
- Display KPIs (ROI, Payback, NPV, IRR)
- Show scenario comparison
- Generate narrative summary
- Export options:
  - PDF (via html2canvas + jsPDF)
  - Google Slides (via Google Sheets API)
  - CSV (cashflow table)

## Testing the Application

### Manual Testing Checklist
- [ ] Create new project with different settings
- [ ] Add cost components and verify totals
- [ ] Navigate between steps
- [ ] Verify form validation
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Check console for errors

### E2E Testing (Future)
```bash
npm run test:e2e
```

## Common Issues

### Ports Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Typescript Errors
```bash
# Rebuild shared package
cd packages/shared
npm run build
```

### Hot Reload Not Working
- Clear node_modules and reinstall: `rm -rf node_modules && npm install:all`
- Restart dev servers

## Next Steps

1. **Implement Benefit Wizard** - Focus on Time Savings first
2. **Add Chart Components** - Use Chart.js or Recharts
3. **Connect Calculate Engine** - Wire up calculations to UI
4. **Implement Scenarios Page** - Display auto-generated scenarios
5. **Add Export Functionality** - PDF export first, then Google Slides
6. **Implement Save/Load** - IndexedDB + Backend persistence

## Resources

- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev
- **Chart.js**: https://www.chartjs.org
- **Zod**: https://zod.dev (validation)
- **Zustand**: https://github.com/pmndrs/zustand (state management)

## Git Workflow

Always work on the feature branch:
```bash
git checkout claude/roi-calculator-5vmrJ
git pull origin claude/roi-calculator-5vmrJ
# ... make changes ...
git add .
git commit -m "Feature: [description]"
git push origin claude/roi-calculator-5vmrJ
```

Never push to main/master directly!
