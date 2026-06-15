import { UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        onFileSelect(file);
      } else {
        alert("Please upload a .csv file");
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 bg-surface",
          isDragging ? "border-brand-500 bg-brand-50" : "border-border hover:bg-canvas hover:border-brand-300"
        )}
      >
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-6 shadow-sm">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-xl font-bold text-ink-900 mb-2">Drop your CSV file here</h3>
        <p className="text-ink-500 mb-6">or click to browse from your computer</p>
        <div className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-brand-600 transition-colors">
          Select File
        </div>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileChange}
        />
        <p className="mt-8 text-xs font-semibold text-ink-400 uppercase tracking-widest">
          Accepts .csv files only
        </p>
      </label>

      <Card padding="md" className="bg-warning-bg border-warning-border">
        <div className="flex gap-3">
          <div className="text-xl">⚠️</div>
          <div>
            <h4 className="text-sm font-semibold text-warning-text mb-1">Do not edit the CSV before importing.</h4>
            <p className="text-sm text-warning-text/80">
              Import the file exactly as exported from your bank or split app. Our Smart Importer will automatically format and detect duplicates for you.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
