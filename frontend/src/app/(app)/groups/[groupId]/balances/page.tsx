"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { useBalanceSummary, useMemberBalance } from "@/hooks/useBalance";
import { BalanceSummary } from "@/components/balance/BalanceSummary";
import { MemberBalanceCard } from "@/components/balance/MemberBalanceCard";
import { BalanceDrillDown } from "@/components/balance/BalanceDrillDown";

export default function BalancesPage() {
  const { groupId } = useParams();
  const id = parseInt(groupId as string, 10);
  
  const { summary, loading, error } = useBalanceSummary(id);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  
  const { memberBalance: memberDetail, loading: detailLoading } = useMemberBalance(
    id, 
    expandedUserId
  );

  const handleExpand = (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
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
      <BalanceSummary settlements={summary.minimum_settlements} />

      {/* SECTION 2: Member Balance Cards */}
      <div>
        <h2 className="text-lg font-semibold text-ink-900 mb-4">Member Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.member_balances.map(member => (
            <div key={member.user_id}>
              <MemberBalanceCard 
                userId={member.user_id}
                userName={member.user_name}
                netBalance={member.net_balance}
                onClick={handleExpand}
              />
            </div>
          ))}
        </div>
      </div>

      {expandedUserId && (
        <BalanceDrillDown memberDetail={memberDetail} loading={detailLoading} />
      )}
    </div>
  );
}
