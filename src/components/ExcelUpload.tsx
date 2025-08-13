import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadButtonShimmer } from "@/components/UploadShimmer";

export const ExcelUpload = ({ onUpload, isLoading }: { onUpload?: (file: File) => void; isLoading?: boolean }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
      if (fileExtension === "xlsx" || fileExtension === "xls" || fileExtension === "csv") {
        setFile(uploadedFile);
        onUpload?.(uploadedFile);
      } else {
        // Handle invalid file type
        alert("Please upload an Excel or CSV file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      onUpload?.(uploadedFile);
    }
  };

  return (
    <Card className={`border-2 ${dragActive ? 'border-primary' : 'border-border'} p-4`}>
      <CardContent className="pt-6">
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              Upload Excel or CSV
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop, or click to select
            </p>
            <p className="mt-1 text-xs text-gray-400">
              XLSX, XLS, CSV formats, up to 10MB
            </p>
            <div className="mt-6">
              <Label htmlFor="excel-upload" className="sr-only">
                Choose Excel file
              </Label>
              <input
                id="excel-upload"
                name="excel-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => document.getElementById("excel-upload")?.click()}
                variant="outline"
                className="relative"
              >
                {isLoading ? (
                  <UploadButtonShimmer />
                ) : (
                  "Select File"
                )}
              </Button>
            </div>
            {file && (
              <div className="mt-4 text-sm">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
