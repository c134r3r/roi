import { Download, Share2, TrendingUp, PieChart, BarChart3, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { Investment } from '@roi/shared';
import { useEffect, useRef } from 'react';

interface ResultsStepProps {
  onBack: () => void;
  onNewProject: () => void;
}

function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

function formatMonths(value: number): string {
  const years = Math.floor(value);
  const months = Math.round((value - years) * 12);
  if (years === 0) return `${months}M`;
  if (months === 0) return `${years}Y`;
  return `${years}Y ${months}M`;
}

function KPICard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  };

  return (
    <div className={`card border-l-4 border-current p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {unit && <p className="text-xs opacity-60 mt-1">{unit}</p>}
        </div>
        <div className="text-3xl opacity-30">{icon}</div>
      </div>
    </div>
  );
}

function CashflowChart({ investment }: { investment: Investment }) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      const ctx = chartRef.current?.getContext('2d');
      if (!ctx) return;

      const years = investment.cashflows.map((cf) => `Jahr ${cf.year}`);
      const costs = investment.cashflows.map((cf) => -cf.costs);
      const benefits = investment.cashflows.map((cf) => cf.benefits);
      const netCashflow = investment.cashflows.map((cf) => cf.netCashflow);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Kosten',
              data: costs,
              backgroundColor: '#ef4444',
              borderRadius: 4,
            },
            {
              label: 'Nutzen',
              data: benefits,
              backgroundColor: '#22c55e',
              borderRadius: 4,
            },
            {
              label: 'Netto Cashflow',
              data: netCashflow,
              type: 'line',
              borderColor: '#3b82f6',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#3b82f6',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'top' as const,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return formatCurrency(value as number);
                },
              },
            },
          },
        },
      });
    });
  }, [investment]);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Cashflow Analyse
      </h3>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

function ScenarioComparison({ investment, currency }: { investment: Investment; currency: string }) {
  if (investment.scenarios.length === 0) {
    return null;
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <PieChart className="w-5 h-5" />
        Szenario-Vergleich
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold">Szenario</th>
              <th className="text-right py-3 px-4">ROI</th>
              <th className="text-right py-3 px-4">NPV</th>
              <th className="text-right py-3 px-4">IRR</th>
              <th className="text-right py-3 px-4">Payback</th>
            </tr>
          </thead>
          <tbody>
            {investment.scenarios.map((scenario) => (
              <tr key={scenario.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{scenario.name}</td>
                <td className="text-right py-3 px-4">{formatPercentage(scenario.computedKPIs.roi)}</td>
                <td className="text-right py-3 px-4 text-green-600 font-semibold">
                  {formatCurrency(scenario.computedKPIs.npv, currency)}
                </td>
                <td className="text-right py-3 px-4">{formatPercentage(scenario.computedKPIs.irr)}</td>
                <td className="text-right py-3 px-4">{formatMonths(scenario.computedKPIs.paybackPeriod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SensitivityAnalysis({ investment }: { investment: Investment }) {
  if (!investment.sensitivity || investment.sensitivity.drivers.length === 0) {
    return null;
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Sensitivitätsanalyse (Top Driver)
      </h3>
      <div className="space-y-4">
        {investment.sensitivity.drivers.slice(0, 5).map((driver, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{driver.name}</span>
              <span className="text-sm text-gray-600">{formatPercentage(driver.impact)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: `${Math.min(driver.impact, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalculationExplanation({ currency }: { currency: string }) {
  return (
    <div className="card p-6 bg-blue-50 border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
        <TrendingUp className="w-5 h-5" />
        Herleitung der Kennzahlen
      </h3>
      <div className="space-y-3 text-sm text-blue-900">
        <div>
          <p className="font-medium">ROI (Return on Investment):</p>
          <p className="text-xs opacity-75">
            Prozentuale Rendite basierend auf dem investierten Kapital über den Analysehorizont
          </p>
        </div>
        <div>
          <p className="font-medium">NPV (Netto-Gegenwartswert):</p>
          <p className="text-xs opacity-75">
            Summe aller diskontierten Cashflows abzüglich der Anfangsinvestition
          </p>
        </div>
        <div>
          <p className="font-medium">IRR (Interner Zinssatz):</p>
          <p className="text-xs opacity-75">
            Zinssatz, bei dem der NPV gleich Null ist
          </p>
        </div>
        <div>
          <p className="font-medium">Payback Period:</p>
          <p className="text-xs opacity-75">
            Zeitraum, bis sich die Investition amortisiert hat
          </p>
        </div>
        <div>
          <p className="font-medium">Profitability Index:</p>
          <p className="text-xs opacity-75">
            NPV / Anfangsinvestition
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResultsStep({ onBack, onNewProject }: ResultsStepProps) {
  const { currentProject } = useAppStore();
  const investment = currentProject?.investments[0];
  const currency = currentProject?.settings.currency || 'EUR';

  if (!currentProject || !investment) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <p className="text-gray-600">Keine Ergebnisse verfügbar</p>
        <button onClick={onBack} className="btn-secondary mt-4">
          Zurück
        </button>
      </div>
    );
  }

  const kpis = investment.computedKPIs;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Analyseergebnisse: {currentProject.title}</h2>
        <p className="text-gray-600">{currentProject.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          label="ROI"
          value={formatPercentage(kpis.roi)}
          unit="Return on Investment"
          icon="📈"
          color="green"
        />
        <KPICard
          label="NPV"
          value={formatCurrency(kpis.npv, currency)}
          unit="Netto-Gegenwartswert"
          icon="💰"
          color="blue"
        />
        <KPICard
          label="IRR"
          value={formatPercentage(kpis.irr)}
          unit="Interner Zinssatz"
          icon="📊"
          color="purple"
        />
        <KPICard
          label="Payback"
          value={formatMonths(kpis.paybackPeriod)}
          unit="Amortisationsdauer"
          icon="⏱️"
          color="amber"
        />
      </div>

      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Detaillierte Kennzahlen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Absoluter ROI</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(kpis.roiAbsolute, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Diskontierter Payback</p>
            <p className="text-2xl font-bold text-amber-600">{formatMonths(kpis.discountedPayback)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Profitability Index</p>
            <p className="text-2xl font-bold text-blue-600">{kpis.profitabilityIndex.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <CashflowChart investment={investment} />
        {investment.scenarios.length > 0 && (
          <ScenarioComparison investment={investment} currency={currency} />
        )}
      </div>

      {investment.sensitivity?.drivers.length > 0 && (
        <div className="mb-8">
          <SensitivityAnalysis investment={investment} />
        </div>
      )}

      <div className="mb-8">
        <CalculationExplanation currency={currency} />
      </div>

      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Exportieren</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="btn-primary flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Als PDF exportieren
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            Zu Google Slides exportieren
          </button>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={onNewProject} className="btn-primary ml-auto">
          Neue Analyse
        </button>
      </div>
    </div>
  );
}