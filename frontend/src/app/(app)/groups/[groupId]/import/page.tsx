"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ImportReport as ImportReportType } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { FileUploadZone } from "@/components/import/FileUploadZone";
import { ImportProgress } from "@/components/import/ImportProgress";
import { AnomalyTable } from "@/components/import/AnomalyTable";
import { ImportReport } from "@/components/import/ImportReport";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

export default function ImportCSVPage() {
  const { groupId } = useParams();
  const id = parseInt(groupId as string, 10);
  
  const [step, setStep] = useState<Step>(1);
  const [report, setReport] = useState<ImportReportType | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (file: File) => {
    try {
      setStep(2);
      setError("");
      // Simulating API call because backend might not be fully ready for this endpoint
      // const data = await api.import.upload(id, file);
      
      // MOCK DATA FOR MEERA'S FLOW:
      const mockReport: ImportReportType = {
        run_id: "req_9876xyz",
        status: "review_needed",
        stats: { total: 43, ready: 26, flagged: 9, fixed: 4, skipped: 4 },
        anomalies: [
          { id: 1, row_num: 6, severity: "WARNING", problem: "Duplicate", raw_data: '"dinner - marina bites" Apr 8', proposed_action: "Skip (row 5 is original)", status: "pending", resolution_action: null },
          { id: 2, row_num: 15, severity: "ERROR", problem: "Invalid %", raw_data: "30+30+30+20=110% Pizza Friday", proposed_action: "Cannot import — fix and re-add", status: "pending", resolution_action: null },
          { id: 3, row_num: 14, severity: "INFO", problem: "Settlement", raw_data: '"Rohan paid Aisha back"', proposed_action: "Convert to settlement rec.", status: "pending", resolution_action: null },
          { id: 4, row_num: 24, severity: "WARNING", problem: "Near-duplicate", raw_data: "Thalassa ₹2400", proposed_action: "BOTH held. Pick one version", status: "pending", resolution_action: null },
          { id: 5, row_num: 25, severity: "WARNING", problem: "Near-duplicate", raw_data: "Thalassa ₹2450", proposed_action: "BOTH held. Pick one version", status: "pending", resolution_action: null },
        ]
      };
      setReport(mockReport);
      
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
      setStep(1);
    }
  };

  const handleResolve = async (anomalyId: number, action: "approve" | "skip") => {
    if (!report) return;
    
    // Optimistic update
    const updatedAnomalies = report.anomalies.map(a => 
      a.id === anomalyId ? { ...a, status: "resolved" as const, resolution_action: action } : a
    );
    
    setReport({
      ...report,
      anomalies: updatedAnomalies
    });

    try {
      // await api.import.resolve(report.run_id, anomalyId, action);
    } catch (err) {
      console.error(err);
      // rollback in a real app
    }
  };

  const handleFinalize = () => {
    // In a real app, call API to finalize
    setStep(4);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Smart CSV Importer" 
        subtitle="Upload, detect anomalies, review & import" 
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-4">
        {["Upload", "Analyzing", "Review & Approve", "Complete"].map((label, i) => {
          const isActive = step >= i + 1;
          const isCurrent = step === i + 1;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                isCurrent ? "bg-brand-500 text-white shadow-md" : 
                isActive ? "bg-brand-100 text-brand-600" : "bg-surface text-ink-400 border border-border"
              )}>
                {i + 1}
              </div>
              <span className={cn(
                "text-sm font-medium whitespace-nowrap",
                isCurrent ? "text-ink-900" : isActive ? "text-brand-700" : "text-ink-400"
              )}>
                {label}
              </span>
              {i < 3 && <div className={cn("w-8 md:w-16 h-px mx-2", isActive ? "bg-brand-200" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">
        {step === 1 && <FileUploadZone onFileSelect={handleFileSelect} />}
        {step === 2 && <ImportProgress onComplete={() => setStep(3)} />}
        {step === 3 && report && (
          <AnomalyTable 
            report={report} 
            onResolve={handleResolve} 
            onFinalize={handleFinalize} 
          />
        )}
        {step === 4 && report && <ImportReport report={report} groupId={id} />}
      </div>
    </div>
  );
}
