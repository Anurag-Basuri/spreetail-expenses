import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PieChart, LogOut } from "lucide-react";

export default function TopNav() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-[#5bc5a7] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded bg-white text-[#5bc5a7] flex items-center justify-center">
            <PieChart size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">EquiSplit</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#489d85] flex items-center justify-center border-2 border-[#fff] shadow-sm">
              <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium hidden sm:block">{user.name}</span>
          </div>
          <button onClick={logout} className="text-white/90 hover:text-white hover:bg-[#489d85] p-2 rounded-full transition-colors flex items-center justify-center" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
