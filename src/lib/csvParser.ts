// src/lib/csvParser.ts
import Papa from "papaparse";

export interface CSVParseResult {
  data: any[];
  errors: string[];
  warnings: string[];
}

export const parseCSVFile = async (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (result) => {
        const data = result.data;
        const errors: string[] = [];
        const warnings: string[] = [];

        console.log("PapaParse result:", result);
        console.log("Headers detected:", result.meta.fields);
        console.log("First row sample:", data[0]);

        // Get headers and convert to lowercase for case-insensitive comparison
        const headers = result.meta.fields || [];

        // Define required headers in lowercase
        const requiredHeaders = ["name", "email", "wallet"];

        // Check for missing headers (case-insensitive)
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h),
        );
        if (missingHeaders.length > 0) {
          errors.push(`Missing required headers: ${missingHeaders.join(", ")}`);
        }

        // Process and normalize each row
        const normalizedData = data
          .map((row: any, index: number) => {
            // Check for empty rows
            if (
              Object.keys(row).length === 0 ||
              Object.values(row).every((v) => !v)
            ) {
              warnings.push(`Row ${index + 1}: Empty row skipped`);
              return null;
            }

            // Validate required fields
            if (!row.name) warnings.push(`Row ${index + 1}: Missing name`);
            if (!row.email) warnings.push(`Row ${index + 1}: Missing email`);
            if (!row.wallet)
              warnings.push(`Row ${index + 1}: Missing wallet address`);

            // Return the row with all keys already normalized by transformHeader
            return row;
          })
          .filter((row) => row !== null);

        console.log("Normalized data:", normalizedData);
        resolve({ data: normalizedData, errors, warnings });
      },
      error: (error) => {
        console.error("PapaParse error:", error);
        resolve({ data: [], errors: [error.message], warnings: [] });
      },
    });
  });
};
