import { InvestorCSV } from "@/types/investor";
import { validateCSVRow } from "./validators";

export const parseCSV = async (
  file: File,
  type: "investor" | "subscription" = "investor",
): Promise<{ data: any[]; errors: string[]; warnings: string[] }> => {
  console.log(
    `Parsing ${type} CSV file: ${file.name}, size: ${file.size} bytes`,
  );
  const text = await file.text();
  console.log(`CSV content length: ${text.length} characters`);

  let rows: string[][] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: any[] = [];

  try {
    // Handle different CSV formats (comma, semicolon, tab)
    const firstLine = text.split("\n")[0];
    console.log(`First line: ${firstLine}`);

    let delimiter = ",";
    if (firstLine.includes(";")) delimiter = ";";
    if (firstLine.includes("\t")) delimiter = "\t";
    console.log(`Detected delimiter: "${delimiter}"`);

    rows = text
      .split("\n")
      .filter((line) => line.trim() !== "") // Skip empty lines
      .map((row) => row.split(delimiter));

    console.log(`Found ${rows.length} rows in CSV`);

    if (rows.length === 0) {
      errors.push("CSV file is empty");
      return { data, errors, warnings };
    }

    // Normalize headers (trim, lowercase)
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    console.log(`Headers: ${headers.join(", ")}`);

    // Check for required headers based on type
    if (type === "investor") {
      const requiredHeaders = ["name", "email", "wallet"];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );
      if (missingHeaders.length > 0) {
        const error = `Missing required headers: ${missingHeaders.join(", ")}`;
        console.error(error);
        errors.push(error);
      }

      // Check for recommended headers
      const recommendedHeaders = ["type", "kyc status", "last updated"];
      const missingRecommendedHeaders = recommendedHeaders.filter(
        (h) => !headers.includes(h),
      );
      if (missingRecommendedHeaders.length > 0) {
        const warning = `Missing recommended headers: ${missingRecommendedHeaders.join(", ")}`;
        console.warn(warning);
        warnings.push(warning);
      }
    } else if (type === "subscription") {
      const requiredHeaders = [
        "investor name",
        "fiat amount",
        "currency",
        "subscription id",
      ];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );
      if (missingHeaders.length > 0) {
        const error = `Missing required headers: ${missingHeaders.join(", ")}`;
        console.error(error);
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      console.error(
        `Validation errors found, stopping processing: ${errors.join("; ")}`,
      );
      return { data, errors, warnings };
    }

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Processing row ${i}: ${row.join(", ")}`);

      // Check if row has enough columns
      if (row.length < headers.length) {
        const warning = `Row ${i}: Has fewer columns (${row.length}) than headers (${headers.length})`;
        console.warn(warning);
        warnings.push(warning);
      }

      // Create object from row
      const rowObj: any = {};
      headers.forEach((header, index) => {
        // Handle quoted values
        let value = row[index] ? row[index].trim() : "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        rowObj[header] = value;
      });

      // Validate required fields for investor type
      if (type === "investor") {
        if (!rowObj.name) {
          const warning = `Row ${i}: Missing name`;
          console.warn(warning);
          warnings.push(warning);
        }
        if (!rowObj.email) {
          const warning = `Row ${i}: Missing email`;
          console.warn(warning);
          warnings.push(warning);
        }
        if (!rowObj.wallet) {
          const warning = `Row ${i}: Missing wallet address`;
          console.warn(warning);
          warnings.push(warning);
        }
      }

      // Add row to data array
      data.push(rowObj);
      console.log(`Added row object:`, rowObj);
    }

    console.log(
      `Successfully parsed ${data.length} data rows with ${warnings.length} warnings`,
    );
  } catch (error) {
    const errorMsg = `Failed to parse CSV file: ${error.message}`;
    console.error(errorMsg, error);
    errors.push(errorMsg);
  }

  return { data, errors, warnings };
};

export const generateCSVFromInvestors = (
  investors: any[],
  options?: {
    includeKYC?: boolean;
    includeWallets?: boolean;
    includeTransactions?: boolean;
    format?: "csv" | "excel";
  },
): string => {
  const includeKYC = options?.includeKYC !== false;
  const includeWallets = options?.includeWallets !== false;
  const includeTransactions = options?.includeTransactions !== false;

  // Define all possible headers
  const allHeaders = [
    "Investor ID",
    "Name",
    "Email",
    "Type",
    "Wallet",
    "KYC Status",
    "KYC Expiry",
    "Country",
    "Accreditation Status",
    "Subscription ID",
    "Subscription Amount",
    "Currency",
    "Subscription Status",
    "Subscription Date",
    "Token Type",
    "Token Allocation",
    "Allocation Status",
    "Distribution Status",
    "Distribution Date",
    "Transaction Hash",
    "Notes",
  ];

  // Filter headers based on options
  const headers = allHeaders.filter((header) => {
    if (
      !includeKYC &&
      ["KYC Status", "KYC Expiry", "Accreditation Status"].includes(header)
    ) {
      return false;
    }
    if (!includeWallets && header === "Wallet") {
      return false;
    }
    if (
      !includeTransactions &&
      ["Transaction Hash", "Distribution Date"].includes(header)
    ) {
      return false;
    }
    return true;
  });

  const rows: string[][] = [];
  const today = new Date().toISOString().split("T")[0];

  // Create a more detailed cap table with one row per subscription
  investors.forEach((inv) => {
    if (inv.subscriptions.length === 0) {
      // Add a row for investors with no subscriptions
      const row = [];

      // Add investor details
      row.push(inv.investorId || "");
      row.push(inv.name || "");
      row.push(inv.email || "");
      row.push(inv.type || "");

      // Add wallet if included
      if (includeWallets) {
        row.push(inv.wallet || "");
      }

      // Add KYC info if included
      if (includeKYC) {
        row.push(inv.kycStatus || "");
        row.push(
          inv.kycExpiryDate
            ? new Date(inv.kycExpiryDate).toISOString().split("T")[0]
            : "",
        );
        row.push(inv.country || "");
        row.push(inv.accreditationStatus || "");
      }

      // Add empty subscription and token data
      row.push(""); // Subscription ID
      row.push(""); // Subscription Amount
      row.push(""); // Currency
      row.push(""); // Subscription Status
      row.push(""); // Subscription Date
      row.push(""); // Token Type
      row.push(""); // Token Allocation
      row.push(""); // Allocation Status
      row.push(""); // Distribution Status

      // Add transaction data if included
      if (includeTransactions) {
        row.push(""); // Distribution Date
        row.push(""); // Transaction Hash
      }

      row.push(""); // Notes

      // Filter row based on headers
      const filteredRow = [];
      headers.forEach((header, index) => {
        const headerIndex = allHeaders.indexOf(header);
        if (headerIndex !== -1 && row[headerIndex] !== undefined) {
          filteredRow.push(row[headerIndex]);
        } else {
          filteredRow.push("");
        }
      });

      rows.push(filteredRow);
    } else {
      // Add a row for each subscription
      inv.subscriptions.forEach((sub) => {
        const row = [];

        // Add investor details
        row.push(inv.investorId || "");
        row.push(inv.name || "");
        row.push(inv.email || "");
        row.push(inv.type || "");

        // Add wallet if included
        if (includeWallets) {
          row.push(inv.wallet || "");
        }

        // Add KYC info if included
        if (includeKYC) {
          row.push(inv.kycStatus || "");
          row.push(
            inv.kycExpiryDate
              ? new Date(inv.kycExpiryDate).toISOString().split("T")[0]
              : "",
          );
          row.push(inv.country || "");
          row.push(inv.accreditationStatus || "");
        }

        // Add subscription data
        row.push(sub.subscriptionId || "");
        row.push(
          sub.fiatSubscription ? sub.fiatSubscription.amount.toString() : "",
        );
        row.push(sub.fiatSubscription ? sub.fiatSubscription.currency : "");
        row.push(sub.confirmed ? "Confirmed" : "Unconfirmed");
        row.push(today); // Subscription Date - using today as placeholder

        // Add token data
        row.push(sub.tokenType || "");
        row.push(sub.tokenAllocation ? sub.tokenAllocation.toString() : "");
        row.push(sub.allocated ? "Allocated" : "Unallocated");
        row.push(sub.distributed ? "Distributed" : "Pending");

        // Add transaction data if included
        if (includeTransactions) {
          row.push(sub.distributed ? today : ""); // Distribution Date
          row.push(
            sub.distributed
              ? `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
              : "",
          ); // Transaction Hash
        }

        row.push(sub.notes || ""); // Notes

        // Filter row based on headers
        const filteredRow = [];
        headers.forEach((header) => {
          const headerIndex = allHeaders.indexOf(header);
          if (headerIndex !== -1 && row[headerIndex] !== undefined) {
            filteredRow.push(row[headerIndex]);
          } else {
            filteredRow.push("");
          }
        });

        rows.push(filteredRow);
      });
    }
  });

  // Calculate totals for summary row
  const totalInvestors = investors.length;
  const totalSubscriptions = rows.length;
  const totalTokens = rows.reduce((sum, row) => {
    const tokenAllocationIndex = headers.indexOf("Token Allocation");
    if (tokenAllocationIndex !== -1 && row[tokenAllocationIndex]) {
      return sum + parseInt(row[tokenAllocationIndex]) || 0;
    }
    return sum;
  }, 0);

  // Add summary row if there are investors
  if (investors.length > 0) {
    const summaryRow = headers.map(() => "");
    const nameIndex = headers.indexOf("Name");
    if (nameIndex !== -1) {
      summaryRow[nameIndex] =
        `TOTAL (${totalInvestors} investors, ${totalSubscriptions} subscriptions)`;
    }

    const tokenAllocationIndex = headers.indexOf("Token Allocation");
    if (tokenAllocationIndex !== -1) {
      summaryRow[tokenAllocationIndex] = totalTokens.toString();
    }

    rows.push(summaryRow);
  }

  // Format the CSV string
  return [
    headers.join(","),
    ...rows.map((r) =>
      r
        .map((cell) => {
          // Escape quotes and wrap in quotes
          const escaped = cell.toString().replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    ),
  ].join("\n");
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

import { getAllInvestorTypes } from "./investorUtils";

export const generateCSVTemplate = (
  type: "investor" | "subscription" = "investor",
): string => {
  if (type === "subscription") {
    // This is now handled by the more comprehensive generateSubscriptionTemplate function
    // in subscriptionTemplate.ts, but keeping this for backward compatibility
    const headers = [
      "Investor Name",
      "FIAT Amount",
      "Currency",
      "Status",
      "Subscription ID",
      "Subscription Date",
      "Notes",
    ];
    const example = [
      "John Doe",
      "10000",
      "USD",
      "Unconfirmed",
      "SUB001",
      new Date().toISOString().split("T")[0],
      "Initial investment",
    ];
    return `${headers.join(",")}\n${example.join(",")}`;
  }

  const headers = [
    "Name",
    "Email",
    "Type",
    "Wallet",
    "KYC Status",
    "Last Updated",
  ];

  // Create multiple examples with different investor types
  const examples = [
    [
      "John Doe",
      "john@example.com",
      "High-Net-Worth Individual",
      "0x1234567890abcdef1234567890abcdef12345678",
      "Verified",
      new Date().toISOString().split("T")[0],
    ],
    [
      "Acme Capital",
      "investments@acmecapital.com",
      "Private Equity & Venture Capital",
      "0xabcdef1234567890abcdef1234567890abcdef12",
      "Pending",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    ],
    [
      "Global Pension Fund",
      "info@globalpension.org",
      "Pension Fund",
      "0x7890abcdef1234567890abcdef1234567890abcd",
      "Expired",
      new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    ],
  ];

  return `${headers.join(",")}\n${examples.map((row) => row.join(",")).join("\n")}`;
};
