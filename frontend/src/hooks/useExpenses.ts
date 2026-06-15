import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Expense, ExpenseCreate } from "@/lib/types";

export function useExpenses(groupId: number | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchExpenses = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const data = await api.expenses.list(groupId);
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (data: ExpenseCreate) => {
    try {
      await api.expenses.create(data);
      await fetchExpenses();
    } catch (err: any) {
      throw new Error(err.message || "Failed to create expense");
    }
  };

  return { expenses, loading, error, refetch: fetchExpenses, addExpense };
}
