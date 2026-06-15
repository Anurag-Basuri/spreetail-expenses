import { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SplitTypeFieldsProps {
  splitType: "equal" | "unequal" | "percentage" | "shares";
  members: Member[];
  selectedUserIds: Set<number>;
  splitDetails: Record<number, number>;
  onSplitChange: (userId: number, value: number) => void;
}

export function SplitTypeFields({ 
  splitType, 
  members, 
  selectedUserIds, 
  splitDetails, 
  onSplitChange 
}: SplitTypeFieldsProps) {
  if (splitType === "equal" || selectedUserIds.size === 0) return null;

  return (
    <div className="p-4 bg-canvas rounded-xl border border-border space-y-3">
      <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">
        Enter {splitType}
      </h4>
      {members.filter(m => selectedUserIds.has(m.user_id)).map(m => (
        <div key={m.user_id} className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-ink-900">{m.user_name}</span>
          <div className="relative w-32">
            {splitType === "unequal" && <span className="absolute left-3 top-2 text-ink-400 text-sm">₹</span>}
            <input 
              type="number" 
              min="0"
              step={splitType === "shares" ? "1" : "0.01"}
              className={cn(
                "w-full bg-surface border border-border rounded-lg py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-500",
                splitType === "unequal" ? "pl-8 pr-3" : "px-3"
              )}
              value={splitDetails[m.user_id] || ""}
              onChange={(e) => onSplitChange(m.user_id, parseFloat(e.target.value) || 0)}
            />
            {splitType === "percentage" && <span className="absolute right-8 top-2 text-ink-400 text-sm">%</span>}
            {splitType === "shares" && <span className="absolute right-3 top-2 text-ink-400 text-sm opacity-0 hover:opacity-100">sh</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
