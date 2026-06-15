"use client";

import { useGroupList } from "@/hooks/useGroup";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { formatBalance } from "@/lib/utils";

export default function GroupsPage() {
  const { groups, loading, error } = useGroupList();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Your Groups" 
        subtitle="Manage your shared expenses and flatmates."
        actions={
          <Link href="/groups/new">
            <Button>
              <Plus size={16} className="mr-2" /> New Group
            </Button>
          </Link>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink-900 mb-2">No groups yet</h3>
          <p className="text-ink-500 mb-6 max-w-sm mx-auto">Create a group to start sharing expenses with your flatmates or travel buddies.</p>
          <Link href="/groups/new">
            <Button>Create your first group</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block group">
              <Card className="h-full hover:shadow-md hover:border-brand-300 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-ink-900 group-hover:text-brand-600 transition-colors">
                    {group.name}
                  </h3>
                  <div className="text-xs font-semibold text-ink-500 bg-canvas px-2 py-1 rounded">
                    {group.members?.length || 0} members
                  </div>
                </div>
                
                <p className="text-sm text-ink-600 line-clamp-2 mb-4">
                  {group.description || "No description provided."}
                </p>

                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Total Expenses</span>
                  <span className="amount font-bold text-ink-900">{formatBalance(group.total_expenses || 0)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
