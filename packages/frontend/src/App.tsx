import { useEffect, useState } from 'react';
import { useAppStore, apiClient } from './store';
import { computeInvestment } from '@roi/shared';
import LandingPage from './pages/LandingPage';
import ProjectBasisStep from './pages/ProjectBasisStep';
import CostBuilderStep from './pages/CostBuilderStep';
import BenefitsStep from './pages/BenefitsStep';
import ScenariosStep from './pages/ScenariosStep';
import ResultsStep from './pages/ResultsStep';
import Navigation from './components/Navigation';
import LoadProject from './pages/LoadProject';

type Step = 'landing' | 'basis' | 'costs' | 'benefits' | 'scenarios' | 'results' | 'load';

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [appError, setAppError] = useState<string | null>(null);
  const currentProject = useAppStore((s) => s.currentProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const isLoading = useAppStore((s) => s.isLoading);
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const error = useAppStore((s) => s.error);
  const setStoreError = useAppStore((s) => s.setError);

  const saveProjectToDatabase = useAppStore((s) => s.saveProjectToDatabase);

  // Live-Berechnung triggern wenn Daten sich ändern
  const triggerCalculation = () => {
    if (currentProject?.investments[0]) {
      const investment = currentProject.investments[0];
      computeInvestment(
        investment,
        currentProject.settings.discountRate,
        currentProject.settings.horizon
      );
      // Force Re-render durch State-Update
      setCurrentProject(currentProject);
    }
  };

  // Navigation mit Live-Berechnung und Auto-Save
  const handleStepChange = (newStep: string) => {
    triggerCalculation();

    // Auto-Save zu Datenbank wenn Projekt existiert
    if (currentProject && currentProject.id) {
      console.log('[App] Auto-saving project before navigation...');
      saveProjectToDatabase(currentProject).catch((error) => {
        console.warn('[App] Auto-save failed:', error);
        // Nicht blockieren, weitermachen auch wenn speichern fehlschlägt
      });
    }

    setStep(newStep as Step);
  };

  const renderStep = () => {
    switch (step) {
      case 'landing':
        return (
          <LandingPage
            onNewProject={() => handleStepChange('basis')}
            onLoadProject={() => handleStepChange('load')}
          />
        );
      case 'load':
        return (
          <LoadProject
            onProjectLoaded={(project) => {
              setCurrentProject(project);
              handleStepChange('basis');
            }}
            onCreateNew={() => handleStepChange('basis')}
          />
        );
      case 'basis':
        return (
          <ProjectBasisStep
            onNext={() => handleStepChange('costs')}
            onBack={() => handleStepChange('landing')}
          />
        );
      case 'costs':
        return (
          <CostBuilderStep
            onNext={() => handleStepChange('benefits')}
            onBack={() => handleStepChange('basis')}
          />
        );
      case 'benefits':
        return (
          <BenefitsStep
            onNext={() => handleStepChange('scenarios')}
            onBack={() => handleStepChange('costs')}
          />
        );
      case 'scenarios':
        return (
          <ScenariosStep
            onNext={() => handleStepChange('results')}
            onBack={() => handleStepChange('benefits')}
          />
        );
      case 'results':
        return (
          <ResultsStep
            onBack={() => handleStepChange('scenarios')}
            onNewProject={() => {
              setCurrentProject(null);
              handleStepChange('landing');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step !== 'landing' && (
        <Navigation
          step={step}
          projectTitle={currentProject?.title}
          projectCode={currentProject?.code}
          currentProject={currentProject}
          onStepClick={handleStepChange}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
            </div>
          </div>
        )}

        {/* Error UI */}
        {(error || appError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Fehler</h3>
                <p className="text-red-700 text-sm">{error || appError}</p>
              </div>
              <button
                onClick={() => {
                  setStoreError(null);
                  setAppError(null);
                }}
                className="text-red-700 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!error && !appError ? (
          renderStep()
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Es ist ein Fehler aufgetreten.</p>
            <button
              onClick={() => {
                setStoreError(null);
                setAppError(null);
                setStep('landing');
              }}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Zur Startseite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
