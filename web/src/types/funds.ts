export type FundCategory = "Flexi Cap" | "Small Cap" | "Large Cap" | "Index Funds" | "ELSS Tax Saver" | "Mid Cap";
export type RiskLevel = "Low" | "Moderate" | "Moderately High" | "High" | "Very High";

export interface MutualFundInfo {
  id: string;
  name: string;
  category: FundCategory;
  fundHouse: string;
  nav: number;
  aumCr: number;
  expenseRatio: number;
  cagr1y: number;
  cagr3y: number;
  cagr5y: number;
  risk: RiskLevel;
  minSipAmount: number;
  rating: number; // 1-5 stars
  benchmark: string;
}

export interface SIPCalculationResult {
  monthlyInvestment: number;
  expectedAnnualReturnPercent: number;
  investmentPeriodYears: number;
  totalMonths: number;
  totalInvestedAmount: number;
  estimatedReturnsAmount: number;
  totalMaturityValue: number;
  wealthGainMultiplier: number;
}

/**
 * Calculates compound wealth from a Systematic Investment Plan (SIP).
 * Formula: M = P * (( (1 + i)^n - 1 ) / i) * (1 + i)
 * where P = monthly amount, i = monthly rate (r / 12 / 100), n = months
 */
export function calculateSIP(
  monthlyInvestment: number,
  expectedAnnualReturnPercent: number,
  investmentPeriodYears: number
): SIPCalculationResult {
  const p = Math.max(0, monthlyInvestment);
  const n = Math.max(1, Math.round(investmentPeriodYears * 12));
  const annualRate = Math.max(0.1, expectedAnnualReturnPercent);
  const i = annualRate / 12 / 100;

  const totalInvestedAmount = p * n;

  // Compounded value
  const factor = Math.pow(1 + i, n);
  const totalMaturityValue = p * ((factor - 1) / i) * (1 + i);
  const estimatedReturnsAmount = Math.max(0, totalMaturityValue - totalInvestedAmount);
  const wealthGainMultiplier = totalInvestedAmount > 0 ? totalMaturityValue / totalInvestedAmount : 1;

  return {
    monthlyInvestment: p,
    expectedAnnualReturnPercent: annualRate,
    investmentPeriodYears,
    totalMonths: n,
    totalInvestedAmount: Math.round(totalInvestedAmount),
    estimatedReturnsAmount: Math.round(estimatedReturnsAmount),
    totalMaturityValue: Math.round(totalMaturityValue),
    wealthGainMultiplier: parseFloat(wealthGainMultiplier.toFixed(2)),
  };
}
