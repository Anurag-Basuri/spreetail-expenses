"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Group } from "@/lib/types";
import { formatBalance, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch actual groups and overall balance.
    // We'll mock a bit of the balance info for the dashboard UI since API doesn't have an "overall" endpoint yet.
    api.groups.list()
      .then(res => setGroups(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const overallBalance = 3420; // Mocked positive balance for Rohan
  const isPositive = overallBalance >= 0;

  if (!user) return null;

  return (
    <div className="space-y-6 md:space-y-8 max-w-3xl">
      <PageHeader 
        title={`Good morning, ${user.name.split(' ')[0]} 👋`} 
        subtitle={formatDate(new Date().toISOString())} 
      />

      {/* Net Balance Card */}
      <Card padding="lg" className={isPositive ? "bg-positive-bg border-positive-border" : "bg-negative-bg border-negative-border"}>
        <h2 className="text-sm font-semibold text-ink-600 mb-2">Your overall balance</h2>
        <div className={`amount text-4xl md:text-5xl font-bold tracking-tight mb-2 ${isPositive ? "text-positive-text" : "text-negative-text"}`}>
          {formatBalance(overallBalance)}
        </div>
        <p className={`text-sm ${isPositive ? "text-positive-text/80" : "text-negative-text/80"}`}>
          {isPositive ? "You are owed money across 1 group" : "You owe money across your groups"}
        </p>
      </Card>

      {/* My Groups */}
      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-4">My Groups</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {groups.map(g => (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer hover:border-brand-100">
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink-900 text-lg mb-1">{g.name}</h3>
                    <p className="text-sm text-ink-600 mb-4">Click to view expenses</p>
                    {/* Mocked balance per group for visual completeness */}
                    <div className="text-sm">
                      <span className="text-ink-600 mr-2">Your balance:</span>
                      <span className="amount text-positive-text font-semibold">{formatBalance(1200)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border text-xs text-ink-400">
                    Created {formatDate(g.created_at)}
                  </div>
                </Card>
              </Link>
            ))}

            {/* New Group Card */}
            <button className="h-full min-h-[140px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl bg-canvas hover:bg-surface hover:border-brand-500 hover:text-brand-600 transition-colors text-ink-400">
              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <Plus size={20} />
              </div>
              <span className="font-medium text-sm">New Group</span>
            </button>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold text-ink-900 mb-4">Recent Activity</h2>
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-border">
            {/* Mocking recent activity as requested */}
            {[
              { date: "Jun 12", desc: "Grocery Run", paidBy: "Aisha paid", total: 1200, share: 300 },
              { date: "Jun 10", desc: "Electricity Bill", paidBy: "Rohan paid", total: 2400, share: 600 },
              { date: "Jun 08", desc: "Dinner Delivery", paidBy: "Priya paid", total: 840, share: 210 },
            ].map((act, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-canvas transition-colors">
                <div className="flex items-start gap-4">
                  <div className="text-xs font-medium text-ink-400 w-12 pt-0.5">{act.date}</div>
                  <div>
                    <div className="font-medium text-ink-900 text-sm">{act.desc}</div>
                    <div className="text-xs text-ink-600 mt-1">{act.paidBy} <span className="amount">{formatBalance(act.total)}</span></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink-600">Your share</div>
                  <div className="amount text-sm font-medium text-negative-text">{formatBalance(-act.share)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

    </div>
  );
}
