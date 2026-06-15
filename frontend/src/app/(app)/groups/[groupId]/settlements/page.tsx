"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { History, ArrowRight } from "lucide-react";

export default function SettlementsPage() {
  const { groupId } = useParams();
  
  // In a real app, we would fetch settlement history here
  // const { settlements, loading } = useSettlements(groupId);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settlement History" 
        subtitle="A record of all payments made to settle balances."
        actions={
          <Button>Record Payment</Button>
        }
      />

      <Card className="text-center py-16">
        <div className="w-16 h-16 bg-canvas text-ink-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
          <History size={32} />
        </div>
        <h3 className="text-lg font-bold text-ink-900 mb-2">No settlements yet</h3>
        <p className="text-ink-500 mb-6 max-w-sm mx-auto">
          When someone pays you back, record it as a settlement to zero out their balance.
        </p>
      </Card>

      {/* Mock data layout for future implementation */}
      {/* 
      <Card padding="none">
        <div className="divide-y divide-border">
          <div className="p-5 flex items-center justify-between hover:bg-canvas/50">
            <div className="flex items-center gap-3">
              <span className="font-medium">Rohan</span>
              <ArrowRight size={16} className="text-ink-400" />
              <span className="font-medium">Aisha</span>
            </div>
            <div className="text-right">
              <div className="amount font-bold text-positive-text">₹2,450.00</div>
              <div className="text-xs text-ink-400">Mar 15, 2026</div>
            </div>
          </div>
        </div>
      </Card> 
      */}
    </div>
  );
}
