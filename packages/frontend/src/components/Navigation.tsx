import { BarChart3 } from 'lucide-react';
import ProjectCode from './ProjectCode';
import { Project } from '@roi/shared';

interface NavigationProps {
  step: string;
  projectTitle?: string;
  projectCode?: string;
  currentProject?: Project | null;
  onStepClick?: (step: string) => void;
}

export default function Navigation({ step, projectTitle, projectCode, currentProject, onStepClick }: NavigationProps) {
  const stepLabels: Record<string, string> = {
    basis: 'Projektbasis',
    costs: 'Kosten',
    benefits: 'Nutzen',
    scenarios: 'Szenarien',
    results: 'Ergebnisse',
  };

  const steps = ['basis', 'costs', 'benefits', 'scenarios', 'results'];
  const currentStepIndex = steps.indexOf(step);

  // Überprüfe ob Benefits vorhanden sind (erlaubt Sprung zu Ergebnissen)
  const hasBenefits = currentProject?.investments[0]?.benefits && currentProject.investments[0].benefits.length > 0;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <h1 className="text-lg font-semibold text-gray-900">{projectTitle}</h1>
          </div>
          {projectCode && <ProjectCode code={projectCode} />}
        </div>

        {/* Clickable Navigation Tabs */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600 gap-2">
            {steps.map((s, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              // Erlaube Sprung zu Ergebnissen wenn Benefits vorhanden sind
              const isResults = s === 'results';
              const isClickable = i <= currentStepIndex || (isResults && hasBenefits);

              return (
                <button
                  key={s}
                  onClick={() => isClickable && onStepClick?.(s)}
                  disabled={!isClickable}
                  className={`font-medium flex-1 py-2 px-2 rounded transition-all ${
                    isCurrent
                      ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-600'
                      : isCompleted
                      ? 'text-brand-600 hover:bg-brand-50 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={isClickable ? `Zu ${stepLabels[s]} springen` : 'Bitte füllen Sie zuerst die vorherigen Schritte aus'}
                >
                  {stepLabels[s]}
                </button>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-brand-600 h-1 rounded-full transition-all"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
