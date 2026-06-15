"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { BalanceSummary, MemberBalance } from "@/lib/types";
import { formatBalance, formatINR, formatDate, getInitials, getAvatarColor, cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

export default function BalancesPage() {
  const { groupId } = useParams();
  const id = parseInt(groupId as string, 10);
  
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberBalance | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.balances.summary(id)
      .then(res => setSummary(res))
      .catch(err => setError(err.message || "Failed to load balances"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExpand = async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    setDetailLoading(true);
    try {
      const detail = await api.balances.member(id, userId);
      setMemberDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" title="Error">{error}</Alert>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <PageHeader title="Balance Summary" subtitle="Who owes who and how to settle up." />

      {/* SECTION 1: Minimum Settlements */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-5 border-b border-border bg-canvas">
          <h2 className="text-sm font-semibold text-ink-900">
            To settle everything, {summary.minimum_settlements.length} payment{summary.minimum_settlements.length !== 1 ? 's' : ''} needed:
          </h2>
        </div>
        <div className="divide-y divide-border">
          {summary.minimum_settlements.length === 0 ? (
            <div className="p-8 text-center text-ink-600">All balances are settled! 🎉</div>
          ) : (
            summary.minimum_settlements.map((settlement, i) => (
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

      {/* SECTION 2: Member Balance Cards */}
      <div>
        <h2 className="text-lg font-semibold text-ink-900 mb-4">Member Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.member_balances.map(member => {
            const isPositive = member.net_balance > 0;
            const isNegative = member.net_balance < 0;
            const isSettled = member.net_balance === 0;

            const cardClass = cn(
              "cursor-pointer hover:shadow-md transition-all h-full text-center flex flex-col items-center",
              isPositive && "bg-positive-bg border-positive-border hover:border-green-300",
              isNegative && "bg-negative-bg border-negative-border hover:border-red-300",
              isSettled && "bg-surface border-border"
            );

            const textClass = cn(
              "amount text-xl font-bold mt-3 mb-1",
              isPositive && "text-positive-text",
              isNegative && "text-negative-text",
              isSettled && "text-ink-500"
            );

            return (
              <div key={member.user_id}>
                <Card 
                  className={cardClass}
                  onClick={() => handleExpand(member.user_id)}
                >
                  <Avatar name={member.user_name} size="lg" className="mb-2 shadow-sm border-2 border-white" />
                  <div className="font-semibold text-ink-900 truncate w-full">{member.user_name}</div>
                  <div className={textClass}>
                    {formatBalance(member.net_balance)}
                  </div>
                  <div className={cn("text-xs font-medium", isPositive ? "text-positive-text/80" : isNegative ? "text-negative-text/80" : "text-ink-400")}>
                    {isPositive ? "is owed" : isNegative ? "owes" : "settled"}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* DRILL DOWN ACCORDION */}
      {expandedUserId && (
        <Card className="mt-6 border-l-4 border-l-brand-500 animate-fade-in shadow-lg">
          {detailLoading || !memberDetail ? (
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
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-canvas border-b border-border text-ink-600 font-medium">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Paid By</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">My Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {memberDetail.expenses.map(exp => (
                        <tr key={exp.expense_id} className="hover:bg-canvas/50 transition-colors">
                          <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                          <td className="px-4 py-3 font-medium text-ink-900">{exp.description}</td>
                          <td className="px-4 py-3 text-ink-600">{exp.paid_by_name}</td>
                          <td className="px-4 py-3 text-right amount text-ink-900">{formatINR(exp.amount)}</td>
                          <td className="px-4 py-3 text-right amount text-negative-text font-medium">
                            {formatBalance(-exp.my_share)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
