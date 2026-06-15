import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { BalanceSummary, MemberBalance } from "@/lib/types";

export function useBalanceSummary(groupId: number | null) {
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const data = await api.balances.summary(groupId);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch balance summary");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

export function useMemberBalance(groupId: number, userId: number | null) {
  const [memberBalance, setMemberBalance] = useState<MemberBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMemberBalance = useCallback(async () => {
    if (!groupId || !userId) return;
    try {
      setLoading(true);
      const data = await api.balances.member(groupId, userId);
      setMemberBalance(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch member balance");
    } finally {
      setLoading(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    fetchMemberBalance();
  }, [fetchMemberBalance]);

  return { memberBalance, loading, error, refetch: fetchMemberBalance };
}
