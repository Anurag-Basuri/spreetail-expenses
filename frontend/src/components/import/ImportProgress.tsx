import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

interface ImportProgressProps {
  onComplete: () => void;
}

export function ImportProgress({ onComplete }: ImportProgressProps) {
  const [progress, setProgress] = useState(0);

  // Fake progress animation for UX
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <Card className="max-w-xl mx-auto p-8 text-center">
      <h2 className="text-xl font-bold text-ink-900 mb-2">Analyzing your CSV...</h2>
      <p className="text-sm text-ink-500 mb-8">This will just take a moment</p>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-canvas rounded-full overflow-hidden mb-8">
        <div 
          className="h-full bg-brand-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="space-y-4 text-left max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          {progress > 20 ? <CheckCircle2 className="text-positive-text" size={20} /> : <Loader2 className="animate-spin text-ink-400" size={20} />}
          <span className={progress > 20 ? "text-ink-900 font-medium" : "text-ink-500"}>Parsing rows...</span>
          {progress > 20 && <span className="ml-auto text-xs text-ink-400">✓ 43 rows found</span>}
        </div>
        <div className="flex items-center gap-3">
          {progress > 60 ? <CheckCircle2 className="text-positive-text" size={20} /> : progress > 20 ? <Loader2 className="animate-spin text-brand-500" size={20} /> : <div className="w-5" />}
          <span className={progress > 60 ? "text-ink-900 font-medium" : progress > 20 ? "text-brand-700 font-medium" : "text-ink-400"}>Normalizing names...</span>
        </div>
        <div className="flex items-center gap-3">
          {progress >= 100 ? <CheckCircle2 className="text-positive-text" size={20} /> : progress > 60 ? <RefreshCw className="animate-spin text-brand-500" size={20} /> : <div className="w-5" />}
          <span className={progress >= 100 ? "text-ink-900 font-medium" : progress > 60 ? "text-brand-700 font-medium" : "text-ink-400"}>Detecting anomalies...</span>
        </div>
      </div>
    </Card>
  );
}
