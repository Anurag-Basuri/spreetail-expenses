import Link from "next/link";
import { PieChart, ArrowRight, Shield, Zap, RefreshCcw } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 selection:bg-[#5bc5a7]/30">
      {/* ── Navbar ── */}
      <nav className="border-b border-gray-100 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#5bc5a7] text-white flex items-center justify-center">
              <PieChart size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              EquiSplit
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#5bc5a7] hover:text-[#489d85] transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm shadow-none"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900">
            Less stress when <br className="hidden md:block" />
            <span className="text-[#5bc5a7]">sharing expenses</span>
            <span className="text-gray-900"> with anyone.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Keep track of your shared expenses and balances with housemates, trips, groups, friends, and family.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-[#f4f5f6]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#5bc5a7]/10 text-[#5bc5a7] flex items-center justify-center mb-6">
                <RefreshCcw size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Track balances</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep track of shared expenses, balances, and who owes who. Easily settle up when you're ready.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#5bc5a7]/10 text-[#5bc5a7] flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Organize expenses</h3>
              <p className="text-gray-600 leading-relaxed">
                Split expenses with any group: trips, housemates, friends, and family. Everything in one place.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#5bc5a7]/10 text-[#5bc5a7] flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Smart CSV Import</h3>
              <p className="text-gray-600 leading-relaxed">
                Import messy spreadsheets instantly. Our anomaly engine detects errors and duplicates automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 text-center text-gray-500 text-sm border-t border-gray-100 bg-white">
        <p>© 2026 EquiSplit. A Splitwise alternative.</p>
      </footer>
    </div>
  );
}
