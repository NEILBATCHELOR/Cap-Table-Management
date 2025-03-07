import { InvestorType } from "@/types/investor";

// Define investor type categories
const INSTITUTIONAL_TYPES = [
  "Pension Fund",
  "Sovereign Wealth Fund",
  "Insurance Company",
  "Endowment & Foundation",
  "Asset Manager & Mutual Fund",
  "Hedge Fund",
  "Private Equity & Venture Capital",
  "Family Office",
  "Bank & Investment Firm",
  "Institution",
];

const RETAIL_TYPES = [
  "High-Net-Worth Individual",
  "Mass Affluent Investor",
  "Individual",
];

const CORPORATE_TYPES = [
  "Corporate & Conglomerate",
  "Private Company & Holding",
  "Strategic Investor",
];

const GOVERNMENT_TYPES = [
  "Sovereign Wealth Fund",
  "Development Finance Institution",
  "Government Investment Vehicle",
  "Multilateral Institution",
];

const ALTERNATIVE_TYPES = [
  "Real Estate Investment Trust",
  "Infrastructure Investor",
  "Commodities & Natural Resources Fund",
  "Distressed & Special Situations Investor",
  "Quantitative & Algorithmic Investor",
];

const DIGITAL_TYPES = ["Institutional Crypto Investor"];

/**
 * Returns the category for a given investor type
 */
export function getInvestorTypeCategory(type: string): string {
  // Normalize the type string for case-insensitive comparison
  const normalizedType = type.trim();

  if (
    INSTITUTIONAL_TYPES.some(
      (t) => t.toLowerCase() === normalizedType.toLowerCase(),
    )
  ) {
    return "Institutional";
  } else if (
    RETAIL_TYPES.some((t) => t.toLowerCase() === normalizedType.toLowerCase())
  ) {
    return "Retail";
  } else if (
    CORPORATE_TYPES.some(
      (t) => t.toLowerCase() === normalizedType.toLowerCase(),
    )
  ) {
    return "Corporate";
  } else if (
    GOVERNMENT_TYPES.some(
      (t) => t.toLowerCase() === normalizedType.toLowerCase(),
    )
  ) {
    return "Government";
  } else if (
    ALTERNATIVE_TYPES.some(
      (t) => t.toLowerCase() === normalizedType.toLowerCase(),
    )
  ) {
    return "Alternative";
  } else if (
    DIGITAL_TYPES.some((t) => t.toLowerCase() === normalizedType.toLowerCase())
  ) {
    return "Digital";
  }

  // Log the type that wasn't matched for debugging
  console.log(`Investor type not categorized: ${type}`);
  return "Other";
}

/**
 * Returns all investor types grouped by category
 */
export function getInvestorTypesByCategory() {
  return {
    institutional: INSTITUTIONAL_TYPES,
    retail: RETAIL_TYPES,
    corporate: CORPORATE_TYPES,
    government: GOVERNMENT_TYPES,
    alternative: ALTERNATIVE_TYPES,
    digital: DIGITAL_TYPES,
  };
}

/**
 * Returns all investor types as a flat array
 */
export function getAllInvestorTypes(): string[] {
  return [
    ...INSTITUTIONAL_TYPES,
    ...RETAIL_TYPES,
    ...CORPORATE_TYPES,
    ...GOVERNMENT_TYPES,
    ...ALTERNATIVE_TYPES,
    ...DIGITAL_TYPES,
  ];
}
