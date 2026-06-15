"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { GroupDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MembersPage() {
  const { groupId } = useParams();
  const id = parseInt(groupId as string, 10);
  
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembers = () => {
    api.groups.detail(id)
      .then(res => setGroup(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchMembers();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!group) return null;

  const activeMembers = group.members.filter(m => !m.left_at);
  const pastMembers = group.members.filter(m => m.left_at);

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader 
        title="Members" 
        subtitle={`Manage people in ${group.name}`} 
        actions={<Button>+ Add Member</Button>}
      />

      {/* Active Members */}
      <section>
        <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-3">Active Members</h2>
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-border">
            {activeMembers.map(member => (
              <div key={member.user_id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-canvas transition-colors group">
                <div className="flex items-center gap-4">
                  <Avatar name={member.user_name} size="md" />
                  <div>
                    <div className="font-semibold text-ink-900">{member.user_name}</div>
                    <div className="text-xs text-ink-500 mt-0.5">Member since {formatDate(member.joined_at)}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-negative-text hover:bg-negative-bg hover:text-negative-text">
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Past Members */}
      {pastMembers.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-3">Past Members</h2>
          <Card padding="none" className="overflow-hidden bg-canvas/50">
            <div className="divide-y divide-border">
              {pastMembers.map(member => (
                <div key={member.user_id} className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={member.user_name} size="md" inactive />
                    <div>
                      <div className="font-medium text-ink-600">{member.user_name}</div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        {formatDate(member.joined_at)} – {formatDate(member.left_at!)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-ink-400 bg-border px-2 py-1 rounded">
                    Left the group
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
