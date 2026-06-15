import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Group, GroupDetail } from "@/lib/types";

export function useGroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.groups.list();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}

export function useGroupDetail(id: number | null) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.groups.detail(id);
      setGroup(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch group details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return { group, loading, error, refetch: fetchGroup };
}
