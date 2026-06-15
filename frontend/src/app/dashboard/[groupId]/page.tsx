"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  ArrowLeft,
  ArrowRightLeft,
  FileSpreadsheet,
  Loader2,
  UserPlus,
  BookOpen,
  TrendingDown,
  TrendingUp,
  X,
  Calendar,
} from "lucide-react";

interface GroupDetail {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
  members: {
    user_id: number;
    user_name: string;
    joined_at: string;
    left_at: string | null;
  }[];
}

interface Transaction {
  from: number;
  from_name: string;
  to: number;
  to_name: string;
  amount: string;
}

interface GroupSummary {
  group_id: number;
  net_balances: Record<string, string>;
  simplified_transactions: Transaction[];
  member_names: Record<string, string>;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberDate, setMemberDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && groupId) {
      Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/settlements/${groupId}/summary`).catch(() => null),
      ])
        .then(([groupRes, summaryRes]) => {
          setGroup(groupRes.data);
          if (summaryRes) setSummary(summaryRes.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, groupId]);

  const handleAddMember = async () => {
    setMemberError("");
    setAddingMember(true);
    try {
      // Look up user by searching — for now we use user_id directly
      // In a real app we'd have a search-by-email endpoint
      await api.post(`/groups/${groupId}/members`, {
        user_id: parseInt(memberEmail),
        joined_at: memberDate,
      });
      // Refresh group data
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
      setShowAddMember(false);
      setMemberEmail("");
    } catch {
      setMemberError("Failed to add member. Check the user ID.");
    } finally {
      setAddingMember(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Group not found.</p>
      </div>
    );
  }

  const activeMembers = group.members.filter((m) => !m.left_at);

  return (
    <div className="min-h-screen">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold">{group.name}</h1>
            <p className="text-xs text-muted">
              {activeMembers.length} active member
              {activeMembers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-secondary text-sm px-3 py-2"
          >
            <UserPlus size={14} /> Add Member
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href={`/dashboard/${groupId}/expenses`}
            className="glass-sm p-4 hover:border-primary/50 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">View Ledger</p>
              <p className="text-xs text-muted">Rohan&apos;s audit trail</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/${groupId}/import`}
            className="glass-sm p-4 hover:border-primary/50 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-warning/15 text-warning flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Import CSV</p>
              <p className="text-xs text-muted">Smart data importer</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/${groupId}/settle`}
            className="glass-sm p-4 hover:border-primary/50 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-success/15 text-success flex items-center justify-center">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Settle Up</p>
              <p className="text-xs text-muted">Record a payment</p>
            </div>
          </Link>
        </div>

        {/* ── Simplified Balances ── */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Simplified Balances</h2>
          {summary && summary.simplified_transactions.length > 0 ? (
            <div className="space-y-3">
              {summary.simplified_transactions.map((txn, i) => (
                <div
                  key={i}
                  className="glass-sm p-4 flex items-center justify-between animate-fade-in"
                  style={{ animationDelay: `${0.05 * i}s`, opacity: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-danger/15 text-danger flex items-center justify-center font-bold text-sm">
                      {txn.from_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {txn.from_name}{" "}
                        <span className="text-muted">pays</span>{" "}
                        {txn.to_name}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-lg tabular-nums">
                    ₹{parseFloat(txn.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-sm p-8 text-center">
              <ArrowRightLeft
                size={36}
                className="mx-auto text-muted mb-3"
              />
              <p className="text-muted text-sm">
                All settled up! No outstanding balances.
              </p>
            </div>
          )}
        </div>

        {/* ── Net Balances ── */}
        {summary && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Net Balances</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(summary.net_balances).map(
                ([userId, balance], i) => {
                  const amt = parseFloat(balance);
                  const name =
                    summary.member_names[userId] || `User ${userId}`;
                  return (
                    <div
                      key={userId}
                      className="glass-sm p-4 flex items-center justify-between animate-fade-in"
                      style={{ animationDelay: `${0.05 * i}s`, opacity: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            amt >= 0
                              ? "bg-success/15 text-success"
                              : "bg-danger/15 text-danger"
                          }`}
                        >
                          {amt >= 0 ? (
                            <TrendingUp size={18} />
                          ) : (
                            <TrendingDown size={18} />
                          )}
                        </div>
                        <span className="font-medium">{name}</span>
                      </div>
                      <span
                        className={`font-bold tabular-nums ${
                          amt >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {amt >= 0 ? "+" : ""}₹
                        {Math.abs(amt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* ── Members ── */}
        <div>
          <h2 className="text-xl font-bold mb-4">Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.members.map((member, i) => (
              <div
                key={member.user_id}
                className="glass-sm p-4 flex items-center justify-between animate-fade-in"
                style={{ animationDelay: `${0.05 * i}s`, opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                    {member.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.user_name}</p>
                    <p className="text-xs text-muted">
                      Joined{" "}
                      {new Date(member.joined_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                      {member.left_at && (
                        <span className="text-danger">
                          {" "}
                          · Left{" "}
                          {new Date(member.left_at).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {member.left_at ? (
                  <span className="badge badge-warning">Inactive</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="glass p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Member</h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-muted hover:text-foreground transition"
              >
                <X size={20} />
              </button>
            </div>

            {memberError && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                {memberError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  User ID
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="Enter user ID"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  Joined On
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="input"
                    value={memberDate}
                    onChange={(e) => setMemberDate(e.target.value)}
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={() => setShowAddMember(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="btn-primary"
                disabled={addingMember || !memberEmail}
              >
                {addingMember ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
