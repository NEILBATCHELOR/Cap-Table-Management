export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidEthAddress = (address: string): boolean => {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
};

export const isValidCurrency = (currency: string): boolean => {
  return ["USD", "EUR", "GBP"].includes(currency);
};

export const isValidTokenType = (tokenType: string): boolean => {
  return ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525"].includes(
    tokenType,
  );
};

export const isValidSubscriptionStatus = (status: string): boolean => {
  return ["Confirmed", "Unconfirmed"].includes(status);
};

export const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

// Import at the top level of the file
import { getAllInvestorTypes } from "@/types/investorTypeCategory";

export const validateCSVRow = (row: any, rowIndex: number): string[] => {
  // Return empty array - validation disabled
  return [];
};

export const validateSubscriptionCSVRow = (
  row: any,
  rowIndex: number,
): string[] => {
  const errors: string[] = [];

  if (!row["investor name"])
    errors.push(`Row ${rowIndex}: Investor Name is required`);

  if (!row["fiat amount"] || !isValidAmount(row["fiat amount"])) {
    errors.push(`Row ${rowIndex}: Invalid FIAT amount: ${row["fiat amount"]}`);
  }

  if (!row.currency || !isValidCurrency(row.currency)) {
    errors.push(
      `Row ${rowIndex}: Invalid currency: ${row.currency}. Must be USD, EUR, or GBP`,
    );
  }

  if (row.status && !isValidSubscriptionStatus(row.status)) {
    errors.push(
      `Row ${rowIndex}: Invalid status: ${row.status}. Must be Confirmed or Unconfirmed`,
    );
  }

  if (!row["subscription id"]) {
    errors.push(`Row ${rowIndex}: Subscription ID is required`);
  }

  // Validate subscription date if provided
  if (row["subscription date"]) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row["subscription date"])) {
      errors.push(
        `Row ${rowIndex}: Invalid date format: ${row["subscription date"]}. Must be YYYY-MM-DD`,
      );
    } else {
      // Check if it's a valid date
      const date = new Date(row["subscription date"]);
      if (isNaN(date.getTime())) {
        errors.push(
          `Row ${rowIndex}: Invalid date: ${row["subscription date"]}`,
        );
      }
    }
  }

  return errors;
};
