"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  ArrowLeft,
  ArrowRightLeft,
  Loader2,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface GroupDetail {
  id: number;
  name: string;
  members: { user_id: number; user_name: string; left_at: string | null }[];
}

interface Settlement {
  id: number;
  paid_by_name: string;
  paid_to_name: string;
  amount: string;
  currency: string;
  settled_at: string;
  note: string | null;
}

export default function SettlePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [paidTo, setPaidTo] = useState("");
  const [amount, setAmount] = useState("");
  const [settledAt, setSettledAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && groupId) {
      Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/settlements`),
      ])
        .then(([grpRes, setRes]) => {
          setGroup(grpRes.data);
          setSettlements(setRes.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, groupId]);

  const handleSubmit = async () => {
    if (!paidTo || !amount) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      await api.post("/settlements", {
        group_id: parseInt(groupId),
        paid_to: parseInt(paidTo),
        amount: parseFloat(amount),
        currency: "INR",
        settled_at: settledAt,
        note: note || null,
      });
      setSuccess(true);
      setAmount("");
      setNote("");
      setPaidTo("");
      // Refresh settlements
      const res = await api.get(`/groups/${groupId}/settlements`);
      setSettlements(res.data);
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const activeMembers =
    group?.members.filter(
      (m) => !m.left_at && m.user_id !== user.id
    ) || [];

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <Link
          href={`/dashboard/${groupId}`}
          className="text-muted hover:text-foreground transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Settle Up</h1>
          <p className="text-xs text-muted">{group?.name} — Record a payment</p>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* ── Settlement Form ── */}
        <div className="glass p-6 mb-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-4">Record a Payment</h2>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Settlement recorded successfully!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Paid to
              </label>
              <select
                className="input"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
              >
                <option value="">Select a member…</option>
                {activeMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="input"
                  value={settledAt}
                  onChange={(e) => setSettledAt(e.target.value)}
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Note (optional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. UPI transfer"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="btn-primary w-full"
              disabled={submitting || !paidTo || !amount}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRightLeft size={16} />
              )}
              {submitting ? "Recording…" : "Record Settlement"}
            </button>
          </div>
        </div>

        {/* ── Settlement History ── */}
        <div>
          <h2 className="text-lg font-bold mb-4">Settlement History</h2>
          {settlements.length === 0 ? (
            <div className="glass-sm p-8 text-center">
              <ArrowRightLeft size={36} className="mx-auto text-muted mb-3" />
              <p className="text-muted text-sm">No settlements recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s, i) => (
                <div
                  key={s.id}
                  className="glass-sm p-4 flex items-center justify-between animate-fade-in"
                  style={{ animationDelay: `${0.03 * i}s`, opacity: 0 }}
                >
                  <div>
                    <p className="font-medium text-sm">
                      {s.paid_by_name}{" "}
                      <span className="text-muted">paid</span>{" "}
                      {s.paid_to_name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(s.settled_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {s.note && ` · ${s.note}`}
                    </p>
                  </div>
                  <span className="font-bold text-success tabular-nums">
                    ₹{parseFloat(s.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
