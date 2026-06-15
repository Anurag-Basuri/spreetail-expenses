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
  CreditCard,
  PieChart
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
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f6]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6]">
      {/* ── Top Navigation Bar ── */}
      <nav className="bg-[#5bc5a7] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white text-[#5bc5a7] flex items-center justify-center">
              <PieChart size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">EquiSplit</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#489d85] flex items-center justify-center border-2 border-[#fff]">
                <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block">{user.name}</span>
            </div>
            <button onClick={logout} className="text-white/80 hover:text-white transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar (Desktop) or Top Banner (Mobile) */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 border-2 border-gray-200">
              <span className="text-2xl font-bold text-gray-400">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-center font-bold text-lg text-gray-800">{user.name}</h2>
            <p className="text-center text-sm text-gray-500 mb-6">{user.email}</p>
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
              <button onClick={() => setShowCreate(true)} className="btn-primary w-full shadow-none text-sm py-2.5">
                <Plus size={16} /> Start a new group
              </button>
            </div>
          </div>
        </div>

        {/* Right Content / Dashboard */}
        <div className="col-span-1 md:col-span-2">
          
          {/* Dashboard Header */}
          <div className="bg-white rounded-t-lg border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          </div>

          {/* Group List */}
          <div className="bg-white rounded-b-lg shadow-sm min-h-[400px]">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 w-full rounded" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="p-16 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No groups yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  EquiSplit helps you keep track of shared expenses with your friends, roommates, and family.
                </p>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  <Plus size={16} /> Start a new group
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {groups.map((group, i) => (
                  <Link
                    key={group.id}
                    href={`/dashboard/${group.id}`}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors animate-fade-in group block"
                    style={{ animationDelay: `${0.03 * i}s`, opacity: 0 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-400">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{group.name}</h3>
                        <p className="text-xs text-gray-500">
                          Created {new Date(group.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-400 group-hover:text-[#5bc5a7] transition-colors">View</span>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-[#5bc5a7] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Create Group Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slide-up shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Start a new group</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex gap-4 items-center mb-6">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 text-gray-400">
                <Users size={24} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
                <input
                  type="text"
                  className="w-full text-lg border-b-2 border-gray-200 focus:border-[#5bc5a7] px-0 py-1 outline-none transition-colors"
                  placeholder="e.g. Apartment, Goa Trip"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="btn-primary"
                disabled={creating || !newGroupName.trim()}
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
