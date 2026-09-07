"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHeroBanner } from "@/app/admin/actions/customization";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewBannerView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Banner name is required");
      return;
    }

    setSaving(true);
    const { data, error } = await createHeroBanner({ name: name.trim() });

    if (error) {
      toast.error(error);
      setSaving(false);
      return;
    }

    toast.success("Banner created");
    router.push(`/admin/customization/banners/${data.id}`);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/customization/banners"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Banners
        </Link>
        <Button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="bg-primary text-primary-foreground"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Banner
        </Button>
      </div>

      <h1 className="font-heading text-2xl font-light">New Banner</h1>

      <div className="border border-border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Banner Name *</label>
          <Input
            placeholder="e.g. Summer Sale 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Internal name for this banner configuration. Not shown to customers.
          </p>
        </div>
      </div>
    </div>
  );
}
