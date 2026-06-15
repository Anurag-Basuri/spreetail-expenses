"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, Home, FileText, Scale, Users, FileUp, ArrowRightLeft, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Extract groupId from pathname if present: /dashboard/123/... or /groups/123/...
  const match = pathname.match(/^\/(?:dashboard|groups)\/(\d+)/);
  const groupId = match ? match[1] : null;

  const NavItem = ({ href, icon: Icon, label, isActive }: any) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors duration-150",
        isActive 
          ? "bg-brand-50 text-brand-600 font-medium" 
          : "text-ink-600 hover:bg-canvas"
      )}
    >
      <Icon size={18} className={isActive ? "text-brand-500" : "text-ink-400"} />
      {label}
    </Link>
  );

  return (
    <div className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 bg-surface border-r border-border z-20">
      
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
            <PieChart size={18} />
          </div>
          <span className="text-lg font-bold text-ink-900 tracking-tight">SplitSmart</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        
        {/* Main Nav */}
        <div>
          <NavItem 
            href="/dashboard" 
            icon={Home} 
            label="Dashboard" 
            isActive={pathname === "/dashboard"} 
          />
        </div>

        {/* Groups */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-ink-400 uppercase tracking-wider">
            My Groups
          </div>
          <div className="space-y-1">
            {/* Hardcoded groups as per Prompt D */}
            <NavItem 
              href="/groups/1" 
              icon={Home} 
              label="The Flat" 
              isActive={pathname.startsWith("/groups/1")} 
            />
            <NavItem 
              href="/groups/2" 
              icon={Home} 
              label="Goa Trip" 
              isActive={pathname.startsWith("/groups/2")} 
            />
          </div>
        </div>

        {/* Contextual Nav (if in a group) */}
        {groupId && (
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-ink-400 uppercase tracking-wider">
              In this group
            </div>
            <div className="space-y-1">
              <NavItem href={`/groups/${groupId}`} icon={FileText} label="Expenses" isActive={pathname === `/groups/${groupId}`} />
              <NavItem href={`/groups/${groupId}/balances`} icon={Scale} label="Balances" isActive={pathname.includes("/balances")} />
              <NavItem href={`/groups/${groupId}/members`} icon={Users} label="Members" isActive={pathname.includes("/members")} />
              <NavItem href={`/groups/${groupId}/import`} icon={FileUp} label="Import CSV" isActive={pathname.includes("/import")} />
              <NavItem href={`/groups/${groupId}/settlements`} icon={ArrowRightLeft} label="Settlements" isActive={pathname.includes("/settlements")} />
            </div>
          </div>
        )}
      </div>

      {/* User & Logout */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="sm" />
              <div className="text-sm font-medium text-ink-900 truncate max-w-[100px]">
                {user.name.split(' ')[0]}
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-ink-400 hover:text-negative-text hover:bg-negative-bg rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
