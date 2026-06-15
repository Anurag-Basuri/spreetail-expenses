"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Home, FileText, Scale, FileUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Extract groupId from pathname if present
  const match = pathname.match(/^\/(?:dashboard|groups)\/(\d+)/);
  const groupId = match ? match[1] : null;

  const NavItem = ({ href, icon: Icon, label }: any) => {
    const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors",
          isActive ? "text-brand-600" : "text-ink-400 hover:text-ink-600"
        )}
      >
        <Icon size={20} className="mb-1" />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden h-14 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
        <span className="font-bold text-ink-900">SplitSmart</span>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -mr-2 text-ink-600 transition-transform active:scale-95">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-surface border-t border-border z-30 flex items-center justify-between px-2 pb-safe">
        <NavItem href="/dashboard" icon={Home} label="Home" />
        {groupId ? (
          <>
            <NavItem href={`/groups/${groupId}`} icon={FileText} label="Expenses" />
            <NavItem href={`/groups/${groupId}/balances`} icon={Scale} label="Balances" />
            <NavItem href={`/groups/${groupId}/import`} icon={FileUp} label="Import" />
          </>
        ) : (
          // If not in a group, show some generic links or disable
          <>
            <div className="flex-1" />
            <div className="flex-1" />
            <div className="flex-1" />
          </>
        )}
      </div>
    </>
  );
}
