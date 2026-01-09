import { BarChart3 } from 'lucide-react';

interface NavigationProps {
  step: string;
  projectTitle?: string;
}

export default function Navigation({ step, projectTitle }: NavigationProps) {
  const stepLabels: Record<string, string> = {
    basis: 'Projektbasis',
    costs: 'Kosten',
    benefits: 'Nutzen',
    scenarios: 'Szenarien',
    results: 'Ergebnisse',
  };

  const steps = ['basis', 'costs', 'benefits', 'scenarios', 'results'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <h1 className="text-lg font-semibold text-gray-900">{projectTitle}</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            {steps.map((s, i) => (
              <span
                key={s}
                className={`font-medium ${
                  i <= currentStepIndex ? 'text-brand-600' : 'text-gray-400'
                }`}
              >
                {stepLabels[s]}
              </span>
            ))}
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
