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

export const validateCSVRow = (row: any, rowIndex: number): string[] => {
  const errors: string[] = [];

  if (!row.name) errors.push(`Row ${rowIndex}: Name is required`);
  if (!row.email || !isValidEmail(row.email))
    errors.push(`Row ${rowIndex}: Invalid email format: ${row.email}`);
  if (!row.wallet || !isValidEthAddress(row.wallet))
    errors.push(
      `Row ${rowIndex}: Invalid wallet address format: ${row.wallet}`,
    );
  // Validate investor type
  const validInvestorTypes = [
    "Pension Fund",
    "Sovereign Wealth Fund",
    "Insurance Company",
    "Endowment & Foundation",
    "Asset Manager & Mutual Fund",
    "Hedge Fund",
    "Private Equity & Venture Capital",
    "Family Office",
    "Bank & Investment Firm",
    "High-Net-Worth Individual",
    "Mass Affluent Investor",
    "Corporate & Conglomerate",
    "Private Company & Holding",
    "Strategic Investor",
    "Development Finance Institution",
    "Government Investment Vehicle",
    "Multilateral Institution",
    "Real Estate Investment Trust",
    "Infrastructure Investor",
    "Commodities & Natural Resources Fund",
    "Distressed & Special Situations Investor",
    "Quantitative & Algorithmic Investor",
    "Institutional Crypto Investor",
    "Individual",
    "Institution",
  ];

  if (row.type && !validInvestorTypes.includes(row.type)) {
    errors.push(`Row ${rowIndex}: Invalid investor type: ${row.type}`);
  }
  if (row.country && row.country.length !== 2 && row.country.length !== 3) {
    errors.push(
      `Row ${rowIndex}: Country should be a 2 or 3 letter code, got: ${row.country}`,
    );
  }

  return errors;
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
