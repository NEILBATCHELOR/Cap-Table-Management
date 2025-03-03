import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Download, Upload, AlertTriangle, FileText, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface CSVUploadDialogProps {
  open?: boolean;
  onClose?: () => void;
  onUpload?: (file: File) => void;
  onDownloadTemplate?: () => void;
  validationErrors?: string[];
  validationWarnings?: string[];
  isValidating?: boolean;
}

const CSVUploadDialog = ({
  open = true,
  onClose = () => {},
  onUpload = () => {},
  onDownloadTemplate = () => {},
  validationErrors = [],
  validationWarnings = [],
  isValidating = false,
}: CSVUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Generate preview
      generatePreview(file);
    }
  };

  const generatePreview = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(0, 6); // Get first 6 lines for preview
        const delimiter = lines[0].includes(",")
          ? ","
          : lines[0].includes(";")
            ? ";"
            : "\t";

        const preview = lines.map((line) => line.split(delimiter));
        setPreviewData(preview);
        setShowPreview(true);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setShowPreview(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="bg-background sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Upload Investor Data</DialogTitle>
          <DialogDescription>
            Import investor data from a CSV file. Please ensure your file
            follows the required format.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="format" className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              Format Guidelines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={onDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="csv">Upload CSV File</Label>
                <Input
                  id="csv"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                />
              </div>

              {selectedFile && (
                <div className="text-sm text-gray-500 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Selected file: {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {showPreview && previewData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">File Preview</h3>
                <div className="border rounded-md overflow-x-auto max-h-[200px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {previewData[0].map((header, i) => (
                          <th
                            key={i}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(1, 6).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2 max-h-[150px] overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationWarnings.length > 0 && (
              <Alert
                variant="warning"
                className="bg-yellow-50 border-yellow-200"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Warnings</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2 max-h-[100px] overflow-y-auto">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="format" className="space-y-4 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Required Format</h3>
              <p className="text-sm text-gray-500">
                Your CSV file must include the following columns:
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <code className="text-xs font-mono">
                  Name,Email,Type,Wallet,Country,InvestorID
                </code>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Field Requirements</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Name:</strong> Required. Full name of the investor.
                  </li>
                  <li>
                    <strong>Email:</strong> Required. Must be a valid email
                    format.
                  </li>
                  <li>
                    <strong>Type:</strong> Required. Must be one of the
                    supported investor types.
                  </li>
                  <li>
                    <strong>Wallet:</strong> Required. Must be a valid Ethereum
                    address (0x followed by 40 hex characters).
                  </li>
                  <li>
                    <strong>Country:</strong> Optional. 2 or 3 letter country
                    code.
                  </li>
                  <li>
                    <strong>InvestorID:</strong> Optional. Unique identifier for
                    the investor.
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Supported Formats</h4>
                <ul className="space-y-1 text-sm">
                  <li>Comma-separated values (.csv)</li>
                  <li>Semicolon-separated values</li>
                  <li>Tab-separated values</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  The system will automatically detect the delimiter used in
                  your file.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !selectedFile || isValidating || validationErrors.length > 0
            }
          >
            <Upload className="mr-2 h-4 w-4" />
            {isValidating ? "Validating..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSVUploadDialog;
