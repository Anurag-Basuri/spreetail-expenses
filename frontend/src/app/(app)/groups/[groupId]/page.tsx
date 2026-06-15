"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatBalance, formatDate, getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Search, Filter } from "lucide-react";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { useGroupDetail } from "@/hooks/useGroup";
import { useExpenses } from "@/hooks/useExpenses";
import { AddExpenseDrawer } from "@/components/expenses/AddExpenseDrawer";

export default function GroupExpensesPage() {
  const { groupId } = useParams();
  const id = parseInt(groupId as string, 10);
  
  const { group, loading: groupLoading } = useGroupDetail(id);
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(id);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (groupLoading || expensesLoading) {
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
          <ExpenseList expenses={expenses} />
        )}
      </Card>

      {/* Add Expense Drawer */}
      {isDrawerOpen && (
        <AddExpenseDrawer 
          groupId={id} 
          members={activeMembers} 
          onClose={() => setIsDrawerOpen(false)} 
          onSuccess={refetchExpenses} 
        />
      )}
    </div>
  );
}
