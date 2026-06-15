"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { GroupDetail, Expense } from "@/lib/types";
import { formatBalance, formatDate, getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Search, Filter } from "lucide-react";
import { AddExpenseDrawer } from "@/components/expenses/AddExpenseDrawer";

export default function GroupExpensesPage() {
  const { groupId } = useParams();
  const id = parseInt(groupId as string, 10);
  
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gData, eData] = await Promise.all([
        api.groups.detail(id),
        api.expenses.list(id)
      ]);
      setGroup(gData);
      setExpenses(eData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!group) return <div>Group not found</div>;

  const activeMembers = group.members.filter(m => !m.left_at);

  return (
    <div className="space-y-6 relative">
      <PageHeader 
        title={group.name} 
        actions={
          <Button onClick={() => setIsDrawerOpen(true)}>
            <Plus size={16} className="mr-2" /> Add Expense
          </Button>
        }
      />

      {/* Members Row */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {group.members.map(m => (
          <Avatar 
            key={m.user_id} 
            name={m.user_name} 
            size="md" 
            inactive={!!m.left_at} 
          />
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-2.5 text-ink-400" />
          <input 
            type="text" 
            placeholder="Search expenses..." 
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          />
        </div>
        <Button variant="secondary" className="sm:w-auto w-full">
          <Filter size={16} className="mr-2" /> Filters
        </Button>
      </div>

      {/* Expenses List */}
      <Card padding="none" className="overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-ink-600">
            <p>No expenses yet.</p>
            <Button variant="ghost" onClick={() => setIsDrawerOpen(true)} className="mt-4">
              Add your first expense
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map(exp => (
              <div key={exp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas/50 transition-colors border-l-4 border-l-brand-500">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-ink-900 text-base">{exp.description}</span>
                    <span className="text-xs text-ink-400 bg-canvas px-2 py-0.5 rounded">{formatDate(exp.expense_date)}</span>
                  </div>
                  <div className="text-sm text-ink-600">
                    Paid by <span className="font-medium">{exp.paid_by_name}</span>{" "}
                    <span className="amount ml-1 font-semibold text-ink-900">{formatBalance(exp.amount)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-ink-400 mb-1">Your share</div>
                  <div className="amount text-sm font-semibold text-negative-text">
                    {formatBalance(-exp.my_share)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Expense Drawer */}
      {isDrawerOpen && (
        <AddExpenseDrawer 
          groupId={id} 
          members={activeMembers} 
          onClose={() => setIsDrawerOpen(false)} 
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}
