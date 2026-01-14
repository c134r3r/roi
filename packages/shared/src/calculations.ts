/**
 * ROI Calculator - Calculation Engine
 */

import {
  Investment,
  KPIs,
  CashflowYear,
  Scenario,
  ConfidenceLevel,
} from './types.js';

const CONFIDENCE_BANDS: Record<ConfidenceLevel, { low: number; high: number }> = {
  LOW: { low: 0.5, high: 0.7 },
  MEDIUM: { low: 0.3, high: 0.3 },
  HIGH: { low: 0.1, high: 0.1 },
};

/**
 * Berechnet den Adoptionsfaktor basierend auf Muster und Zeitpunkt
 */
export function computeAdoptionFactor(
  fullAdoptionMonth: number,
  monthIndex: number,
  pattern: 'LINEAR' | 'SCURVE' | 'IMMEDIATE'
): number {
  if (monthIndex >= fullAdoptionMonth) return 1.0;
  if (monthIndex < 0) return 0;

  switch (pattern) {
    case 'LINEAR':
      return Math.min(1, monthIndex / fullAdoptionMonth);
    case 'SCURVE':
      // Sigmoid-ähnliche S-Kurve
      return sigmoid((monthIndex - fullAdoptionMonth / 2) / 3);
    case 'IMMEDIATE':
      return 1.0;
  }
}

/**
 * Sigmoid-Funktion für S-Kurven-Adoption
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Berechnet NPV (Nettobarwert)
 */
export function computeNPV(cashflows: number[], discountRate: number): number {
  return cashflows.reduce((sum, cf, year) => {
    const discountFactor = 1 / Math.pow(1 + discountRate, year);
    return sum + cf * discountFactor;
  }, 0);
}

/**
 * Berechnet IRR (Interner Zinsfuß) mittels Newton-Raphson
 */
export function computeIRR(cashflows: number[], maxIterations = 100, tolerance = 0.0001): number {
  // Validiere Cashflows - wenn alle negativ, gibt es keine IRR
  const hasPositive = cashflows.some(cf => cf > 0);
  if (!hasPositive) {
    return 0; // Keine Einnahmen möglich, IRR = 0%
  }

  let rate = 0.1; // Startwert 10%

  for (let i = 0; i < maxIterations; i++) {
    const npv = computeNPV(cashflows, rate);
    const npvDerivative = computeNPVDerivative(cashflows, rate);

    if (Math.abs(npvDerivative) < 1e-10) break;

    const newRate = rate - npv / npvDerivative;

    // Begrenze Rate auf -0.99 bis 10 um zu verhindern, dass sie explodiert
    if (newRate < -0.99) {
      return 0;
    }
    if (newRate > 10) {
      return 0; // Unrealistisch hohe Werte = kein Konvergenz
    }

    if (Math.abs(newRate - rate) < tolerance) {
      // Validiere das Ergebnis
      return isNaN(newRate) || !isFinite(newRate) ? 0 : newRate;
    }

    rate = newRate;
  }

  // Nach allen Iterationen - wenn nicht konvergiert, gib 0 zurück
  return (isNaN(rate) || !isFinite(rate) || Math.abs(rate) > 10) ? 0 : rate;
}

/**
 * NPV-Ableitung für Newton-Raphson
 */
function computeNPVDerivative(cashflows: number[], discountRate: number): number {
  return cashflows.reduce((sum, cf, year) => {
    const discountFactor = 1 / Math.pow(1 + discountRate, year + 1);
    return sum - year * cf * discountFactor;
  }, 0);
}

/**
 * Berechnet Amortisationszeit (einfach)
 */
export function computePaybackPeriod(cashflows: number[]): number {
  let cumulative = 0;

  for (let i = 0; i < cashflows.length; i++) {
    cumulative += cashflows[i];
    if (cumulative >= 0) {
      const previousCumulative = cumulative - cashflows[i];
      if (cashflows[i] === 0) return Infinity;
      const fraction = -previousCumulative / cashflows[i];
      return i + fraction;
    }
  }

  return Infinity; // Payback nie erreicht
}

/**
 * Berechnet diskontierte Amortisationszeit
 */
export function computeDiscountedPayback(cashflows: number[], discountRate: number): number {
  let cumulative = 0;

  for (let i = 0; i < cashflows.length; i++) {
    const discountFactor = 1 / Math.pow(1 + discountRate, i);
    const discountedCF = cashflows[i] * discountFactor;
    cumulative += discountedCF;

    if (cumulative >= 0) {
      const previousCumulative = cumulative - discountedCF;
      if (discountedCF === 0) return Infinity;
      const fraction = -previousCumulative / discountedCF;
      return i + fraction;
    }
  }

  return Infinity;
}

/**
 * Berechnet KPIs aus Cashflows
 */
export function computeKPIsFromCashflows(
  cashflows: number[],
  discountRate: number,
  horizon: number
): KPIs {
  const totalBenefits = cashflows.reduce((sum, cf) => sum + Math.max(0, cf), 0);
  const totalCosts = Math.abs(cashflows.reduce((sum, cf) => sum + Math.min(0, cf), 0));
  const initialInvestment = Math.abs(cashflows[0]); // First year is usually negative

  const paybackPeriod = computePaybackPeriod(cashflows);
  const npv = computeNPV(cashflows, discountRate);
  const irr = computeIRR(cashflows);

  return {
    roi: totalCosts > 0 ? ((totalBenefits - totalCosts) / totalCosts) * 100 : 0,
    roiAbsolute: totalBenefits - totalCosts,
    paybackPeriod: paybackPeriod === Infinity ? horizon : paybackPeriod,
    paybackMonth: paybackPeriod === Infinity ? undefined : Math.round(paybackPeriod * 12),
    discountedPayback: computeDiscountedPayback(cashflows, discountRate),
    npv,
    irr: isNaN(irr) || !isFinite(irr) ? 0 : irr * 100,
    profitabilityIndex: initialInvestment > 0 ? npv / initialInvestment : 0,
  };
}

/**
 * Erzeugt Cashflows für ein Investment über einen Zeithorizont
 */
export function generateCashflows(
  investment: Investment,
  discountRate: number,
  horizon: number
): CashflowYear[] {
  const monthlyFlows = new Array(horizon * 12).fill(0);

  // Kosten hinzufügen
  for (const costBlock of investment.costs) {
    for (const item of costBlock.items) {
      const amount = item.unitPrice * item.quantity;
      const startMonth = item.startMonth || 0;

      if (item.frequency === 'ONE_TIME') {
        monthlyFlows[startMonth] -= amount;
      } else if (item.frequency === 'MONTHLY') {
        for (let month = startMonth; month < monthlyFlows.length; month++) {
          const yearsSinceStart = Math.floor(month / 12);
          const growth = costBlock.annualGrowth || 0;
          const adjustedAmount = amount * Math.pow(1 + growth, yearsSinceStart);
          monthlyFlows[month] -= adjustedAmount;
        }
      } else if (item.frequency === 'YEARLY') {
        for (let year = Math.floor(startMonth / 12); year < horizon; year++) {
          const month = year * 12;
          const growth = costBlock.annualGrowth || 0;
          const adjustedAmount = amount * Math.pow(1 + growth, year);
          monthlyFlows[month] -= adjustedAmount;
        }
      }
    }
  }

  // Nutzen hinzufügen (mit Adoption)
  for (const benefit of investment.benefits) {
    const benefitMonthly = benefit.cashflowByYear.map(yearlyAmount => yearlyAmount / 12);

    for (let month = 0; month < monthlyFlows.length; month++) {
      const yearIndex = Math.floor(month / 12);
      if (yearIndex < benefitMonthly.length) {
        const adoptionFactor = computeAdoptionFactor(
          benefit.adoption.fullAdoptionMonth,
          month,
          benefit.adoption.pattern
        );
        monthlyFlows[month] += benefitMonthly[yearIndex] * adoptionFactor;
      }
    }
  }

  // Zu jährlichen Cashflows aggregieren
  const cashflows: CashflowYear[] = [];

  for (let year = 0; year < horizon; year++) {
    const startMonth = year * 12;
    const endMonth = Math.min((year + 1) * 12, monthlyFlows.length);

    let costs = 0;
    let benefits = 0;
    let netCashflow = 0;

    for (let month = startMonth; month < endMonth; month++) {
      const monthlyValue = monthlyFlows[month];
      if (monthlyValue < 0) {
        costs += monthlyValue;
      } else {
        benefits += monthlyValue;
      }
      netCashflow += monthlyValue;
    }

    const discountFactor = 1 / Math.pow(1 + discountRate, year);
    const discountedCashflow = netCashflow * discountFactor;

    const cumulative = cashflows.length > 0
      ? cashflows[cashflows.length - 1].cumulativeCashflow + netCashflow
      : netCashflow;

    cashflows.push({
      year: year + 1,
      costs,
      benefits,
      netCashflow,
      cumulativeCashflow: cumulative,
      discountedCashflow,
      discountFactor,
    });
  }

  return cashflows;
}

/**
 * Berechnet alle KPIs für ein Investment
 */
export function computeInvestment(investment: Investment, discountRate: number, horizon: number): void {
  const cashflows = generateCashflows(investment, discountRate, horizon);
  const cashflowValues = cashflows.map(cf => cf.netCashflow);

  investment.cashflows = cashflows;
  investment.computedKPIs = computeKPIsFromCashflows(cashflowValues, discountRate, horizon);

  // Generiere Standard-Szenarien
  investment.scenarios = generateScenarios(investment, discountRate, horizon);

  // Berechne Sensitivität
  investment.sensitivity = computeSensitivity(investment, discountRate, horizon);
}

/**
 * Generiert Conservative/Realistic/Optimistic Szenarien automatisch
 */
export function generateScenarios(investment: Investment, discountRate: number, horizon: number): Scenario[] {
  const scenarios: Scenario[] = [];

  // Conservative Szenario
  const conservativeOverrides: Record<string, number> = {};
  for (const benefit of investment.benefits) {
    const band = benefit.confidenceBand || CONFIDENCE_BANDS[benefit.confidence];
    conservativeOverrides[benefit.id] = -band.low; // z.B. -50%
  }
  conservativeOverrides['costInflation'] = 0.2; // +20% Kosten
  conservativeOverrides['adoptionDelay'] = 2; // +2 Monate

  scenarios.push({
    id: 'conservative',
    name: 'Conservative',
    type: 'CONSERVATIVE',
    overrides: conservativeOverrides,
    computedKPIs: applyScenarioAndCompute(investment, conservativeOverrides, discountRate, horizon),
  });

  // Realistic Szenario (Basis)
  scenarios.push({
    id: 'realistic',
    name: 'Realistic',
    type: 'REALISTIC',
    overrides: {},
    computedKPIs: investment.computedKPIs,
  });

  // Optimistic Szenario
  const optimisticOverrides: Record<string, number> = {};
  for (const benefit of investment.benefits) {
    const band = benefit.confidenceBand || CONFIDENCE_BANDS[benefit.confidence];
    optimisticOverrides[benefit.id] = band.high; // z.B. +30%
  }

  scenarios.push({
    id: 'optimistic',
    name: 'Optimistic',
    type: 'OPTIMISTIC',
    overrides: optimisticOverrides,
    computedKPIs: applyScenarioAndCompute(investment, optimisticOverrides, discountRate, horizon),
  });

  return scenarios;
}

/**
 * Wendet ein Szenario an und berechnet KPIs
 */
function applyScenarioAndCompute(
  investment: Investment,
  overrides: Record<string, number>,
  discountRate: number,
  horizon: number
): KPIs {
  // Get special overrides
  const costInflation = overrides['costInflation'] || 0;
  const adoptionDelay = overrides['adoptionDelay'] || 0;

  // Create a deep copy of the investment with modified benefits and costs
  const modifiedInvestment = JSON.parse(JSON.stringify(investment));

  // Apply cost inflation
  for (const costBlock of modifiedInvestment.costs) {
    costBlock.annualGrowth = (costBlock.annualGrowth || 0) + costInflation;
  }

  // Apply benefit-specific overrides by modifying cashflowByYear
  for (const [key, factor] of Object.entries(overrides)) {
    // Skip special overrides
    if (key === 'costInflation' || key === 'adoptionDelay') continue;

    const benefitIndex = modifiedInvestment.benefits.findIndex((b: any) => b.id === key);
    if (benefitIndex >= 0) {
      const benefit = modifiedInvestment.benefits[benefitIndex];
      // Apply percentage adjustment to each year's cashflow
      benefit.cashflowByYear = benefit.cashflowByYear.map((amount: number) =>
        amount * (1 + factor)
      );
    }
  }

  // Apply adoption delay by modifying the adoption start month
  if (adoptionDelay > 0) {
    for (const benefit of modifiedInvestment.benefits) {
      benefit.adoption.fullAdoptionMonth += adoptionDelay;
    }
  }

  // Generate cashflows with modified investment
  const modifiedCashflows = generateCashflows(modifiedInvestment, discountRate, horizon);
  const modifiedCashflowValues = modifiedCashflows.map(cf => cf.netCashflow);

  return computeKPIsFromCashflows(modifiedCashflowValues, discountRate, horizon);
}

/**
 * Berechnet Sensitivitätsanalyse (Tornado)
 */
export function computeSensitivity(investment: Investment, discountRate: number, horizon: number): any {
  const drivers = [];

  // Analysiere Top-5 Benefits nach Höhe
  const sortedBenefits = [...investment.benefits]
    .sort((a, b) => {
      const sumA = a.cashflowByYear.reduce((sum, val) => sum + val, 0);
      const sumB = b.cashflowByYear.reduce((sum, val) => sum + val, 0);
      return sumB - sumA;
    })
    .slice(0, 5);

  for (const benefit of sortedBenefits) {
    const downOverrides = { [benefit.id]: -0.3 };
    const upOverrides = { [benefit.id]: 0.3 };

    const downKPI = applyScenarioAndCompute(investment, downOverrides, discountRate, horizon).roi;
    const upKPI = applyScenarioAndCompute(investment, upOverrides, discountRate, horizon).roi;

    drivers.push({
      name: benefit.name,
      impact: upKPI - downKPI,
      range: [downKPI, upKPI],
    });
  }

  return {
    drivers: drivers.sort((a, b) => b.impact - a.impact),
  };
}

/**
 * Generiert Projekt-Narrative basierend auf KPIs
 */
export function generateNarrative(investment: Investment): string {
  const { computedKPIs, benefits, scenarios } = investment;
  const topBenefits = [...benefits]
    .sort((a, b) => {
      const sumA = a.cashflowByYear.reduce((s, v) => s + v, 0);
      const sumB = b.cashflowByYear.reduce((s, v) => s + v, 0);
      return sumB - sumA;
    })
    .slice(0, 3);

  const conservative = scenarios.find(s => s.type === 'CONSERVATIVE');
  const optimistic = scenarios.find(s => s.type === 'OPTIMISTIC');

  const topBenefitsText = topBenefits.map(b => `${b.name} (€${Math.round(b.cashflowByYear[0] / 1000)}k/Yr)`).join(', ');

  let recommendation = 'GO';
  if (computedKPIs.roi < 30) recommendation = 'HOLD';
  if (computedKPIs.roi < 0) recommendation = 'NO-GO';

  return `Die ${investment.name}-Implementierung generiert einen ROI von ${Math.round(computedKPIs.roi)}% über den Zeithorizont mit einer Amortisationsdauer von ${computedKPIs.paybackPeriod.toFixed(1)} Jahren. Die Haupttreiber sind ${topBenefitsText}. Das Hauptrisiko ist die Adoptionsquote: Im konservativen Szenario sinkt das ROI auf ${Math.round(conservative?.computedKPIs.roi || 0)}%, im optimistischen auf ${Math.round(optimistic?.computedKPIs.roi || 0)}%. Empfehlung: ${recommendation}.`;
}
