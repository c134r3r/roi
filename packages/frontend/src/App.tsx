import { useEffect, useState } from 'react';
import { useAppStore, apiClient } from './store';
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
  const currentProject = useAppStore((s) => s.currentProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const isLoading = useAppStore((s) => s.isLoading);
  const setIsLoading = useAppStore((s) => s.setIsLoading);

  const renderStep = () => {
    switch (step) {
      case 'landing':
        return (
          <LandingPage
            onNewProject={() => setStep('basis')}
            onLoadProject={() => setStep('load')}
          />
        );
      case 'load':
        return (
          <LoadProject
            onProjectLoaded={(project) => {
              setCurrentProject(project);
              setStep('basis');
            }}
            onCreateNew={() => setStep('basis')}
          />
        );
      case 'basis':
        return (
          <ProjectBasisStep
            onNext={() => setStep('costs')}
            onBack={() => setStep('landing')}
          />
        );
      case 'costs':
        return (
          <CostBuilderStep
            onNext={() => setStep('benefits')}
            onBack={() => setStep('basis')}
          />
        );
      case 'benefits':
        return (
          <BenefitsStep
            onNext={() => setStep('scenarios')}
            onBack={() => setStep('costs')}
          />
        );
      case 'scenarios':
        return (
          <ScenariosStep
            onNext={() => setStep('results')}
            onBack={() => setStep('benefits')}
          />
        );
      case 'results':
        return (
          <ResultsStep
            onBack={() => setStep('scenarios')}
            onNewProject={() => {
              setCurrentProject(null);
              setStep('landing');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step !== 'landing' && <Navigation step={step} projectTitle={currentProject?.title} />}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
            </div>
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
}
