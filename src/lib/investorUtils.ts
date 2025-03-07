import { InvestorType as InvestorTypeEnum } from "@/types/investor";
import {
  getAllInvestorTypes as getTypes,
  getInvestorTypeCategory as getCategory,
  investorTypeCategories,
} from "@/types/investorTypeCategory";

/**
 * Returns the category for a given investor type
 * @deprecated Use getCategory from @/types/investorTypeCategory instead
 */
export function getInvestorTypeCategory(type: string): string {
  return getCategory(type);
}

/**
 * Returns all investor types grouped by category
 */
export function getInvestorTypesByCategory() {
  return investorTypeCategories.reduce(
    (acc, category) => {
      acc[category.id] = category.types.map((type) => type.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );
}

/**
 * Returns all investor types as a flat array
 * @deprecated Use getAllInvestorTypes from @/types/investorTypeCategory instead
 */
export function getAllInvestorTypes(): string[] {
  return getTypes();
}
