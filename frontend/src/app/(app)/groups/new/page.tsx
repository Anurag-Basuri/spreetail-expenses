"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Users } from "lucide-react";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const group = await api.groups.create({ name, description });
      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create group");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader 
        title="Create a New Group" 
        subtitle="Set up a new space to share expenses."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}
          
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <Users size={40} />
            </div>
          </div>

          <Input
            label="Group Name"
            placeholder="e.g. Goa Trip 2026, 4BHK Flatmates"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink-900">
              Description <span className="text-ink-400 font-normal">(Optional)</span>
            </label>
            <textarea
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow min-h-[100px] resize-y"
              placeholder="What is this group for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-border">
            <Button variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
