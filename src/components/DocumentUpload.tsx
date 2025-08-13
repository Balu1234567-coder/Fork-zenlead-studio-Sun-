import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadButtonShimmer } from "@/components/UploadShimmer";

export const DocumentUpload = ({ onUpload, isLoading, accept = ".pdf,.doc,.docx,.txt" }: { 
  onUpload?: (file: File) => void; 
  isLoading?: boolean; 
  accept?: string 
}) => {
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
      if (["pdf", "doc", "docx", "txt"].includes(fileExtension)) {
        setFile(uploadedFile);
        onUpload?.(uploadedFile);
      } else {
        alert("Please upload a PDF, Word, or text file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
      if (["pdf", "doc", "docx", "txt"].includes(fileExtension)) {
        setFile(uploadedFile);
        onUpload?.(uploadedFile);
      } else {
        alert("Please upload a PDF, Word, or text file");
      }
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
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              Upload PDF, Word, or Text
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop, or click to select
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PDF, DOC, DOCX, TXT formats, up to 10MB
            </p>
            <div className="mt-6">
              <Label htmlFor="document-upload" className="sr-only">
                Choose document file
              </Label>
              <input
                id="document-upload"
                name="document-upload"
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => document.getElementById("document-upload")?.click()}
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
