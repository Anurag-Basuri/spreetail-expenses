"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  FileSpreadsheet,
  TrendingUp,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Zap size={24} />,
      title: "Graph-Based Debt Simplification",
      desc: "Condenses complex webs of debts into the minimum number of transactions needed to settle all balances.",
    },
    {
      icon: <FileSpreadsheet size={24} />,
      title: "Smart CSV Importer",
      desc: "Upload messy spreadsheets. Our anomaly engine detects duplicates, typos, and errors — then lets you fix them interactively.",
    },
    {
      icon: <Users size={24} />,
      title: "Dynamic Memberships",
      desc: "People move in and out. EquiSplit only charges members for expenses during their active tenure.",
    },
    {
      icon: <Globe size={24} />,
      title: "Multi-Currency Support",
      desc: "Record expenses in any currency. We freeze exchange rates at transaction time for accurate settlements.",
    },
    {
      icon: <Shield size={24} />,
      title: "Full Audit Trail",
      desc: "Every split, every settlement, every change is tracked. Click any balance to see exactly where it comes from.",
    },
    {
      icon: <TrendingUp size={24} />,
      title: "Granular Splitting",
      desc: "Equal, exact amounts, percentages, or fractional shares — handle any splitting scenario with precision.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-lg font-bold tracking-tight">EquiSplit</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="animate-fade-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          <span className="badge badge-info mb-6 inline-block">
            Built for messy real-world data
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl animate-fade-in"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          Split expenses.
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Not friendships.
          </span>
        </h1>

        <p
          className="mt-6 text-lg text-muted max-w-2xl animate-fade-in"
          style={{ animationDelay: "0.3s", opacity: 0 }}
        >
          EquiSplit handles the chaos of shared living — dynamic memberships,
          multi-currency trips, and messy legacy spreadsheets — so you can
          settle up with a single click.
        </p>

        <div
          className="mt-10 flex items-center gap-4 animate-fade-in"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          <Link
            href={user ? "/dashboard" : "/register"}
            className="btn-primary text-base px-8 py-3"
          >
            Start Splitting <ArrowRight size={18} />
          </Link>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to manage shared expenses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass p-6 hover:border-primary/50 transition-colors duration-300 animate-slide-up"
              style={{
                animationDelay: `${0.1 * i}s`,
                opacity: 0,
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted">
        Built with FastAPI, Next.js & PostgreSQL — EquiSplit © 2026
      </footer>
    </div>
  );
}
