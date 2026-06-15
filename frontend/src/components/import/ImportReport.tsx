import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ImportReport as ImportReportType } from "@/lib/types";

interface ImportReportProps {
  report: ImportReportType;
  groupId: number;
}

export function ImportReport({ report, groupId }: ImportReportProps) {
  
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_report_${report.run_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="max-w-2xl mx-auto text-center py-10 px-6">
      <div className="w-16 h-16 rounded-full bg-positive-bg text-positive-text flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 size={32} />
      </div>
      
      <h2 className="text-2xl font-bold text-ink-900 mb-2">Import Complete</h2>
      <p className="text-ink-500 mb-8">Your expenses have been successfully added to the group ledger.</p>
      
      <div className="bg-canvas border border-border rounded-xl p-6 text-left mb-8 max-w-sm mx-auto shadow-inner">
        <ul className="space-y-4 text-sm font-medium text-ink-700">
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span>Clean rows imported</span>
            <span className="font-bold text-ink-900">{report.stats.ready}</span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span>Auto-fixed issues</span>
            <span className="font-bold text-ink-900">{report.stats.fixed}</span>
          </li>
          <li className="flex justify-between border-b border-border/50 pb-2">
            <span>Rows skipped</span>
            <span className="font-bold text-ink-900">{report.stats.skipped}</span>
          </li>
          <li className="flex justify-between pt-1">
            <span>Anomalies resolved</span>
            <span className="font-bold text-ink-900">{report.anomalies.length}</span>
          </li>
        </ul>
        
        <div className="mt-6 p-3 bg-info-bg border border-info-border rounded-lg text-xs text-info-text flex gap-2">
          <span className="text-lg leading-none">ℹ️</span>
          <span>Exchange rate used: ₹84.00/$ (mid-March 2026, RBI reference)</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="secondary" onClick={handleDownload} className="w-full sm:w-auto">
          <Download size={16} className="mr-2" /> Download Report as JSON
        </Button>
        <Link href={`/groups/${groupId}`}>
          <Button className="w-full sm:w-auto">
            <ExternalLink size={16} className="mr-2" /> View Imported Expenses
          </Button>
        </Link>
      </div>
    </Card>
  );
}
