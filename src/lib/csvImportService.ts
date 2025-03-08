import Papa from "papaparse";
import { InvestorCSV } from "@/types/investor";
import { TokenSubscription } from "@/types/token";

/**
 * Service for handling CSV imports with consistent validation
 */
export const CSVImportService = {
  /**
   * Parse a CSV file with investor data
   */
  parseInvestorCSV: async (
    file: File,
  ): Promise<{
    data: InvestorCSV[];
    errors: string[];
    warnings: string[];
  }> => {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize headers to lowercase
          return header.toLowerCase().trim();
        },
        complete: (results) => {
          // Check for parse errors
          if (results.errors && results.errors.length > 0) {
            results.errors.forEach((err) => {
              errors.push(`Row ${err.row}: ${err.message}`);
            });
          }

          // Validate required fields
          const data = results.data as any[];
          const validData: InvestorCSV[] = [];

          data.forEach((row, index) => {
            // Check required fields
            if (!row.name || row.name.trim() === "") {
              errors.push(`Row ${index + 1}: Missing required field 'Name'`);
              return;
            }

            if (!row.email || row.email.trim() === "") {
              errors.push(`Row ${index + 1}: Missing required field 'Email'`);
              return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email)) {
              errors.push(
                `Row ${index + 1}: Invalid email format '${row.email}'`,
              );
              return;
            }

            // Validate wallet address if present
            if (row.wallet && row.wallet.trim() !== "") {
              const walletRegex = /^0x[a-fA-F0-9]{40}$/;
              if (!walletRegex.test(row.wallet)) {
                errors.push(
                  `Row ${index + 1}: Invalid Ethereum wallet address format '${row.wallet}'`,
                );
                return;
              }
            } else {
              warnings.push(
                `Row ${index + 1}: Missing wallet address for investor '${row.name}'`,
              );
            }

            // Add valid row to results
            validData.push({
              name: row.name.trim(),
              email: row.email.trim(),
              type: row.type?.trim() || "Individual",
              wallet: row.wallet?.trim() || "",
              country: row.country?.trim(),
              investorId: row.investorid?.trim() || row["investor id"]?.trim(),
            });
          });

          resolve({
            data: validData,
            errors,
            warnings,
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error}`));
        },
      });
    });
  },

  /**
   * Parse a CSV file with subscription data
   */
  parseSubscriptionCSV: async (
    file: File,
  ): Promise<{
    data: any[];
    errors: string[];
    warnings: string[];
  }> => {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize headers to lowercase
          return header.toLowerCase().trim();
        },
        complete: (results) => {
          // Check for parse errors
          if (results.errors && results.errors.length > 0) {
            results.errors.forEach((err) => {
              errors.push(`Row ${err.row}: ${err.message}`);
            });
          }

          // Validate required fields
          const data = results.data as any[];
          const validData: any[] = [];

          data.forEach((row, index) => {
            // Check required fields
            if (!row["investor name"] || row["investor name"].trim() === "") {
              errors.push(
                `Row ${index + 1}: Missing required field 'Investor Name'`,
              );
              return;
            }

            if (!row["fiat amount"] || isNaN(parseFloat(row["fiat amount"]))) {
              errors.push(`Row ${index + 1}: Missing or invalid 'FIAT Amount'`);
              return;
            }

            if (
              !row.currency ||
              !["USD", "EUR", "GBP"].includes(row.currency.toUpperCase())
            ) {
              errors.push(
                `Row ${index + 1}: Missing or invalid 'Currency' (must be USD, EUR, or GBP)`,
              );
              return;
            }

            // Validate subscription ID
            if (
              !row["subscription id"] ||
              row["subscription id"].trim() === ""
            ) {
              warnings.push(
                `Row ${index + 1}: Missing 'Subscription ID' for investor '${row["investor name"]}'`,
              );
            }

            // Add valid row to results
            validData.push({
              "investor name": row["investor name"].trim(),
              "fiat amount": parseFloat(row["fiat amount"]),
              currency: row.currency.toUpperCase(),
              status:
                row.status?.toLowerCase() === "confirmed"
                  ? "Confirmed"
                  : "Unconfirmed",
              "subscription id": row["subscription id"]?.trim() || "",
              "subscription date":
                row["subscription date"]?.trim() ||
                new Date().toISOString().split("T")[0],
              notes: row.notes?.trim() || "",
            });
          });

          resolve({
            data: validData,
            errors,
            warnings,
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error}`));
        },
      });
    });
  },

  /**
   * Generate a CSV template for investor uploads
   */
  generateInvestorTemplate: (): string[][] => {
    return [
      [
        "Name",
        "Email",
        "Type",
        "Wallet",
        "KYC Status",
        "Country",
        "Last Updated",
      ],
      [
        "John Doe",
        "john@example.com",
        "Individual",
        "0x1234567890abcdef1234567890abcdef12345678",
        "Verified",
        "US",
        "2023-01-01",
      ],
      [
        "Acme Corp",
        "finance@acme.com",
        "Institution",
        "0xabcdef1234567890abcdef1234567890abcdef12",
        "Pending",
        "UK",
        "2023-01-02",
      ],
    ];
  },

  /**
   * Generate a CSV template for subscription uploads
   */
  generateSubscriptionTemplate: (): string[][] => {
    return [
      [
        "Investor Name",
        "FIAT Amount",
        "Currency",
        "Status",
        "Subscription ID",
        "Subscription Date",
        "Notes",
      ],
      [
        "John Doe",
        "10000",
        "USD",
        "Confirmed",
        "SUB-001",
        "2023-01-01",
        "Initial investment",
      ],
      [
        "Acme Corp",
        "50000",
        "EUR",
        "Unconfirmed",
        "SUB-002",
        "2023-01-02",
        "Pending confirmation",
      ],
    ];
  },
};
