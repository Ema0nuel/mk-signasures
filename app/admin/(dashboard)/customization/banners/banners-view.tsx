"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getHeroBanners,
  deleteHeroBanner,
  activateHeroBanner,
} from "@/app/admin/actions/customization";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Paintbrush,
  Image as ImageIcon,
} from "lucide-react";

interface BannerListItem {
  id: string;
  name: string;
  is_active: boolean;
  transition: string;
  autoplay_ms: number;
  sort_order: number;
  slide_count: number;
  created_at: string;
}

export default function BannersView() {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setLoading(true);
    const { data, error } = await getHeroBanners();
    if (error) {
      toast.error(error);
    } else {
      setBanners(data as BannerListItem[]);
    }
    setLoading(false);
  }

  async function handleActivate(id: string) {
    setActivating(id);
    const { error } = await activateHeroBanner(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Banner activated");
      setBanners((prev) =>
        prev.map((b) => ({ ...b, is_active: b.id === id }))
      );
    }
    setActivating(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    const { error } = await deleteHeroBanner(deleteId);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Banner deleted");
      setBanners((prev) => prev.filter((b) => b.id !== deleteId));
    }
    setDeleteLoading(false);
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light">
          Hero Banners
        </h1>
        <Link
          href="/admin/customization/banners/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Banner
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        Manage hero banners for the homepage. Only one banner can be active at
        a time.
      </p>

      {loading ? (
        <div className="border border-border bg-card p-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : banners.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <Paintbrush className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No banners yet. Create your first hero banner.
          </p>
          <Link
            href="/admin/customization/banners/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Banner
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-card divide-y divide-border">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {banner.name}
                    </p>
                    {banner.is_active && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {banner.slide_count} slide{banner.slide_count !== 1 ? "s" : ""} · {banner.transition} · {banner.autoplay_ms / 1000}s
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!banner.is_active && (
                  <button
                    onClick={() => handleActivate(banner.id)}
                    disabled={activating === banner.id}
                    className="h-8 px-3 text-xs font-medium text-green-700 border border-green-200 hover:bg-green-50 transition-colors"
                  >
                    {activating === banner.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Activate"
                    )}
                  </button>
                )}
                <button
                  onClick={() =>
                    router.push(`/admin/customization/banners/${banner.id}`)
                  }
                  className="h-8 px-3 text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(banner.id)}
                  className="h-8 px-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the banner and all its slides. This
            action cannot be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
