import { Expense } from "@/lib/types";
import { ExpenseCard } from "./ExpenseCard";

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) return null;

  return (
    <div className="divide-y divide-border">
      {expenses.map((exp) => (
        <ExpenseCard key={exp.id} expense={exp} />
      ))}
    </div>
  );
}
