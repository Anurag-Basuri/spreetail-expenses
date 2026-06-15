import { Expense } from "@/lib/types";
import { formatBalance, formatDate } from "@/lib/utils";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas/50 transition-colors border-l-4 border-l-brand-500">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-medium text-ink-900 text-base">{expense.description}</span>
          <span className="text-xs text-ink-400 bg-canvas px-2 py-0.5 rounded">{formatDate(expense.expense_date)}</span>
        </div>
        <div className="text-sm text-ink-600">
          Paid by <span className="font-medium">{expense.paid_by_name}</span>{" "}
          <span className="amount ml-1 font-semibold text-ink-900">{formatBalance(expense.amount)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-xs text-ink-400 mb-1">Your share</div>
        <div className="amount text-sm font-semibold text-negative-text">
          {formatBalance(-expense.my_share)}
        </div>
      </div>
    </div>
  );
}
