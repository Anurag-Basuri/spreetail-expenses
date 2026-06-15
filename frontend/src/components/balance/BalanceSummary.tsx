import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatINR } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface BalanceSummaryProps {
  settlements: {
    from_user_id: number;
    from_user_name: string;
    to_user_id: number;
    to_user_name: string;
    amount: number;
  }[];
}

export function BalanceSummary({ settlements }: BalanceSummaryProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5 border-b border-border bg-canvas">
        <h2 className="text-sm font-semibold text-ink-900">
          To settle everything, {settlements.length} payment{settlements.length !== 1 ? 's' : ''} needed:
        </h2>
      </div>
      <div className="divide-y divide-border">
        {settlements.length === 0 ? (
          <div className="p-8 text-center text-ink-600">All balances are settled! 🎉</div>
        ) : (
          settlements.map((settlement, i) => (
            <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar name={settlement.from_user_name} size="sm" />
                  <span className="font-medium text-ink-900">{settlement.from_user_name}</span>
                </div>
                <ArrowRight size={16} className="text-ink-400" />
                <div className="flex items-center gap-2">
                  <Avatar name={settlement.to_user_name} size="sm" />
                  <span className="font-medium text-ink-900">{settlement.to_user_name}</span>
                </div>
                <span className="amount font-semibold text-lg text-ink-900 ml-2">
                  {formatINR(settlement.amount)}
                </span>
              </div>
              <Button variant="secondary" size="sm">Record Payment</Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
