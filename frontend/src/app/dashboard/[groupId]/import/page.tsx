"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatINR } from "@/lib/utils";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  FileSpreadsheet,
  Download,
  Check,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Flag,
} from "lucide-react";

interface Anomaly {
  id: number;
  row_number: number;
  anomaly_type: string;
  severity: string;
  description: string;
  suggested_action: string;
  auto_resolved: boolean;
  raw_value?: string;
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
  const [resolving, setResolving] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // Derived state
  const unresolvedFlagged =
    report?.anomalies.filter((a) => !a.auto_resolved && a.severity === "ERROR") || [];
  const allResolved = report ? unresolvedFlagged.length === 0 : false;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.name.endsWith(".csv")) setFile(f);
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
      setStep("review");
    } catch {
      setStep("upload");
    }
  };

  const handleResolve = async (anomalyId: number, action: "approve" | "reject") => {
    if (!report) return;
    setResolving(anomalyId);
    const formData = new FormData();
    formData.append("action", action);
    const note = resolveNotes[anomalyId];
    if (note) formData.append("corrected_value", note);
    try {
      await api.post(`/import/${report.run_id}/resolve/${anomalyId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Refresh report
      const res = await api.get(`/import/${report.run_id}/report`);
      setReport(res.data);
    } catch {
      // silent
    } finally {
      setResolving(null);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_report_${report.run_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinalize = () => {
    setStep("done");
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "ERROR": return <XCircle size={16} className="text-danger" />;
      case "WARNING": return <AlertTriangle size={16} className="text-warning" />;
      default: return <Info size={16} className="text-accent" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "ERROR": return "text-danger";
      case "WARNING": return "text-warning";
      default: return "text-accent";
    }
  };

  const getStatusLabel = (anomaly: Anomaly) => {
    if (anomaly.auto_resolved) return { text: "Auto-Fixed", cls: "badge-success" };
    if (anomaly.severity === "ERROR") return { text: "Needs Review", cls: "badge-error" };
    return { text: "Info", cls: "badge-info" };
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
        <Link href={`/dashboard/${groupId}`} className="text-muted hover:text-foreground transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Smart CSV Importer</h1>
          <p className="text-xs text-muted">Upload, detect anomalies, review & import</p>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {["Upload", "Analyzing", "Review & Approve", "Complete"].map((label, i) => {
            const steps: Step[] = ["upload", "processing", "review", "done"];
            const isActive = steps.indexOf(step) >= i;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? "bg-primary text-white" : "bg-surface text-muted border border-border"}`}>
                  {i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${isActive ? "text-foreground font-medium" : "text-muted"}`}>{label}</span>
                {i < 3 && <div className={`w-8 h-0.5 ${isActive ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════ */}
        {/* ── STEP 1: UPLOAD ── */}
        {/* ══════════════════════════════════════ */}
        {step === "upload" && (
          <div className="animate-fade-in">
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`glass p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted"}`}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <input id="csv-file-input" type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              <FileSpreadsheet size={48} className={`mx-auto mb-4 ${dragActive ? "text-primary" : "text-muted"}`} />
              {file ? (
                <>
                  <p className="font-semibold text-lg">{file.name}</p>
                  <p className="text-sm text-muted mt-1">{(file.size / 1024).toFixed(1)} KB — Ready to import</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-lg">Drop your CSV file here</p>
                  <p className="text-sm text-muted mt-1">or click to browse. Accepts .csv files only.</p>
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

        {/* ══════════════════════════════════════ */}
        {/* ── STEP 2: PROCESSING ── */}
        {/* ══════════════════════════════════════ */}
        {step === "processing" && (
          <div className="glass p-12 text-center animate-fade-in">
            <Loader2 size={48} className="mx-auto mb-4 text-primary animate-spin" />
            <h2 className="text-xl font-bold mb-2">Analyzing your CSV…</h2>
            <p className="text-muted text-sm">Running 22 anomaly detection rules across every row. This usually takes a few seconds.</p>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* ── STEP 3: REVIEW ── */}
        {/* ══════════════════════════════════════ */}
        {step === "review" && report && (
          <div className="animate-fade-in space-y-6">
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-sm p-4 text-center">
                <p className="text-3xl font-bold text-success">{report.imported}</p>
                <p className="text-xs text-muted mt-1">✅ Imported</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-3xl font-bold text-danger">{report.flagged}</p>
                <p className="text-xs text-muted mt-1">⚠️ Flagged</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-3xl font-bold text-muted">{report.skipped}</p>
                <p className="text-xs text-muted mt-1">❌ Skipped</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-3xl font-bold text-warning">{report.auto_fixed}</p>
                <p className="text-xs text-muted mt-1">🔧 Auto-Fixed</p>
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                {report.total_rows} total rows processed · Exchange rate: {formatINR(parseFloat(report.exchange_rate_used))}/USD
              </p>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadReport} className="btn-secondary text-sm">
                  <Download size={14} /> Download Report
                </button>
                {allResolved && (
                  <button onClick={handleFinalize} className="btn-primary text-sm">
                    <Flag size={14} /> Finalize Import
                  </button>
                )}
              </div>
            </div>

            {/* ── Flagged Items Requiring Human Approval ── */}
            {unresolvedFlagged.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-danger" />
                  Flagged for Review — {unresolvedFlagged.length} item{unresolvedFlagged.length !== 1 ? "s" : ""} need your approval
                </h2>
                <p className="text-sm text-muted mb-4">
                  Meera&apos;s rule: &quot;I want to approve anything the app deletes or changes.&quot;
                </p>
                <div className="space-y-3">
                  {unresolvedFlagged.map((anomaly) => (
                    <div key={anomaly.id} className="glass p-4 border-l-4 border-danger">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <XCircle size={16} className="text-danger" />
                          <span className="badge badge-error">{anomaly.severity}</span>
                          <span className="text-sm font-mono text-muted">Row {anomaly.row_number}</span>
                          <span className="text-xs font-mono text-muted bg-surface px-2 py-0.5 rounded">{anomaly.anomaly_type}</span>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{anomaly.description}</p>
                      <div className="glass-sm p-3 mb-3 text-xs">
                        <p className="text-muted mb-1 font-semibold">Suggested Action</p>
                        <p>{anomaly.suggested_action}</p>
                      </div>

                      {/* Optional note / corrected value input */}
                      <div className="mb-3">
                        <input
                          type="text"
                          className="input text-sm"
                          placeholder="Provide corrected value (optional)"
                          value={resolveNotes[anomaly.id] || ""}
                          onChange={(e) => setResolveNotes((prev) => ({ ...prev, [anomaly.id]: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolve(anomaly.id, "approve")}
                          disabled={resolving === anomaly.id}
                          className="btn-success text-sm"
                        >
                          {resolving === anomaly.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Import Anyway
                        </button>
                        <button
                          onClick={() => handleResolve(anomaly.id, "reject")}
                          disabled={resolving === anomaly.id}
                          className="btn-danger text-sm"
                        >
                          {resolving === anomaly.id ? <Loader2 size={14} className="animate-spin" /> : <SkipForward size={14} />}
                          Skip This Row
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Full Anomaly Table ── */}
            <div>
              <h2 className="text-lg font-bold mb-3">All Detected Anomalies</h2>
              <div className="glass overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wider">
                        <th className="px-4 py-3 w-16">Row</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Issue</th>
                        <th className="px-4 py-3">Action Taken</th>
                        <th className="px-4 py-3 w-28">Status</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.anomalies.map((a) => {
                        const status = getStatusLabel(a);
                        const isExpanded = expandedRow === a.id;
                        return (
                          <>
                            <tr key={a.id} className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
                              <td className="px-4 py-3 font-mono tabular-nums">{a.row_number}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getSeverityIcon(a.severity)}
                                  <span className={`font-mono text-xs ${getSeverityClass(a.severity)}`}>{a.anomaly_type}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 max-w-xs truncate">{a.description}</td>
                              <td className="px-4 py-3 text-xs text-muted max-w-xs truncate">{a.suggested_action}</td>
                              <td className="px-4 py-3">
                                <span className={`badge ${status.cls}`}>{status.text}</span>
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => setExpandedRow(isExpanded ? null : a.id)} className="text-muted hover:text-foreground">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${a.id}-detail`} className="bg-surface/30">
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="text-xs space-y-1">
                                    <p><span className="text-muted font-semibold">Severity:</span> <span className={getSeverityClass(a.severity)}>{a.severity}</span></p>
                                    <p><span className="text-muted font-semibold">Full Description:</span> {a.description}</p>
                                    <p><span className="text-muted font-semibold">Suggested Action:</span> {a.suggested_action}</p>
                                    <p><span className="text-muted font-semibold">Auto-Resolved:</span> {a.auto_resolved ? "Yes" : "No"}</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* ── STEP 4: DONE ── */}
        {/* ══════════════════════════════════════ */}
        {step === "done" && report && (
          <div className="glass p-10 text-center animate-slide-up">
            <CheckCircle2 size={56} className="mx-auto mb-4 text-success" />
            <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
            <p className="text-muted mb-8">Your data has been successfully processed and imported into the database.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold">{report.total_rows}</p>
                <p className="text-xs text-muted">Total Rows</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold text-success">{report.imported}</p>
                <p className="text-xs text-muted">✅ Imported</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold text-warning">{report.auto_fixed}</p>
                <p className="text-xs text-muted">🔧 Auto-Fixed</p>
              </div>
              <div className="glass-sm p-4 text-center">
                <p className="text-2xl font-bold text-danger">{report.skipped}</p>
                <p className="text-xs text-muted">❌ Skipped</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={handleDownloadReport} className="btn-secondary">
                <Download size={16} /> Download Full Report
              </button>
              <Link href={`/dashboard/${groupId}/expenses`} className="btn-primary">
                View Ledger
              </Link>
              <Link href={`/dashboard/${groupId}`} className="btn-secondary">
                Back to Group
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
