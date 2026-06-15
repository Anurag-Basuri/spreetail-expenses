import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatBalance, cn } from "@/lib/utils";

interface MemberBalanceCardProps {
  userId: number;
  userName: string;
  netBalance: number;
  onClick: (userId: number) => void;
}

export function MemberBalanceCard({ userId, userName, netBalance, onClick }: MemberBalanceCardProps) {
  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const isSettled = netBalance === 0;

  const cardClass = cn(
    "cursor-pointer hover:shadow-md transition-all h-full text-center flex flex-col items-center",
    isPositive && "bg-positive-bg border-positive-border hover:border-green-300",
    isNegative && "bg-negative-bg border-negative-border hover:border-red-300",
    isSettled && "bg-surface border-border"
  );

  const textClass = cn(
    "amount text-xl font-bold mt-3 mb-1",
    isPositive && "text-positive-text",
    isNegative && "text-negative-text",
    isSettled && "text-ink-500"
  );

  return (
    <Card 
      className={cardClass}
      onClick={() => onClick(userId)}
    >
      <Avatar name={userName} size="lg" className="mb-2 shadow-sm border-2 border-white" />
      <div className="font-semibold text-ink-900 truncate w-full">{userName}</div>
      <div className={textClass}>
        {formatBalance(netBalance)}
      </div>
      <div className={cn("text-xs font-medium", isPositive ? "text-positive-text/80" : isNegative ? "text-negative-text/80" : "text-ink-400")}>
        {isPositive ? "is owed" : isNegative ? "owes" : "settled"}
      </div>
    </Card>
  );
}
