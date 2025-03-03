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
import {
  Download,
  Upload,
  AlertTriangle,
  FileText,
  Info,
  Check,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { generateSubscriptionTemplate } from "@/lib/subscriptionTemplate";
import { downloadCSV } from "@/lib/csv";

interface SubscriptionUploadDialogProps {
  open?: boolean;
  onClose?: () => void;
  onUpload?: (file: File) => void;
  onDownloadTemplate?: () => void;
  validationErrors?: string[];
  validationWarnings?: string[];
  isValidating?: boolean;
  onSuccess?: (count: number) => void;
}

const SubscriptionUploadDialog = ({
  open = true,
  onClose = () => {},
  onUpload = () => {},
  onDownloadTemplate = () => {},
  validationErrors = [],
  validationWarnings = [],
  isValidating = false,
  onSuccess = () => {},
}: SubscriptionUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);

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

  const handleUpload = async () => {
    if (selectedFile) {
      setUploadProgress(0);
      setUploadSuccess(false);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 10);
        });
      }, 200);

      try {
        await onUpload(selectedFile);
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadSuccess(true);

        // Count rows in the file (excluding header)
        const rowCount = previewData.length > 1 ? previewData.length - 1 : 3;
        setUploadCount(rowCount);
        onSuccess(rowCount);

        // Auto-close after success
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        console.error("Upload error:", error);
      }
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setShowPreview(false);
    setUploadSuccess(false);
    setUploadProgress(0);
    setUploadCount(0);
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
          <DialogTitle>Upload Subscriptions</DialogTitle>
          <DialogDescription>
            Import subscription data from a CSV file. Please ensure your file
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
                onClick={() => {
                  const template = generateSubscriptionTemplate();
                  downloadCSV(
                    template,
                    `subscription-template-${new Date().toISOString().split("T")[0]}.csv`,
                  );
                  onDownloadTemplate();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Subscription Template
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

            {uploadProgress > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {uploadSuccess ? "Upload Complete" : "Uploading..."}
                  </span>
                  <span className="text-sm text-gray-500">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />

                {uploadSuccess && (
                  <Alert className="bg-green-50 border-green-200 mt-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Successfully uploaded {uploadCount} subscription
                      {uploadCount !== 1 ? "s" : ""}.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
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
                  Investor Name,FIAT Amount,Currency,Status,Subscription
                  ID,Subscription Date,Notes
                </code>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Field Requirements</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Investor Name:</strong> Required. Must match an
                    existing investor name in the system.
                  </li>
                  <li>
                    <strong>FIAT Amount:</strong> Required. Must be a positive
                    number.
                  </li>
                  <li>
                    <strong>Currency:</strong> Required. Must be one of: USD,
                    EUR, GBP.
                  </li>
                  <li>
                    <strong>Status:</strong> Optional. Must be either
                    "Confirmed" or "Unconfirmed". Defaults to "Unconfirmed".
                  </li>
                  <li>
                    <strong>Subscription ID:</strong> Required. Unique
                    identifier for the subscription.
                  </li>
                  <li>
                    <strong>Subscription Date:</strong> Optional. Date in
                    YYYY-MM-DD format. Defaults to today's date.
                  </li>
                  <li>
                    <strong>Notes:</strong> Optional. Additional information
                    about the subscription.
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
              !selectedFile ||
              isValidating ||
              validationErrors.length > 0 ||
              uploadSuccess
            }
          >
            <Upload className="mr-2 h-4 w-4" />
            {isValidating
              ? "Validating..."
              : uploadSuccess
                ? "Uploaded"
                : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionUploadDialog;
