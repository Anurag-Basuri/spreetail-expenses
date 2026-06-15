import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { redirect } from "next/navigation";

// For now, assume this is a client-side auth protected layout.
// Or we can just build the shell and let pages handle redirect if no user.

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-canvas">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Topbar */}
      <div className="flex-1 md:ml-60 flex flex-col pb-16 md:pb-0">
        <Topbar />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 lg:p-12 animate-fade-in">
          {children}
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}
