import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { MemberBalance } from "@/lib/types";
import { formatBalance, formatINR, formatDate, cn } from "@/lib/utils";

interface BalanceDrillDownProps {
  memberDetail: MemberBalance | null;
  loading: boolean;
}

export function BalanceDrillDown({ memberDetail, loading }: BalanceDrillDownProps) {
  return (
    <Card className="mt-6 border-l-4 border-l-brand-500 animate-fade-in shadow-lg">
      {loading || !memberDetail ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-ink-900">
              {memberDetail.user_name}'s Balance Breakdown
            </h3>
            <div className="text-right">
              <div className="text-xs text-ink-500 font-medium uppercase tracking-wider mb-1">Net Balance</div>
              <div className={cn("amount text-xl font-bold", memberDetail.net_balance >= 0 ? "text-positive-text" : "text-negative-text")}>
                {formatBalance(memberDetail.net_balance)}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Owed By */}
            <div className="bg-canvas p-4 rounded-xl border border-border">
              <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Is owed by:</h4>
              {memberDetail.owed_by.length === 0 ? (
                <div className="text-sm text-ink-400 italic">No one</div>
              ) : (
                <div className="space-y-2">
                  {memberDetail.owed_by.map(item => (
                    <div key={item.user_id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-ink-700">{item.user_name}</span>
                      <span className="amount text-positive-text font-semibold">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owes */}
            <div className="bg-canvas p-4 rounded-xl border border-border">
              <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Owes:</h4>
              {memberDetail.owes.length === 0 ? (
                <div className="text-sm text-ink-400 italic">No one</div>
              ) : (
                <div className="space-y-2">
                  {memberDetail.owes.map(item => (
                    <div key={item.user_id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-ink-700">{item.user_name}</span>
                      <span className="amount text-negative-text font-semibold">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Expense Breakdown</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">My Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberDetail.expenses.map(exp => (
                  <TableRow key={exp.expense_id}>
                    <TableCell className="text-ink-500 whitespace-nowrap">{formatDate(exp.expense_date)}</TableCell>
                    <TableCell className="font-medium text-ink-900">{exp.description}</TableCell>
                    <TableCell className="text-ink-600">{exp.paid_by_name}</TableCell>
                    <TableCell className="text-right amount text-ink-900">{formatINR(exp.amount)}</TableCell>
                    <TableCell className="text-right amount text-negative-text font-medium">
                      {formatBalance(-exp.my_share)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
}
