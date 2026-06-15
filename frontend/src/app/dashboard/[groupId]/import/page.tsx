"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Check,
} from "lucide-react";

interface Anomaly {
  id: number;
  row_number: number;
  anomaly_type: string;
  severity: string;
  description: string;
  suggested_action: string;
  auto_resolved: boolean;
}

interface ImportReport {
  run_id: string;
  total_rows: number;
  imported: number;
  flagged: number;
  skipped: number;
  auto_fixed: number;
  anomalies: Anomaly[];
  exchange_rate_used: string;
  timestamp: string;
}

type Step = "upload" | "processing" | "review" | "done";

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params.groupId as string;

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [currentAnomaly, setCurrentAnomaly] = useState(0);
  const [correctedValue, setCorrectedValue] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const unresolvedAnomalies =
    report?.anomalies.filter((a) => !a.auto_resolved && a.severity === "ERROR") || [];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStep("processing");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("group_id", groupId);

    try {
      const res = await api.post("/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReport(res.data);
      const unresolved = res.data.anomalies.filter(
        (a: Anomaly) => !a.auto_resolved && a.severity === "ERROR"
      );
      if (unresolved.length > 0) {
        setStep("review");
      } else {
        setStep("done");
      }
    } catch {
      setStep("upload");
    }
  };

  const handleResolve = async (action: "accept" | "reject") => {
    if (!report || unresolvedAnomalies.length === 0) return;
    const anomaly = unresolvedAnomalies[currentAnomaly];
    setResolving(true);

    const formData = new FormData();
    formData.append("action", action === "reject" ? "reject" : "accept");
    if (correctedValue) {
      formData.append("corrected_value", correctedValue);
    }

    try {
      await api.post(
        `/import/${report.run_id}/resolve/${anomaly.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Refresh report
      const res = await api.get(`/import/${report.run_id}/report`);
      setReport(res.data);

      const newUnresolved = res.data.anomalies.filter(
        (a: Anomaly) => !a.auto_resolved && a.severity === "ERROR"
      );
      setCorrectedValue("");

      if (currentAnomaly >= newUnresolved.length) {
        if (newUnresolved.length === 0) {
          setStep("done");
        } else {
          setCurrentAnomaly(newUnresolved.length - 1);
        }
      }
    } catch {
      // Error handling
    } finally {
      setResolving(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return <XCircle size={18} className="text-danger" />;
      case "WARNING":
        return <AlertTriangle size={18} className="text-warning" />;
      default:
        return <Info size={18} className="text-accent" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return "badge-error";
      case "WARNING":
        return "badge-warning";
      default:
        return "badge-info";
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Nav ── */}
      <nav className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <Link
          href={`/dashboard/${groupId}`}
          className="text-muted hover:text-foreground transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Smart CSV Importer</h1>
          <p className="text-xs text-muted">
            Upload, detect anomalies, review & import
          </p>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {["Upload", "Processing", "Review", "Done"].map((label, i) => {
            const steps: Step[] = ["upload", "processing", "review", "done"];
            const isActive = steps.indexOf(step) >= i;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-surface text-muted border border-border"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm hidden sm:block ${
                    isActive ? "text-foreground font-medium" : "text-muted"
                  }`}
                >
                  {label}
                </span>
                {i < 3 && (
                  <div
                    className={`w-8 h-0.5 ${
                      isActive ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="animate-fade-in">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`glass p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted"
              }`}
              onClick={() =>
                document.getElementById("csv-file-input")?.click()
              }
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) setFile(selected);
                }}
              />
              <FileSpreadsheet
                size={48}
                className={`mx-auto mb-4 ${
                  dragActive ? "text-primary" : "text-muted"
                }`}
              />
              {file ? (
                <>
                  <p className="font-semibold text-lg">{file.name}</p>
                  <p className="text-sm text-muted mt-1">
                    {(file.size / 1024).toFixed(1)} KB — Ready to import
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-lg">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-muted mt-1">
                    or click to browse. Accepts .csv files only.
                  </p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-6 flex justify-center">
                <button onClick={handleUpload} className="btn-primary text-base px-8 py-3">
                  <Upload size={18} /> Start Import
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Processing ── */}
        {step === "processing" && (
          <div className="glass p-12 text-center animate-fade-in">
            <Loader2
              size={48}
              className="mx-auto mb-4 text-primary animate-spin"
            />
            <h2 className="text-xl font-bold mb-2">Analyzing your data…</h2>
            <p className="text-muted text-sm">
              Running anomaly detection engine across all rows. This usually
              takes a few seconds.
            </p>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === "review" && report && unresolvedAnomalies.length > 0 && (
          <div className="animate-fade-in">
            {/* Summary bar */}
            <div className="glass-sm p-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-6 text-sm">
                <span>
                  <span className="font-bold text-foreground">
                    {report.total_rows}
                  </span>{" "}
                  <span className="text-muted">total rows</span>
                </span>
                <span className="text-success">
                  ✓ {report.imported} imported
                </span>
                <span className="text-warning">
                  ⚡ {report.auto_fixed} auto-fixed
                </span>
                <span className="text-danger">
                  ⚠ {unresolvedAnomalies.length} need review
                </span>
              </div>
              <span className="text-sm text-muted">
                {currentAnomaly + 1} / {unresolvedAnomalies.length}
              </span>
            </div>

            {/* Anomaly Card */}
            {unresolvedAnomalies[currentAnomaly] && (
              <div className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(
                      unresolvedAnomalies[currentAnomaly].severity
                    )}
                    <div>
                      <span
                        className={`badge ${getSeverityBadge(
                          unresolvedAnomalies[currentAnomaly].severity
                        )} mr-2`}
                      >
                        {unresolvedAnomalies[currentAnomaly].severity}
                      </span>
                      <span className="badge badge-info">
                        Row{" "}
                        {unresolvedAnomalies[currentAnomaly].row_number}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-muted font-mono">
                    {unresolvedAnomalies[currentAnomaly].anomaly_type}
                  </span>
                </div>

                <p className="text-sm mb-4">
                  {unresolvedAnomalies[currentAnomaly].description}
                </p>

                <div className="glass-sm p-3 mb-4">
                  <p className="text-xs text-muted mb-1">Suggested Action</p>
                  <p className="text-sm font-medium">
                    {unresolvedAnomalies[currentAnomaly].suggested_action}
                  </p>
                </div>

                {/* Correction Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    Provide corrected value (optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter corrected value…"
                    value={correctedValue}
                    onChange={(e) => setCorrectedValue(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentAnomaly((p) => Math.max(0, p - 1))
                      }
                      disabled={currentAnomaly === 0}
                      className="btn-secondary text-sm px-3 py-2"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentAnomaly((p) =>
                          Math.min(unresolvedAnomalies.length - 1, p + 1)
                        )
                      }
                      disabled={
                        currentAnomaly === unresolvedAnomalies.length - 1
                      }
                      className="btn-secondary text-sm px-3 py-2"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolve("reject")}
                      disabled={resolving}
                      className="btn-danger"
                    >
                      {resolving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <SkipForward size={16} />
                      )}
                      Skip Row
                    </button>
                    <button
                      onClick={() => handleResolve("accept")}
                      disabled={resolving}
                      className="btn-success"
                    >
                      {resolving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Approve & Import
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* All anomalies sidebar */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted mb-3">
                All Detected Anomalies
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {report.anomalies.map((a, i) => (
                  <div
                    key={a.id}
                    className={`glass-sm p-3 flex items-center justify-between text-sm ${
                      a.auto_resolved ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(a.severity)}
                      <span className="text-muted">Row {a.row_number}</span>
                      <span className="font-mono text-xs text-muted">
                        {a.anomaly_type}
                      </span>
                    </div>
                    {a.auto_resolved ? (
                      <span className="badge badge-success text-[10px]">
                        Auto-fixed
                      </span>
                    ) : (
                      <span className="badge badge-error text-[10px]">
                        Needs review
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && report && (
          <div className="glass p-10 text-center animate-slide-up">
            <CheckCircle2
              size={56}
              className="mx-auto mb-4 text-success"
            />
            <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
            <p className="text-muted mb-8">
              Your data has been successfully processed and imported.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold">{report.total_rows}</p>
                <p className="text-xs text-muted">Total Rows</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold text-success">
                  {report.imported}
                </p>
                <p className="text-xs text-muted">Imported</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold text-warning">
                  {report.auto_fixed}
                </p>
                <p className="text-xs text-muted">Auto-Fixed</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold text-danger">
                  {report.skipped}
                </p>
                <p className="text-xs text-muted">Skipped</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Link
                href={`/dashboard/${groupId}/expenses`}
                className="btn-primary"
              >
                View Ledger
              </Link>
              <Link
                href={`/dashboard/${groupId}`}
                className="btn-secondary"
              >
                Back to Group
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
