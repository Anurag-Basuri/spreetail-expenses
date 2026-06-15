"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatINR } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import {
  ArrowLeft,
  Loader2,
  Receipt,
  Calendar,
  User,
  X,
} from "lucide-react";

interface Expense {
  id: number;
  group_id: number;
  description: string;
  amount: string;
  currency: string;
  amount_inr: string;
  exchange_rate: string;
  paid_by: number;
  split_type: string;
  expense_date: string;
  is_settlement: boolean;
  import_row: number | null;
  import_note: string | null;
  splits: {
    id: number;
    expense_id: number;
    user_id: number;
    amount_owed: string;
    share_value: string | null;
    settled: boolean;
  }[];
}

interface GroupDetail {
  id: number;
  name: string;
  members: { user_id: number; user_name: string }[];
}

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params.groupId as string;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && groupId) {
      Promise.all([
        api.get(`/expenses/${groupId}`),
        api.get(`/groups/${groupId}`),
      ])
        .then(([expRes, grpRes]) => {
          setExpenses(expRes.data);
          setGroup(grpRes.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, groupId]);

  const getMemberName = (userId: number) => {
    if (!group) return `User ${userId}`;
    const member = group.members.find((m) => m.user_id === userId);
    return member?.user_name || `User ${userId}`;
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6]">
      <TopNav />

      {/* ── Sub Navigation ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/dashboard/${groupId}`} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Expense Ledger</h1>
            <p className="text-sm text-gray-500">
              {group?.name} — {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {expenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No expenses yet</h3>
            <p className="text-gray-500 text-sm">
              Import a CSV or add expenses to start tracking.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {expenses.map((exp, i) => (
              <button
                key={exp.id}
                onClick={() => setSelectedExpense(exp)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-gray-100 text-gray-500 flex items-center justify-center border border-gray-200">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-base">{exp.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {getMemberName(exp.paid_by)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />{" "}
                        {new Date(exp.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="badge badge-info py-0">
                        {exp.split_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-lg text-gray-800">
                    {exp.currency === "INR" ? formatINR(exp.amount) : `$${parseFloat(exp.amount).toLocaleString("en-US")}`}
                  </p>
                  {exp.currency !== "INR" && (
                    <p className="text-xs text-gray-500 font-medium tabular-nums">
                      {formatINR(exp.amount_inr)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Expense Detail Modal ── */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-bold text-gray-800">Expense Detail</h2>
              <button onClick={() => setSelectedExpense(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Description</span>
                <span className="font-bold text-gray-800">{selectedExpense.description}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Amount</span>
                <span className="font-bold text-xl tabular-nums text-gray-900">
                  {selectedExpense.currency === "INR" ? formatINR(selectedExpense.amount) : `$${parseFloat(selectedExpense.amount).toLocaleString("en-US")}`}
                </span>
              </div>
              {selectedExpense.currency !== "INR" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Amount (INR)</span>
                    <span className="font-medium tabular-nums text-gray-700">{formatINR(selectedExpense.amount_inr)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Exchange Rate</span>
                    <span className="font-medium tabular-nums text-gray-700">₹{selectedExpense.exchange_rate} / $1</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Paid by</span>
                <span className="font-medium text-gray-800">{getMemberName(selectedExpense.paid_by)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Date</span>
                <span className="font-medium text-gray-800">
                  {new Date(selectedExpense.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Split Type</span>
                <span className="badge badge-info">{selectedExpense.split_type}</span>
              </div>

              {/* Splits breakdown */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider">Split Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                  {selectedExpense.splits?.map((split) => (
                    <div key={split.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{getMemberName(split.user_id)}</span>
                      <span className="font-bold tabular-nums text-gray-800">{formatINR(split.amount_owed)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExpense.import_note && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 p-2 rounded">
                    <span className="font-bold text-yellow-700">Import Note:</span> {selectedExpense.import_note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
