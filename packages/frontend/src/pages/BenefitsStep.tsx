import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { computeInvestment } from '@roi/shared';

type BenefitType = 'TIME_SAVINGS' | 'ERROR_REDUCTION' | 'REVENUE' | 'COST_REDUCTION' | 'OTHER';
type AdoptionPattern = 'LINEAR' | 'SCURVE' | 'IMMEDIATE';
type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface BenefitBlock {
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
  adoption: {
    pattern: AdoptionPattern;
    fullAdoptionMonth: number;
  };
  confidence: ConfidenceLevel;
}

interface BenefitsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const BENEFIT_TEMPLATES: Record<BenefitType, Partial<BenefitBlock>> = {
  TIME_SAVINGS: {
    name: 'Zeiteinsparungen',
    type: 'TIME_SAVINGS',
    description: 'Berechnet basierend auf eingesparten Stunden pro Jahr',
    parameters: {
      hoursPerYear: { label: 'Eingesparte Stunden pro Jahr', value: 100, unit: 'h', min: 0 },
      hourlyRate: { label: 'Stundensatz', value: 50, unit: '€', min: 0 },
    },
    formulaText: 'Nutzen = Eingesparte Stunden × Stundensatz',
    adoption: { pattern: 'LINEAR', fullAdoptionMonth: 6 },
  },
  ERROR_REDUCTION: {
    name: 'Fehlerreduktion',
    type: 'ERROR_REDUCTION',
    description: 'Berechnet basierend auf vermiedenen Fehlerkosten',
    parameters: {
      errorsPerYear: { label: 'Fehler pro Jahr (vorher)', value: 50, unit: 'Stück', min: 0 },
      costPerError: { label: 'Kosten pro Fehler', value: 100, unit: '€', min: 0 },
      reductionPercent: { label: 'Fehlerreduktion', value: 80, unit: '%', min: 0, max: 100 },
    },
    formulaText: 'Nutzen = Fehler pro Jahr × Kosten pro Fehler × Reduktionsprozentsatz',
    adoption: { pattern: 'LINEAR', fullAdoptionMonth: 6 },
  },
  REVENUE: {
    name: 'Umsatzsteigerung',
    type: 'REVENUE',
    description: 'Berechnet basierend auf zusätzlichem Umsatz',
    parameters: {
      additionalRevenue: { label: 'Zusätzlicher Umsatz pro Jahr', value: 10000, unit: '€', min: 0 },
      profitMargin: { label: 'Gewinnmarge', value: 30, unit: '%', min: 0, max: 100 },
    },
    formulaText: 'Nutzen = Zusätzlicher Umsatz × Gewinnmarge',
    adoption: { pattern: 'SCURVE', fullAdoptionMonth: 12 },
  },
  COST_REDUCTION: {
    name: 'Kosteneinsparung',
    type: 'COST_REDUCTION',
    description: 'Berechnet basierend auf reduzierten laufenden Kosten',
    parameters: {
      currentCosts: { label: 'Aktuelle jährliche Kosten', value: 5000, unit: '€', min: 0 },
      reductionPercent: { label: 'Kostenreduktion', value: 30, unit: '%', min: 0, max: 100 },
    },
    formulaText: 'Nutzen = Aktuelle Kosten × Reduktionsprozentsatz',
    adoption: { pattern: 'IMMEDIATE', fullAdoptionMonth: 1 },
  },
  OTHER: {
    name: 'Sonstige Effekte',
    type: 'OTHER',
    description: 'Benutzerdefinierte Nutzeneffekte',
    parameters: {
      annualValue: { label: 'Jährlicher Nutzen', value: 0, unit: '€', min: 0 },
    },
    formulaText: 'Nutzen = Jährlicher Nutzen',
    adoption: { pattern: 'LINEAR', fullAdoptionMonth: 6 },
  },
};

export default function BenefitsStep({ onNext, onBack }: BenefitsStepProps) {
  const [benefits, setBenefits] = useState<BenefitBlock[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const currentProject = useAppStore((s) => s.currentProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);

  // Lade Benefits aus currentProject wenn Komponente geladen wird
  useEffect(() => {
    if (currentProject?.investments[0]?.benefits) {
      const existingBenefits = currentProject.investments[0].benefits as BenefitBlock[];
      setBenefits(existingBenefits);
      // Expandiere alle Blöcke für bessere UX
      const allIds = new Set(existingBenefits.map(b => b.id));
      setExpandedBlocks(allIds);
    }
  }, [currentProject?.investments[0]?.benefits]);

  const handleNext = () => {
    if (!currentProject) return;

    // Update investment with benefits and calculate scenarios/sensitivity
    const updatedProject = { ...currentProject };
    if (updatedProject.investments[0]) {
      const investment = updatedProject.investments[0];
      const horizon = currentProject.settings.horizon || 3;

      console.log('[BenefitsStep] Converting benefits:', {
        count: benefits.length,
        benefits: benefits.map(b => ({
          id: b.id,
          name: b.name,
          value: calculateBenefitValue(b),
        })),
      });

      // Convert BenefitBlock to proper format with cashflow calculations
      const formattedBenefits = benefits.map((b) => {
        const annualValue = calculateBenefitValue(b);
        const formatted = {
          ...b,
          cashflowByYear: new Array(horizon).fill(annualValue),
          // Add confidence band based on confidence level
          confidenceBand:
            b.confidence === 'LOW'
              ? { low: 0.5, high: 0.7 }
              : b.confidence === 'HIGH'
                ? { low: 0.1, high: 0.1 }
                : { low: 0.3, high: 0.3 },
        };
        console.log('[BenefitsStep] Formatted benefit:', {
          name: b.name,
          annualValue,
          cashflowByYear: formatted.cashflowByYear,
        });
        return formatted;
      });

      investment.benefits = formattedBenefits;

      console.log('[BenefitsStep] Investment before calculation:', {
        costs: investment.costs.length,
        benefits: investment.benefits.length,
      });

      // Trigger full calculation (generates scenarios and sensitivity analysis)
      computeInvestment(investment, currentProject.settings.discountRate, horizon);

      console.log('[BenefitsStep] Investment after calculation:', {
        kpis: investment.computedKPIs,
        scenarios: investment.scenarios.length,
      });

      setCurrentProject(updatedProject);
    }

    onNext();
  };

  const toggleExpanded = (id: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddBenefit = (type: BenefitType) => {
    const template = BENEFIT_TEMPLATES[type];
    const newBenefit: BenefitBlock = {
      id: uuidv4(),
      name: template.name || 'Neuer Nutzeneffekt',
      type,
      description: template.description || '',
      parameters: template.parameters || {},
      formulaText: template.formulaText || '',
      adoption: template.adoption || { pattern: 'LINEAR', fullAdoptionMonth: 6 },
      confidence: 'MEDIUM',
    };
    setBenefits([...benefits, newBenefit]);
    setExpandedBlocks((prev) => new Set([...prev, newBenefit.id]));
    setShowTypeSelector(false);
  };

  const handleUpdateBenefit = (benefitId: string, field: string, value: any) => {
    setBenefits((prev) =>
      prev.map((b) => (b.id === benefitId ? { ...b, [field]: value } : b))
    );
  };

  const handleUpdateParameter = (benefitId: string, paramKey: string, value: number) => {
    setBenefits((prev) =>
      prev.map((b) =>
        b.id === benefitId
          ? {
              ...b,
              parameters: {
                ...b.parameters,
                [paramKey]: { ...b.parameters[paramKey], value },
              },
            }
          : b
      )
    );
  };

  const handleRemoveBenefit = (id: string) => {
    setBenefits((prev) => prev.filter((b) => b.id !== id));
  };

  const calculateBenefitValue = (benefit: BenefitBlock): number => {
    const params = benefit.parameters;
    switch (benefit.type) {
      case 'TIME_SAVINGS':
        return (params.hoursPerYear?.value || 0) * (params.hourlyRate?.value || 0);
      case 'ERROR_REDUCTION':
        return (params.errorsPerYear?.value || 0) * (params.costPerError?.value || 0) * ((params.reductionPercent?.value || 0) / 100);
      case 'REVENUE':
        return (params.additionalRevenue?.value || 0) * ((params.profitMargin?.value || 0) / 100);
      case 'COST_REDUCTION':
        return (params.currentCosts?.value || 0) * ((params.reductionPercent?.value || 0) / 100);
      case 'OTHER':
        return params.annualValue?.value || 0;
      default:
        return 0;
    }
  };

  const totalAnnualBenefit = benefits.reduce((sum, b) => sum + calculateBenefitValue(b), 0);

  const BENEFIT_LABELS: Record<BenefitType, string> = {
    TIME_SAVINGS: 'Zeiteinsparungen',
    ERROR_REDUCTION: 'Fehlerreduktion',
    REVENUE: 'Umsatzsteigerung',
    COST_REDUCTION: 'Kosteneinsparung',
    OTHER: 'Sonstige Effekte',
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Nutzeneffekte</h2>
        <p className="text-gray-600">
          Definieren Sie die wirtschaftlichen Effekte der Investition
        </p>
      </div>

      {/* Type Selector */}
      {showTypeSelector ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">Wählen Sie einen Nutzeneffekt:</p>
            <button
              onClick={() => setShowTypeSelector(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {(['TIME_SAVINGS', 'ERROR_REDUCTION', 'REVENUE', 'COST_REDUCTION'] as BenefitType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAddBenefit(type)}
              className="card p-4 text-left hover:shadow-md transition w-full"
            >
              <h3 className="font-semibold text-gray-900">{BENEFIT_LABELS[type]}</h3>
              <p className="text-sm text-gray-600">{BENEFIT_TEMPLATES[type].description}</p>
            </button>
          ))}
        </div>
      ) : null}

      {/* Benefits List */}
      <div className="space-y-4 mb-6">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="card overflow-hidden">
            <button
              onClick={() => toggleExpanded(benefit.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">{benefit.name}</h3>
                <p className="text-sm text-gray-500">{BENEFIT_LABELS[benefit.type]}</p>
              </div>
              <div className="text-right mr-4">
                <p className="font-semibold text-gray-900">
                  €{calculateBenefitValue(benefit).toLocaleString('de-DE')}
                </p>
                <p className="text-xs text-gray-500">/Jahr</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBenefit(benefit.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedBlocks.has(benefit.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedBlocks.has(benefit.id) && (
              <div className="px-4 pb-4 border-t border-gray-200 space-y-4 bg-gray-50">
                {/* Name and Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      className="input"
                      value={benefit.name}
                      onChange={(e) => handleUpdateBenefit(benefit.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Zuversicht</label>
                    <select
                      className="input"
                      value={benefit.confidence}
                      onChange={(e) => handleUpdateBenefit(benefit.id, 'confidence', e.target.value)}
                    >
                      <option value="LOW">Niedrig (±50%)</option>
                      <option value="MEDIUM">Mittel (±30%)</option>
                      <option value="HIGH">Hoch (±10%)</option>
                    </select>
                  </div>
                </div>

                {/* Parameters */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Parameter</p>
                  {Object.entries(benefit.parameters).map(([key, param]) => (
                    <div key={key} className="bg-white rounded p-3">
                      <label className="label text-sm mb-2">{param.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="input flex-1"
                          min={param.min}
                          max={param.max}
                          step={param.unit === '%' ? 1 : 'any'}
                          value={param.value}
                          onChange={(e) => handleUpdateParameter(benefit.id, key, parseFloat(e.target.value))}
                        />
                        <span className="text-sm text-gray-600 w-12 text-right">{param.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formula Info */}
                <div className="bg-white rounded p-3 text-sm border-l-4 border-blue-500">
                  <p className="text-gray-700">
                    <span className="font-medium">Berechnung:</span> {benefit.formulaText}
                  </p>
                </div>

                {/* Adoption */}
                <div className="bg-white rounded p-3 space-y-3">
                  <div>
                    <label className="label text-sm mb-2">Adoptionsmuster</label>
                    <select
                      className="input"
                      value={benefit.adoption.pattern}
                      onChange={(e) =>
                        handleUpdateBenefit(benefit.id, 'adoption', {
                          ...benefit.adoption,
                          pattern: e.target.value as AdoptionPattern,
                        })
                      }
                    >
                      <option value="IMMEDIATE">Sofort verfügbar</option>
                      <option value="LINEAR">Linear über Monate</option>
                      <option value="SCURVE">S-Kurve (beschleunigend)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm mb-2">Monate bis volle Adoption</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max="36"
                      value={benefit.adoption.fullAdoptionMonth}
                      onChange={(e) =>
                        handleUpdateBenefit(benefit.id, 'adoption', {
                          ...benefit.adoption,
                          fullAdoptionMonth: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add button or empty state */}
      {benefits.length === 0 && !showTypeSelector && (
        <div className="card p-8 text-center mb-6">
          <p className="text-gray-600 mb-6">Noch keine Nutzeneffekte hinzugefügt</p>
          <button onClick={() => setShowTypeSelector(true)} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" />
            Ersten Nutzeneffekt hinzufügen
          </button>
        </div>
      )}

      {benefits.length > 0 && !showTypeSelector && (
        <button
          onClick={() => setShowTypeSelector(true)}
          className="card p-4 border-2 border-dashed border-gray-300 hover:border-brand-500 flex items-center justify-center gap-2 text-gray-600 hover:text-brand-600 transition-colors w-full mb-6"
        >
          <Plus className="w-5 h-5" />
          Weiterer Nutzeneffekt hinzufügen
        </button>
      )}

      {/* Summary */}
      {benefits.length > 0 && (
        <div className="mt-6 card p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Gesamter jährlicher Nutzen (geschätzt)</p>
              <p className="heading-3 text-green-600">
                €{totalAnnualBenefit.toLocaleString('de-DE')}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{benefits.length} Nutzeneffekt(e)</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={handleNext} className="btn-primary ml-auto">
          Weiter zu Szenarien
        </button>
      </div>
    </div>
  );
}
