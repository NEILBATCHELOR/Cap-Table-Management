import { Currency } from "@/types/token";

// Define the structure for subscription template data
export interface SubscriptionTemplateRow {
  investorName: string;
  fiatAmount: number;
  currency: Currency;
  status: "Confirmed" | "Unconfirmed";
  subscriptionId: string;
  subscriptionDate: string;
  notes?: string;
}

// Generate a template for subscription CSV
export const generateSubscriptionTemplate = (): string => {
  const headers = [
    "Investor Name",
    "FIAT Amount",
    "Currency",
    "Status",
    "Subscription ID",
    "Subscription Date",
    "Notes",
  ];

  const examples: SubscriptionTemplateRow[] = [
    {
      investorName: "John Smith",
      fiatAmount: 10000,
      currency: "USD",
      status: "Confirmed",
      subscriptionId: "SUB-001",
      subscriptionDate: new Date().toISOString().split("T")[0],
      notes: "Initial investment",
    },
    {
      investorName: "Acme Capital",
      fiatAmount: 25000,
      currency: "EUR",
      status: "Unconfirmed",
      subscriptionId: "SUB-002",
      subscriptionDate: new Date().toISOString().split("T")[0],
      notes: "Pending wire transfer",
    },
    {
      investorName: "Jane Doe",
      fiatAmount: 15000,
      currency: "GBP",
      status: "Confirmed",
      subscriptionId: "SUB-003",
      subscriptionDate: new Date().toISOString().split("T")[0],
      notes: "Second round",
    },
  ];

  // Convert examples to CSV rows
  const rows = examples.map((example) => [
    example.investorName,
    example.fiatAmount.toString(),
    example.currency,
    example.status,
    example.subscriptionId,
    example.subscriptionDate,
    example.notes || "",
  ]);

  // Combine headers and rows
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
};

// Parse subscription CSV data
export const parseSubscriptionCSV = (
  csvText: string,
): { data: SubscriptionTemplateRow[]; errors: string[] } => {
  const errors: string[] = [];
  const data: SubscriptionTemplateRow[] = [];

  try {
    // Split by lines and determine delimiter
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      errors.push("CSV file is empty");
      return { data, errors };
    }

    // Determine delimiter
    const firstLine = lines[0];
    let delimiter = ",";
    if (firstLine.includes(";")) delimiter = ";";
    if (firstLine.includes("\t")) delimiter = "\t";

    // Parse headers
    const headers = firstLine.split(delimiter).map((h) => h.trim());
    const requiredHeaders = [
      "Investor Name",
      "FIAT Amount",
      "Currency",
      "Subscription ID",
    ];

    // Check for required headers
    const missingHeaders = requiredHeaders.filter(
      (h) =>
        !headers.some((header) => header.toLowerCase() === h.toLowerCase()),
    );

    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(", ")}`);
      return { data, errors };
    }

    // Find column indices
    const nameIndex = headers.findIndex(
      (h) => h.toLowerCase() === "investor name".toLowerCase(),
    );
    const amountIndex = headers.findIndex(
      (h) => h.toLowerCase() === "fiat amount".toLowerCase(),
    );
    const currencyIndex = headers.findIndex(
      (h) => h.toLowerCase() === "currency".toLowerCase(),
    );
    const statusIndex = headers.findIndex(
      (h) => h.toLowerCase() === "status".toLowerCase(),
    );
    const idIndex = headers.findIndex(
      (h) => h.toLowerCase() === "subscription id".toLowerCase(),
    );
    const dateIndex = headers.findIndex(
      (h) => h.toLowerCase() === "subscription date".toLowerCase(),
    );
    const notesIndex = headers.findIndex(
      (h) => h.toLowerCase() === "notes".toLowerCase(),
    );

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(delimiter).map((v) => v.trim());

      // Skip rows with incorrect number of columns
      if (values.length !== headers.length) {
        errors.push(
          `Row ${i}: Incorrect number of columns (expected ${headers.length}, got ${values.length})`,
        );
        continue;
      }

      // Validate currency
      const currency = values[currencyIndex];
      if (!["USD", "EUR", "GBP"].includes(currency)) {
        errors.push(
          `Row ${i}: Invalid currency '${currency}'. Must be USD, EUR, or GBP`,
        );
        continue;
      }

      // Validate amount
      const amount = parseFloat(values[amountIndex]);
      if (isNaN(amount) || amount <= 0) {
        errors.push(
          `Row ${i}: Invalid FIAT amount '${values[amountIndex]}'. Must be a positive number`,
        );
        continue;
      }

      // Validate status if provided
      let status = values[statusIndex] || "Unconfirmed";
      if (status && !["Confirmed", "Unconfirmed"].includes(status)) {
        errors.push(
          `Row ${i}: Invalid status '${status}'. Must be 'Confirmed' or 'Unconfirmed'`,
        );
        continue;
      }

      // Create subscription object
      const subscription: SubscriptionTemplateRow = {
        investorName: values[nameIndex],
        fiatAmount: amount,
        currency: currency as Currency,
        status: status as "Confirmed" | "Unconfirmed",
        subscriptionId: values[idIndex],
        subscriptionDate:
          values[dateIndex] || new Date().toISOString().split("T")[0],
        notes: notesIndex >= 0 ? values[notesIndex] : undefined,
      };

      data.push(subscription);
    }
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error.message}`);
  }

  return { data, errors };
};
