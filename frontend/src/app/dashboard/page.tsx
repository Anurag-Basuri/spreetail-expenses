"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  Plus,
  Users,
  LogOut,
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";

interface Group {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      api
        .get("/groups")
        .then((res) => setGroups(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/groups", { name: newGroupName.trim() });
      setGroups((prev) => [...prev, res.data]);
      setNewGroupName("");
      setShowCreate(false);
    } catch {
      // Error handled silently for now
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-lg font-bold tracking-tight">EquiSplit</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            Hi, <span className="text-foreground font-medium">{user.name}</span>
          </span>
          <button onClick={logout} className="btn-secondary text-sm px-3 py-2">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Groups</h1>
            <p className="text-muted text-sm mt-1">
              Select a group to view balances and expenses
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            <Plus size={18} /> New Group
          </button>
        </div>

        {/* ── Create Group Modal ── */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="glass p-6 w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Create New Group</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-muted hover:text-foreground transition"
                >
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                className="input mb-4"
                placeholder="e.g., Goa Trip 2026"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                autoFocus
              />
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="btn-primary"
                  disabled={creating || !newGroupName.trim()}
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Group List ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="glass p-12 text-center">
            <Users size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-1">No groups yet</h3>
            <p className="text-muted text-sm">
              Create your first group to start tracking shared expenses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, i) => (
              <Link
                key={group.id}
                href={`/dashboard/${group.id}`}
                className="glass-sm p-5 flex items-center justify-between hover:border-primary/50 transition-all duration-200 group block animate-fade-in"
                style={{ animationDelay: `${0.05 * i}s`, opacity: 0 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted">
                      Created{" "}
                      {new Date(group.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-muted group-hover:text-primary transition-colors"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
