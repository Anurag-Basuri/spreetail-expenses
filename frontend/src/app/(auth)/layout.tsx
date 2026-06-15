import { redirect } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Common split screen layout for auth
  return (
    <div className="min-h-screen flex">
      {/* Left side (brand) */}
      <div className="hidden lg:flex flex-col flex-1 bg-brand-600 text-white p-12 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center font-bold text-xl">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight">SplitSmart</span>
        </div>
        
        <div className="max-w-md">
          <h1 className="text-5xl font-extrabold tracking-tight mb-8 leading-tight">
            Split fairly.<br/>Settle simply.
          </h1>
          <ul className="space-y-4 text-brand-100 text-lg">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-100 rounded-full"></span> 6 people
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-100 rounded-full"></span> 43 expenses
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-100 rounded-full"></span> ₹0 in dispute
            </li>
          </ul>
        </div>
        
        <div className="max-w-md p-6 bg-brand-700/50 rounded-2xl border border-brand-500/50">
          <p className="text-brand-50 text-lg italic mb-4">
            "Finally we sorted March electricity without starting a war in the WhatsApp group."
          </p>
          <div className="font-medium">— Rohan</div>
        </div>
      </div>

      {/* Right side (form) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-canvas">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
