import { useAppStore } from '../store';
import { TrendingUp, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

interface ScenariosStepProps {
  onNext: () => void;
  onBack: () => void;
}

function formatMonths(value: number): string {
  const years = Math.floor(value);
  const months = Math.round((value - years) * 12);
  if (years === 0) return `${months}M`;
  if (months === 0) return `${years}Y`;
  return `${years}Y ${months}M`;
}

export default function ScenariosStep({ onNext, onBack }: ScenariosStepProps) {
  const currentProject = useAppStore((s) => s.currentProject);

  if (!currentProject || !currentProject.investments[0]) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="card p-8 text-center text-gray-600">
          <p>Keine Projektdaten verfügbar</p>
        </div>
      </div>
    );
  }

  const investment = currentProject.investments[0];
  const { computedKPIs, scenarios, sensitivity } = investment;

  const KPI_CONFIGS = [
    { key: 'roi', label: 'ROI', unit: '%', format: (v: number) => v.toFixed(1) },
    { key: 'npv', label: 'NPV', unit: '€', format: (v: number) => Math.round(v).toLocaleString('de-DE') },
    { key: 'irr', label: 'IRR', unit: '%', format: (v: number) => v.toFixed(1) },
    { key: 'paybackPeriod', label: 'Amortisation', unit: 'Jahre', format: (v: number) => formatMonths(v) },
  ];

  const SCENARIO_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
    CONSERVATIVE: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', accent: 'bg-orange-100' },
    REALISTIC: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-100' },
    OPTIMISTIC: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'bg-green-100' },
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'CONSERVATIVE':
        return <TrendingDown className="w-5 h-5" />;
      case 'OPTIMISTIC':
        return <TrendingUp className="w-5 h-5" />;
      case 'REALISTIC':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getKPIValue = (scenario: any, key: string) => {
    return scenario.computedKPIs[key] ?? 0;
  };

  const formatKPI = (value: number, format: (v: number) => string) => {
    return format(value);
  };

  // Normalisiere Sensitivitäts-Daten für Anzeige
  const maxSensitivityImpact = sensitivity?.drivers?.[0]?.impact ?? 0;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Szenarien & Sensitivität</h2>
        <p className="text-gray-600">
          Vergleichen Sie Conservative, Realistic und Optimistic Szenarien sowie die Sensitivitätsanalyse
        </p>
      </div>

      {/* Szenarien Vergleich */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenarios && scenarios.map((scenario) => {
          const colors = SCENARIO_COLORS[scenario.type] || SCENARIO_COLORS.REALISTIC;
          return (
            <div key={scenario.id} className={`card overflow-hidden border-2 ${colors.border}`}>
              <div className={`${colors.bg} p-4 flex items-center gap-3`}>
                <div className={`${colors.accent} rounded-lg p-2`}>
                  {getScenarioIcon(scenario.type)}
                </div>
                <div>
                  <h3 className={`font-semibold ${colors.text}`}>{scenario.name} Szenario</h3>
                  <p className="text-sm text-gray-600">
                    {scenario.type === 'CONSERVATIVE' && 'Vorsichtig mit Risiken'}
                    {scenario.type === 'REALISTIC' && 'Basis-Annahmen'}
                    {scenario.type === 'OPTIMISTIC' && 'Optimale Bedingungen'}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {KPI_CONFIGS.map((config) => {
                  const value = getKPIValue(scenario, config.key);
                  const formatted = formatKPI(value, config.format);
                  const isRealistic = scenario.type === 'REALISTIC';

                  return (
                    <div key={config.key} className={isRealistic ? 'bg-blue-50 p-3 rounded' : ''}>
                      <p className="text-sm text-gray-600">{config.label}</p>
                      <p className={`font-semibold text-lg ${isRealistic ? 'text-blue-700' : 'text-gray-900'}`}>
                        {formatted}
                        <span className="text-sm text-gray-600 ml-1">{config.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Vergleich Tabelle */}
      <div className="card mb-8 overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">KPI Vergleich</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Metrik</th>
                {scenarios && scenarios.map((scenario) => (
                  <th key={scenario.id} className="text-right p-4 text-sm font-semibold text-gray-900">
                    {scenario.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KPI_CONFIGS.map((config) => (
                <tr key={config.key} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-sm font-medium text-gray-900">{config.label}</td>
                  {scenarios && scenarios.map((scenario) => {
                    const value = getKPIValue(scenario, config.key);
                    const formatted = formatKPI(value, config.format);
                    return (
                      <td key={scenario.id} className="text-right p-4 text-sm text-gray-900">
                        <span className="font-semibold">{formatted}</span>
                        <span className="text-gray-600 ml-1">{config.unit}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivitätsanalyse */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Sensitivitätsanalyse (Top-5 Treiber)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Zeigt, welche Faktoren den ROI am stärksten beeinflussen
          </p>
        </div>

        <div className="p-6 space-y-6">
          {sensitivity?.drivers && sensitivity.drivers.length > 0 ? (
            sensitivity.drivers.map((driver: any, index: number) => {
              const normalizedImpact = (Math.abs(driver.impact) / (maxSensitivityImpact || 1)) * 100;
              const minValue = driver.range[0];
              const maxValue = driver.range[1];

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {index + 1}. {driver.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      Impact: {Math.abs(driver.impact).toFixed(1)}%
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>-30% (Pessimistic)</span>
                      <span>+30% (Optimistic)</span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                      {/* Background bar for range */}
                      <div
                        className="absolute inset-y-0 left-0 bg-red-100"
                        style={{
                          width: '50%',
                          opacity: 0.3,
                        }}
                      />
                      <div
                        className="absolute inset-y-0 right-0 bg-green-100"
                        style={{
                          width: '50%',
                          opacity: 0.3,
                        }}
                      />

                      {/* Impact bar */}
                      <div
                        className="absolute inset-y-0 bg-blue-500 transition-all"
                        style={{
                          left: '50%',
                          width: `${normalizedImpact / 2}%`,
                        }}
                      />

                      {/* Labels inside bar */}
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-gray-900">
                        <span>{minValue.toFixed(1)}%</span>
                        <span>{maxValue.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-600">Keine Sensitivitätsdaten verfügbar</p>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-8 card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Interpretation</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            • Das <span className="font-semibold">Realistic Szenario</span> zeigt die erwartete Entwicklung basierend auf Ihren Annahmen.
          </p>
          <p>
            • Das <span className="font-semibold">Conservative Szenario</span> berücksichtigt Risiken und niedrigere Adoptionsraten.
          </p>
          <p>
            • Das <span className="font-semibold">Optimistic Szenario</span> geht von optimalen Bedingungen aus.
          </p>
          <p>
            • Die <span className="font-semibold">Sensitivitätsanalyse</span> zeigt, welche Faktoren den ROI am stärksten beeinflussen. Fokussieren Sie
            auf die Risikominderung der Top-Treiber.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={onNext} className="btn-primary ml-auto">
          Zu Ergebnissen
        </button>
      </div>
    </div>
  );
}
