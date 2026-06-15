import { redirect } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Common split screen layout for auth
  return (
    <div className="min-h-screen flex">
      {/* Left side (brand & visual) */}
      <div 
        className="hidden lg:flex flex-col flex-1 text-white p-12 justify-between relative bg-brand-900"
        style={{
          backgroundImage: 'url(/auth-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay to ensure text legibility */}
        <div className="absolute inset-0 bg-ink-900/60 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-ink-900/80 pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight drop-shadow-md text-white">SplitSmart</span>
        </div>
        
        <div className="max-w-md relative z-10 mt-20">
          <h1 className="text-5xl font-extrabold tracking-tight mb-8 leading-tight text-white drop-shadow-xl">
            Split fairly.<br/>Settle simply.
          </h1>
          <ul className="space-y-4 text-white/90 text-lg font-medium drop-shadow-md">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> 6 people
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> 43 expenses
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-brand-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> ₹0 in dispute
            </li>
          </ul>
        </div>
        
        {/* Glassmorphism Testimonial */}
        <div className="max-w-md p-6 bg-ink-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl relative z-10 mt-20">
          <p className="text-white/95 text-lg italic mb-4 leading-relaxed font-medium">
            "Finally we sorted March electricity without starting a war in the WhatsApp group."
          </p>
          <div className="font-semibold text-brand-300">— Rohan</div>
        </div>
      </div>

      {/* Right side (form) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-canvas animate-fade-in">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
