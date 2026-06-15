import { useState } from "react";
import { ImportReport as ImportReportType } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, X, Edit2, AlertTriangle, Info, Wrench, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnomalyTableProps {
  report: ImportReportType;
  onResolve: (anomalyId: number, action: "approve" | "skip") => void;
  onFinalize: () => void;
}

export function AnomalyTable({ report, onResolve, onFinalize }: AnomalyTableProps) {
  
  const pendingCount = report.anomalies.filter(a => a.status === "pending").length;
  const resolvedCount = report.anomalies.filter(a => a.status === "resolved").length;
  const totalCount = report.anomalies.length;
  const allResolved = pendingCount === 0;

  const SeverityIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'ERROR': return <XCircle size={18} className="text-negative-text" />;
      case 'WARNING': return <AlertTriangle size={18} className="text-warning-text" />;
      case 'INFO': return <Info size={18} className="text-info-text" />;
      case 'AUTO-FIXED': return <Wrench size={18} className="text-positive-text" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="border-positive-border bg-positive-bg text-center">
          <div className="text-3xl font-bold text-positive-text mb-1">{report.stats.ready}</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-positive-text/80">✅ Ready to import</div>
        </Card>
        <Card padding="md" className="border-warning-border bg-warning-bg text-center">
          <div className="text-3xl font-bold text-warning-text mb-1">{report.stats.flagged}</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-warning-text/80">⚠️ Review needed</div>
        </Card>
        <Card padding="md" className="border-brand-200 bg-brand-50 text-center">
          <div className="text-3xl font-bold text-brand-700 mb-1">{report.stats.fixed}</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700/80">🔧 Auto-fixed</div>
        </Card>
        <Card padding="md" className="border-border bg-canvas text-center">
          <div className="text-3xl font-bold text-ink-500 mb-1">{report.stats.skipped}</div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">⏭ Skipped</div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border">
        <h2 className="text-lg font-bold text-ink-900">
          {pendingCount} item{pendingCount !== 1 ? 's' : ''} need your review
        </h2>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm">Import {report.stats.ready} Clean Rows Now</Button>
        </div>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-canvas border-b border-border text-ink-600 font-medium text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-16 text-center">Row</th>
              <th className="px-4 py-3">Problem</th>
              <th className="px-4 py-3">Raw Data</th>
              <th className="px-4 py-3">Proposed Action</th>
              <th className="px-4 py-3 w-40 text-center">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {report.anomalies.map((anomaly) => (
              <tr key={anomaly.id} className={cn("transition-colors", anomaly.status === "resolved" ? "bg-canvas/50 opacity-60" : "hover:bg-canvas/30")}>
                <td className="px-4 py-4 text-center font-mono text-ink-500">{anomaly.row_num}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 font-medium text-ink-900">
                    <SeverityIcon type={anomaly.severity} />
                    {anomaly.problem}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <code className="px-2 py-1 bg-canvas rounded text-xs text-ink-600 border border-border">
                    {typeof anomaly.raw_data === 'string' ? anomaly.raw_data : JSON.stringify(anomaly.raw_data).substring(0, 40) + "..."}
                  </code>
                </td>
                <td className="px-4 py-4 text-ink-600">
                  {anomaly.proposed_action}
                </td>
                <td className="px-4 py-4">
                  {anomaly.status === "resolved" ? (
                    <div className="text-center font-medium text-ink-500 text-xs uppercase tracking-wider">
                      {anomaly.resolution_action === "approve" ? "Approved" : "Skipped"}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      {anomaly.severity !== 'ERROR' && (
                        <button 
                          onClick={() => onResolve(anomaly.id, "approve")}
                          className="w-8 h-8 rounded-lg bg-positive-bg text-positive-text hover:bg-green-100 flex items-center justify-center border border-positive-border transition-colors"
                          title="Approve proposed action"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => onResolve(anomaly.id, "skip")}
                        className="w-8 h-8 rounded-lg bg-negative-bg text-negative-text hover:bg-red-100 flex items-center justify-center border border-negative-border transition-colors"
                        title="Skip this row"
                      >
                        <X size={16} />
                      </button>
                      {anomaly.severity === 'ERROR' && (
                        <button 
                          className="w-8 h-8 rounded-lg bg-canvas text-ink-600 hover:bg-border flex items-center justify-center border border-border transition-colors"
                          title="Edit manually"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border shadow-sm sticky bottom-4">
        <div className="text-sm font-medium text-ink-600">
          Progress: <span className="text-ink-900 font-bold">{resolvedCount}</span> of {totalCount} reviewed
        </div>
        <Button 
          disabled={!allResolved} 
          onClick={onFinalize}
        >
          Finalize Import →
        </Button>
      </div>
    </div>
  );
}
