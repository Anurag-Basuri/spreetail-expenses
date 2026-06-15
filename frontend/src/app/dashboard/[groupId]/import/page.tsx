"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatINR } from "@/lib/utils";
import TopNav from "@/components/TopNav";
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
    <div className="min-h-screen bg-[#f4f5f6]">
      <TopNav />

      {/* ── Sub Navigation ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/dashboard/${groupId}`} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Smart CSV Importer</h1>
            <p className="text-sm text-gray-500">Upload, detect anomalies, review & import</p>
          </div>
        </div>
      </div>

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
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${dragActive ? "border-[#5bc5a7] bg-[#5bc5a7]/5" : "border-gray-300 hover:border-[#5bc5a7]/50"}`}
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <input id="csv-file-input" type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              <FileSpreadsheet size={48} className={`mx-auto mb-4 ${dragActive ? "text-[#5bc5a7]" : "text-gray-300"}`} />
              {file ? (
                <>
                  <p className="font-bold text-lg text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{(file.size / 1024).toFixed(1)} KB — Ready to import</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-lg text-gray-800">Drop your CSV file here</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">or click to browse. Accepts .csv files only.</p>
                </>
              )}
            </div>
            {file && (
              <div className="mt-6 flex justify-center">
                <button onClick={handleUpload} className="btn-primary text-base px-8 py-3 shadow-lg">
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
          <div className="bg-white rounded-xl shadow-sm p-16 text-center animate-fade-in max-w-2xl mx-auto border border-gray-200">
            <Loader2 size={48} className="mx-auto mb-6 text-[#5bc5a7] animate-spin" />
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Analyzing your CSV…</h2>
            <p className="text-gray-500 font-medium">Running 22 anomaly detection rules across every row. This usually takes a few seconds.</p>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* ── STEP 3: REVIEW ── */}
        {/* ══════════════════════════════════════ */}
        {step === "review" && report && (
          <div className="animate-fade-in space-y-6">
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
                <p className="text-3xl font-bold text-[#5bc5a7]">{report.imported}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Imported</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
                <p className="text-3xl font-bold text-[#ff652f]">{report.flagged}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Flagged</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
                <p className="text-3xl font-bold text-gray-400">{report.skipped}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Skipped</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
                <p className="text-3xl font-bold text-[#f59e0b]">{report.auto_fixed}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-2">Auto-Fixed</p>
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
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
                  <AlertTriangle size={20} className="text-[#ff652f]" />
                  Flagged for Review
                </h2>
                <p className="text-sm text-gray-500 font-medium mb-4">
                  {unresolvedFlagged.length} item{unresolvedFlagged.length !== 1 ? "s" : ""} need your approval. Meera&apos;s rule: &quot;I want to approve anything the app deletes or changes.&quot;
                </p>
                <div className="space-y-4">
                  {unresolvedFlagged.map((anomaly) => (
                    <div key={anomaly.id} className="bg-white p-5 rounded-lg border border-gray-200 border-l-4 border-l-[#ff652f] shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <XCircle size={16} className="text-[#ff652f]" />
                          <span className="badge badge-error">{anomaly.severity}</span>
                          <span className="text-xs font-mono font-bold text-gray-500">Row {anomaly.row_number}</span>
                          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">{anomaly.anomaly_type}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-3">{anomaly.description}</p>
                      <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-4 text-xs">
                        <p className="text-gray-500 mb-1 font-bold uppercase tracking-wider">Suggested Action</p>
                        <p className="font-medium text-gray-700">{anomaly.suggested_action}</p>
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
              <h2 className="text-lg font-bold mb-3 text-gray-800">All Detected Anomalies</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                            <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-gray-500 tabular-nums">{a.row_number}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getSeverityIcon(a.severity)}
                                  <span className={`font-mono text-xs font-bold ${getSeverityClass(a.severity)}`}>{a.anomaly_type}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 max-w-xs truncate font-medium text-gray-800">{a.description}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{a.suggested_action}</td>
                              <td className="px-4 py-3">
                                <span className={`badge ${status.cls}`}>{status.text}</span>
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => setExpandedRow(isExpanded ? null : a.id)} className="text-gray-400 hover:text-gray-600">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${a.id}-detail`} className="bg-gray-50 border-b border-gray-200">
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="text-xs space-y-2">
                                    <p><span className="text-gray-500 font-bold uppercase tracking-wider">Severity:</span> <span className={`${getSeverityClass(a.severity)} font-bold ml-2`}>{a.severity}</span></p>
                                    <p><span className="text-gray-500 font-bold uppercase tracking-wider">Full Description:</span> <span className="font-medium text-gray-800 ml-2">{a.description}</span></p>
                                    <p><span className="text-gray-500 font-bold uppercase tracking-wider">Suggested Action:</span> <span className="font-medium text-gray-800 ml-2">{a.suggested_action}</span></p>
                                    <p><span className="text-gray-500 font-bold uppercase tracking-wider">Auto-Resolved:</span> <span className="font-medium text-gray-800 ml-2">{a.auto_resolved ? "Yes" : "No"}</span></p>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center animate-slide-up max-w-2xl mx-auto">
            <CheckCircle2 size={56} className="mx-auto mb-4 text-[#5bc5a7]" />
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Import Complete!</h2>
            <p className="text-gray-500 mb-8 font-medium">Your data has been successfully processed and imported into the database.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                <p className="text-2xl font-bold text-gray-800">{report.total_rows}</p>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Total Rows</p>
              </div>
              <div className="bg-[#5bc5a7]/10 rounded-lg p-4 text-center border border-[#5bc5a7]/20">
                <p className="text-2xl font-bold text-[#5bc5a7]">{report.imported}</p>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Imported</p>
              </div>
              <div className="bg-[#f59e0b]/10 rounded-lg p-4 text-center border border-[#f59e0b]/20">
                <p className="text-2xl font-bold text-[#f59e0b]">{report.auto_fixed}</p>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Auto-Fixed</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center border border-gray-200">
                <p className="text-2xl font-bold text-gray-400">{report.skipped}</p>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Skipped</p>
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
