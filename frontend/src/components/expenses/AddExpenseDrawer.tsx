"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Member, ExpenseCreate } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Check } from "lucide-react";
import { SplitTypeFields } from "./SplitTypeFields";

interface AddExpenseDrawerProps {
  groupId: number;
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}

type SplitType = "equal" | "unequal" | "percentage" | "shares";

export function AddExpenseDrawer({ groupId, members, onClose, onSuccess }: AddExpenseDrawerProps) {
  const { user } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState<number>(user?.id || members[0]?.user_id);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  
  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(members.map(m => m.user_id))
  );
  
  // Dynamic Split State (keyed by user_id)
  const [splitDetails, setSplitDetails] = useState<Record<number, number>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = parseFloat(amountStr.replace(/,/g, "")) || 0;

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    // Focus drawer on mount
    drawerRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const toggleMember = (id: number) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUserIds(newSet);
  };

  // Preview Calculation
  const preview = useMemo(() => {
    const result: Record<number, number> = {};
    if (amount <= 0 || selectedUserIds.size === 0) return result;

    const selectedArray = Array.from(selectedUserIds);

    if (splitType === "equal") {
      const splitAmount = amount / selectedArray.length;
      selectedArray.forEach(id => result[id] = splitAmount);
    } 
    else if (splitType === "unequal") {
      selectedArray.forEach(id => result[id] = splitDetails[id] || 0);
    }
    else if (splitType === "percentage") {
      selectedArray.forEach(id => {
        const pct = splitDetails[id] || 0;
        result[id] = amount * (pct / 100);
      });
    }
    else if (splitType === "shares") {
      const totalShares = selectedArray.reduce((sum, id) => sum + (splitDetails[id] || 0), 0);
      if (totalShares > 0) {
        selectedArray.forEach(id => {
          const share = splitDetails[id] || 0;
          result[id] = amount * (share / totalShares);
        });
      }
    }
    return result;
  }, [amount, splitType, selectedUserIds, splitDetails]);

  // Validation
  const validation = useMemo(() => {
    if (amount <= 0) return { valid: false, message: "Enter a valid amount." };
    if (!paidBy) return { valid: false, message: "Select who paid." };
    if (selectedUserIds.size < 1) return { valid: false, message: "Select at least 1 person to split with." };

    if (splitType === "unequal") {
      const sum = Object.values(preview).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - amount) > 1) { // 1 rupee tolerance
        return { valid: false, message: `Sum of splits (${formatINR(sum)}) must equal total (${formatINR(amount)})` };
      }
    }
    if (splitType === "percentage") {
      const sumPct = Array.from(selectedUserIds).reduce((a, id) => a + (splitDetails[id] || 0), 0);
      if (Math.abs(sumPct - 100) > 0.01) {
        return { valid: false, message: `Percentages must add up to 100% (currently ${sumPct}%)` };
      }
    }
    if (splitType === "shares") {
      const totalShares = Array.from(selectedUserIds).reduce((sum, id) => sum + (splitDetails[id] || 0), 0);
      if (totalShares <= 0) return { valid: false, message: "Total shares must be greater than 0." };
    }

    return { valid: true, message: "Looks good! ✓" };
  }, [amount, paidBy, selectedUserIds, splitType, preview, splitDetails]);

  const handleSubmit = async () => {
    if (!validation.valid) return;
    
    setLoading(true);
    setError("");

    try {
      const data: ExpenseCreate = {
        group_id: groupId,
        description,
        amount,
        expense_date: new Date(date).toISOString(),
        paid_by: paidBy,
        split_type: splitType,
        splits: Array.from(selectedUserIds).map(id => ({
          user_id: id,
          split_value: splitType === "equal" ? (1 / selectedUserIds.size) * 100 : splitDetails[id] || 0
        }))
      };
      
      await api.expenses.create(data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        tabIndex={-1}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 outline-none"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-ink-900">Add Expense</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-ink-600 hover:bg-canvas rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="p-3 bg-negative-bg text-negative-text text-sm rounded-xl border border-negative-border">{error}</div>}
          
          <Input 
            label="Description" 
            placeholder="e.g. Dinner at Marina Bites" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-[1fr_auto] gap-4">
            <Input 
              label="Amount" 
              placeholder="0.00" 
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setAmountStr(val);
              }}
            />
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Currency</label>
              <div className="flex bg-canvas border border-border rounded-xl p-1 h-[42px]">
                <button 
                  className={cn("px-3 text-sm font-medium rounded-lg transition-colors", currency === "INR" ? "bg-surface shadow-sm text-ink-900" : "text-ink-500")}
                  onClick={() => setCurrency("INR")}
                >
                  ₹ INR
                </button>
                <button 
                  className={cn("px-3 text-sm font-medium rounded-lg transition-colors", currency === "USD" ? "bg-surface shadow-sm text-ink-900" : "text-ink-500")}
                  onClick={() => setCurrency("USD")}
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>
          {currency === "USD" && amount > 0 && (
            <p className="text-xs text-ink-600 -mt-4">≈ {formatINR(amount * 84)} at current est. rate (₹84/$)</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date" 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Paid by</label>
              <select 
                value={paidBy} 
                onChange={(e) => setPaidBy(parseInt(e.target.value, 10))}
                className="w-full bg-canvas border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-900 mb-2">Split type</label>
            <div className="flex bg-canvas border border-border rounded-xl p-1">
              {(["equal", "unequal", "percentage", "shares"] as SplitType[]).map(type => (
                <button 
                  key={type}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize", 
                    splitType === type ? "bg-surface shadow-sm text-ink-900" : "text-ink-500 hover:text-ink-900"
                  )}
                  onClick={() => setSplitType(type)}
                >
                  {type === "percentage" ? "%" : type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-900 mb-2">Split with</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const isSelected = selectedUserIds.has(m.user_id);
                return (
                  <button
                    key={m.user_id}
                    onClick={() => toggleMember(m.user_id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                      isSelected 
                        ? "bg-brand-50 border-brand-200 text-brand-700" 
                        : "bg-surface border-border text-ink-500 hover:bg-canvas"
                    )}
                  >
                    {isSelected && <Check size={14} />}
                    {m.user_name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Split Inputs */}
          <SplitTypeFields 
            splitType={splitType}
            members={members}
            selectedUserIds={selectedUserIds}
            splitDetails={splitDetails}
            onSplitChange={(userId, value) => setSplitDetails(prev => ({...prev, [userId]: value}))}
          />

          {/* Live Preview */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider">Split Preview</h4>
              <span className={cn("text-xs font-medium", validation.valid ? "text-positive-text" : "text-negative-text")}>
                {validation.message}
              </span>
            </div>
            <div className="space-y-2">
              {members.filter(m => selectedUserIds.has(m.user_id)).map(m => (
                <div key={m.user_id} className="flex justify-between text-sm">
                  <span className="text-ink-600">{m.user_name}</span>
                  <span className="amount font-medium text-ink-900">{formatINR(preview[m.user_id] || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-surface">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            loading={loading} 
            disabled={!validation.valid || !description}
          >
            Add Expense →
          </Button>
        </div>
      </div>
    </>
  );
}
