"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import TopNav from "@/components/TopNav";
import {
  Plus,
  Users,
  Loader2,
  ChevronRight,
  X,
  Wallet,
  Activity,
  User,
  Settings
} from "lucide-react";

interface Group {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
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
        <Loader2 size={32} className="animate-spin text-[#5bc5a7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6]">
      <TopNav />

      {/* ── Main Content Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* User Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#5bc5a7] h-12 w-full"></div>
            <div className="px-6 pb-6 pt-0 text-center relative">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-sm -mt-8 relative z-10">
                <div className="w-full h-full rounded-full bg-[#489d85] flex items-center justify-center text-white">
                  <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <h2 className="font-bold text-lg text-gray-800 leading-tight">{user.name}</h2>
              <p className="text-xs text-gray-500 font-medium mb-4">{user.email}</p>
            </div>
          </div>

          {/* Sidebar Menu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <nav className="flex flex-col space-y-1">
              <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</div>
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#5bc5a7]/10 text-[#489d85] font-semibold transition-colors">
                <Wallet size={18} />
                Dashboard
              </Link>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors text-left w-full cursor-not-allowed opacity-60">
                <Activity size={18} />
                Recent activity
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors text-left w-full cursor-not-allowed opacity-60">
                <User size={18} />
                Friends
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors text-left w-full cursor-not-allowed opacity-60">
                <Settings size={18} />
                Account settings
              </button>
            </nav>
          </div>

        </div>

        {/* Right Content / Dashboard */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Dashboard Header Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5bc5a7]/10 rounded-lg text-[#5bc5a7]">
                <Wallet size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500 font-medium">Overview of your shared expenses and groups.</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary shadow-lg bg-[#ff652f] hover:bg-[#e55a2a] whitespace-nowrap px-6">
              <Plus size={18} /> Start a new group
            </button>
          </div>

          {/* Group List Area */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Your Groups</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Users size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No groups yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto font-medium">
                  EquiSplit helps you keep track of shared expenses with your friends, roommates, and family. Create a group to get started.
                </p>
                <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
                  <Plus size={18} /> Start a new group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group, i) => (
                  <Link
                    key={group.id}
                    href={`/dashboard/${group.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-[#5bc5a7] hover:shadow-md transition-all group animate-fade-in"
                    style={{ animationDelay: `${0.03 * i}s`, opacity: 0 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg border border-gray-100 flex items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-[#5bc5a7]/10 group-hover:text-[#5bc5a7] transition-colors">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#5bc5a7] transition-colors">{group.name}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          Created {new Date(group.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#5bc5a7] transition-colors">
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-white transition-colors" />
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up shadow-xl">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-bold text-gray-800">Start a new group</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex gap-4 items-center mb-6">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400">
                <Users size={24} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">Group name</label>
                <input
                  type="text"
                  className="w-full text-lg border-b-2 border-gray-200 focus:border-[#5bc5a7] px-0 py-1 outline-none transition-colors text-gray-800 font-medium placeholder:text-gray-300"
                  placeholder="e.g. Apartment, Goa Trip"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-2">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateGroup} className="btn-primary shadow-md px-6 py-2.5" disabled={creating || !newGroupName.trim()}>
                {creating ? <Loader2 size={18} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
