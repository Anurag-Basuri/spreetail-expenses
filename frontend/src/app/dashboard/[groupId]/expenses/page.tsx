"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatINR } from "@/lib/utils";
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
    <div className="min-h-screen">
      {/* ── Nav ── */}
      <nav className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <Link
          href={`/dashboard/${groupId}`}
          className="text-muted hover:text-foreground transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Expense Ledger</h1>
          <p className="text-xs text-muted">
            {group?.name} — {expenses.length} expense
            {expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {expenses.length === 0 ? (
          <div className="glass p-12 text-center">
            <Receipt size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-1">No expenses yet</h3>
            <p className="text-muted text-sm">
              Import a CSV or add expenses to start tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp, i) => (
              <button
                key={exp.id}
                onClick={() => setSelectedExpense(exp)}
                className="glass-sm p-4 w-full text-left flex items-center justify-between hover:border-primary/50 transition-all animate-fade-in"
                style={{ animationDelay: `${0.03 * i}s`, opacity: 0 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{exp.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {getMemberName(exp.paid_by)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />{" "}
                        {new Date(exp.expense_date).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short" }
                        )}
                      </span>
                      <span className="badge badge-info text-[10px] py-0">
                        {exp.split_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums">
                    {exp.currency === "INR" ? formatINR(exp.amount) : `$${parseFloat(exp.amount).toLocaleString("en-US")}`}
                  </p>
                  {exp.currency !== "INR" && (
                    <p className="text-xs text-muted tabular-nums">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="glass p-6 w-full max-w-lg animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Expense Detail</h2>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-muted hover:text-foreground transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Description</span>
                <span className="font-medium">
                  {selectedExpense.description}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Amount</span>
                <span className="font-bold text-lg tabular-nums">
                  {selectedExpense.currency === "INR" ? formatINR(selectedExpense.amount) : `$${parseFloat(selectedExpense.amount).toLocaleString("en-US")}`}
                </span>
              </div>
              {selectedExpense.currency !== "INR" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">
                      Amount (INR)
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatINR(selectedExpense.amount_inr)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Exchange Rate</span>
                    <span className="font-medium tabular-nums">
                      ₹{selectedExpense.exchange_rate} / $1
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Paid by</span>
                <span className="font-medium">
                  {getMemberName(selectedExpense.paid_by)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Date</span>
                <span className="font-medium">
                  {new Date(
                    selectedExpense.expense_date
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Split Type</span>
                <span className="badge badge-info">
                  {selectedExpense.split_type}
                </span>
              </div>

              {/* Splits breakdown */}
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-semibold text-sm mb-3">Split Breakdown</h3>
                <div className="space-y-2">
                  {selectedExpense.splits?.map((split) => (
                    <div
                      key={split.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{getMemberName(split.user_id)}</span>
                      <span className="font-medium tabular-nums">
                        {formatINR(split.amount_owed)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExpense.import_note && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted">
                    Import Note: {selectedExpense.import_note}
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
