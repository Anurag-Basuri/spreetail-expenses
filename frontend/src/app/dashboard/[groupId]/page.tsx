"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import {
  ArrowLeft,
  ArrowRightLeft,
  FileSpreadsheet,
  Loader2,
  UserPlus,
  BookOpen,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Filter,
  Users,
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

interface MemberDetail {
  user_id: number;
  user_name: string;
  net_balance: string;
  owes: { user_id: number; user_name: string; amount: string }[];
  owed_by: { user_id: number; user_name: string; amount: string }[];
  expenses: {
    id: number;
    description: string;
    expense_date: string;
    amount_inr: string;
    paid_by: number;
    paid_by_name: string;
    my_share: string;
    i_paid: boolean;
  }[];
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
  const [memberUserId, setMemberUserId] = useState("");
  const [memberDate, setMemberDate] = useState(new Date().toISOString().split("T")[0]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
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

  const handleExpandUser = async (userId: number) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setMemberDetail(null);
      return;
    }
    setExpandedUser(userId);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/settlements/${groupId}/member/${userId}`);
      setMemberDetail(res.data);
    } catch {
      setMemberDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddMember = async () => {
    setMemberError("");
    setAddingMember(true);
    try {
      await api.post(`/groups/${groupId}/members`, {
        user_id: parseInt(memberUserId),
        joined_at: memberDate,
      });
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
      setShowAddMember(false);
      setMemberUserId("");
    } catch {
      setMemberError("Failed to add member. Check the user ID.");
    } finally {
      setAddingMember(false);
    }
  };

  const filteredExpenses = memberDetail?.expenses.filter((exp) => {
    if (dateFrom && exp.expense_date < dateFrom) return false;
    if (dateTo && exp.expense_date > dateTo) return false;
    return true;
  }) || [];

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f6]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f5f6]">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Group not found.</p>
        </div>
      </div>
    );
  }

  const activeMembers = group.members.filter((m) => !m.left_at);

  return (
    <div className="min-h-screen bg-[#f4f5f6]">
      <TopNav />

      {/* ── Sub Navigation ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
              <p className="text-sm text-gray-500">{activeMembers.length} active members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/${groupId}/expenses`} className="btn-secondary text-sm">
              <BookOpen size={16} /> Ledger
            </Link>
            <Link href={`/dashboard/${groupId}/import`} className="btn-secondary text-sm">
              <FileSpreadsheet size={16} /> Import
            </Link>
            <Link href={`/dashboard/${groupId}/settle`} className="btn-primary shadow-none text-sm bg-[#ff652f] hover:bg-[#e55a2a]">
              <ArrowRightLeft size={16} /> Settle Up
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ── Left Sidebar (Members) ── */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-[#5bc5a7]" /> Members
              </h2>
              <button onClick={() => setShowAddMember(true)} className="text-xs font-semibold text-[#5bc5a7] hover:text-[#489d85]">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs">
                      {member.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${member.left_at ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {member.user_name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Joined {new Date(member.joined_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content (Balances) ── */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {summary ? (
            <>
              {/* Balances List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">Group Balances</h2>
                  <span className="text-xs text-gray-500 font-medium">Click a member to view details</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {Object.entries(summary.net_balances).map(([userId, balance]) => {
                    const amt = parseFloat(balance);
                    const name = summary.member_names[userId] || `User ${userId}`;
                    const isExpanded = expandedUser === parseInt(userId);

                    return (
                      <div key={userId} className="block transition-colors hover:bg-gray-50/50">
                        <button
                          onClick={() => handleExpandUser(parseInt(userId))}
                          className="w-full text-left p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                              <span className="font-bold text-gray-600 text-sm">{name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">{name}</span>
                              <p className={`text-xs font-medium ${amt > 0 ? "text-[#5bc5a7]" : amt < 0 ? "text-[#ff652f]" : "text-gray-500"}`}>
                                {amt > 0 ? "gets back" : amt < 0 ? "owes" : "settled up"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold tabular-nums text-lg ${amt > 0 ? "text-[#5bc5a7]" : amt < 0 ? "text-[#ff652f]" : "text-gray-500"}`}>
                              {formatINR(Math.abs(amt))}
                            </span>
                            {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                          </div>
                        </button>

                        {/* Drill-down View */}
                        {isExpanded && (
                          <div className="p-5 bg-[#fcfcfc] border-t border-gray-100 border-l-4 border-l-[#5bc5a7]">
                            {loadingDetail ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 size={20} className="animate-spin text-[#5bc5a7]" />
                              </div>
                            ) : memberDetail ? (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* They owe you */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Gets back from</h4>
                                    {memberDetail.owed_by && memberDetail.owed_by.length > 0 ? (
                                      <div className="space-y-2">
                                        {memberDetail.owed_by.map((item) => (
                                          <div key={item.user_id} className="flex items-center justify-between bg-white border border-gray-100 rounded px-3 py-2 shadow-sm">
                                            <span className="text-sm font-medium text-gray-700">{item.user_name}</span>
                                            <span className="text-sm font-bold text-[#5bc5a7] tabular-nums">{formatINR(item.amount)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400 italic">No one</p>
                                    )}
                                  </div>
                                  
                                  {/* You owe them */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Owes</h4>
                                    {memberDetail.owes && memberDetail.owes.length > 0 ? (
                                      <div className="space-y-2">
                                        {memberDetail.owes.map((item) => (
                                          <div key={item.user_id} className="flex items-center justify-between bg-white border border-gray-100 rounded px-3 py-2 shadow-sm">
                                            <span className="text-sm font-medium text-gray-700">{item.user_name}</span>
                                            <span className="text-sm font-bold text-[#ff652f] tabular-nums">{formatINR(item.amount)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400 italic">No one</p>
                                    )}
                                  </div>
                                </div>

                                {/* Expense Breakdown */}
                                {memberDetail.expenses && memberDetail.expenses.length > 0 && (
                                  <div className="pt-2">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Related Expenses</h4>
                                      <div className="flex items-center gap-2">
                                        <Filter size={14} className="text-gray-400" />
                                        <input type="date" className="input text-xs py-1 px-2 w-32 border-gray-200 shadow-none" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                        <span className="text-gray-400 text-xs">to</span>
                                        <input type="date" className="input text-xs py-1 px-2 w-32 border-gray-200 shadow-none" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                        {(dateFrom || dateTo) && (
                                          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-gray-500 hover:text-gray-800">Clear</button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                            <th className="px-3 py-2 w-20">Date</th>
                                            <th className="px-3 py-2">Description</th>
                                            <th className="px-3 py-2 text-right">My Share</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {filteredExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-gray-50">
                                              <td className="px-3 py-2 tabular-nums text-xs text-gray-500">{formatDate(exp.expense_date)}</td>
                                              <td className="px-3 py-2">
                                                <div className="font-medium text-gray-800">{exp.description}</div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">Paid by {exp.paid_by_name}</div>
                                              </td>
                                              <td className="px-3 py-2 text-right">
                                                <span className={`font-semibold tabular-nums ${exp.i_paid ? "text-[#5bc5a7]" : "text-[#ff652f]"}`}>
                                                  {exp.i_paid ? "+" : "-"}{formatINR(exp.my_share)}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {filteredExpenses.length === 0 && (
                                        <div className="p-4 text-center text-sm text-gray-500">No expenses found in this date range.</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settlement Suggestions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-bold text-gray-800">Suggested Repayments</h2>
                </div>
                {summary.simplified_transactions.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {summary.simplified_transactions.map((txn, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-800">{txn.from_name}</span>
                          <span className="text-gray-400 text-sm">pays</span>
                          <span className="font-medium text-gray-800">{txn.to_name}</span>
                        </div>
                        <span className="font-bold text-lg tabular-nums text-gray-800">
                          {formatINR(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ArrowRightLeft size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">All settled up! No outstanding balances.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass p-8 text-center text-gray-500">Loading balances...</div>
          )}
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slide-up shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Member</h2>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
            </div>
            {memberError && <div className="mb-4 p-3 rounded bg-red-50 border border-red-100 text-red-600 text-sm">{memberError}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input type="number" className="input" placeholder="e.g. 1" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined On</label>
                <div className="relative">
                  <input type="date" className="input" value={memberDate} onChange={(e) => setMemberDate(e.target.value)} />
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors">Cancel</button>
              <button onClick={handleAddMember} className="btn-primary" disabled={addingMember || !memberUserId}>
                {addingMember ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
