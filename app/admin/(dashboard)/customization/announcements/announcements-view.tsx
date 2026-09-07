"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSiteAnnouncements,
  createSiteAnnouncement,
  updateSiteAnnouncement,
  deleteSiteAnnouncement,
  activateSiteAnnouncement,
  uploadSiteMedia,
  deleteSiteMedia,
} from "@/app/admin/actions/customization";
import { compressImage } from "@/lib/image-compress";
import { Input } from "@/components/ui/input";
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
  Loader2,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  Megaphone,
} from "lucide-react";
import type { SiteAnnouncement } from "@/types/database";

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [bgColor, setBgColor] = useState("#1a1a1a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    const { data, error } = await getSiteAnnouncements();
    if (error) {
      toast.error(error);
    } else {
      setAnnouncements((data as SiteAnnouncement[]) ?? []);
    }
    setLoading(false);
  }

  // ============================================================
  // Editor
  // ============================================================

  function handleNew() {
    setEditingId("new");
    setHeadline("");
    setSubtext("");
    setCtaLabel("");
    setCtaHref("");
    setBgColor("#1a1a1a");
    setTextColor("#ffffff");
    setMediaUrl(null);
    setMediaType(null);
  }

  function handleEdit(ann: SiteAnnouncement) {
    setEditingId(ann.id);
    setHeadline(ann.headline);
    setSubtext(ann.subtext);
    setCtaLabel(ann.cta_label ?? "");
    setCtaHref(ann.cta_href ?? "");
    setBgColor(ann.bg_color);
    setTextColor(ann.text_color);
    setMediaUrl(ann.media_url);
    setMediaType(ann.media_type);
  }

  async function handleSave() {
    if (!headline.trim()) {
      toast.error("Headline is required");
      return;
    }

    setSaving(true);
    const payload = {
      headline: headline.trim(),
      subtext: subtext.trim(),
      cta_label: ctaLabel.trim() || null,
      cta_href: ctaHref.trim() || null,
      bg_color: bgColor,
      text_color: textColor,
      media_url: mediaUrl,
      media_type: mediaType,
    };

    if (editingId === "new") {
      const { data, error } = await createSiteAnnouncement(payload);
      if (error) {
        toast.error(error);
        setSaving(false);
        return;
      }
      setAnnouncements((prev) => [data, ...prev]);
      setEditingId(data.id);
      toast.success("Announcement created");
    } else if (editingId) {
      const { error } = await updateSiteAnnouncement(editingId, payload);
      if (error) {
        toast.error(error);
      } else {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingId ? { ...a, ...payload } : a))
        );
        toast.success("Announcement saved");
      }
    }
    setSaving(false);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Use an image or video file");
      return;
    }

    setUploadingMedia(true);

    if (isImage) {
      const compressed = await compressImage(file);
      const arrayBuffer = await compressed.blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const { url, error } = await uploadSiteMedia(
        base64,
        compressed.fileName,
        compressed.mimeType,
        `announcements/${editingId === "new" ? "temp" : editingId}`
      );
      if (error || !url) {
        toast.error(`Upload failed: ${error}`);
        setUploadingMedia(false);
        return;
      }
      setMediaUrl(url);
      setMediaType("image");
    } else {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video too large (max 100MB)");
        setUploadingMedia(false);
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const { url, error } = await uploadSiteMedia(
        base64,
        file.name,
        file.type,
        `announcements/${editingId === "new" ? "temp" : editingId}`
      );
      if (error || !url) {
        toast.error(`Upload failed: ${error}`);
        setUploadingMedia(false);
        return;
      }
      setMediaUrl(url);
      setMediaType("video");
    }

    setUploadingMedia(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveMedia() {
    if (mediaUrl) await deleteSiteMedia(mediaUrl);
    setMediaUrl(null);
    setMediaType(null);
  }

  async function handleActivate(id: string) {
    setSaving(true);
    const { error } = await activateSiteAnnouncement(id);
    if (error) {
      toast.error(error);
    } else {
      setAnnouncements((prev) =>
        prev.map((a) => ({ ...a, is_active: a.id === id }))
      );
      toast.success("Announcement activated");
    }
    setSaving(false);
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    const ann = announcements.find((a) => a.id === deleteId);
    if (ann?.media_url) await deleteSiteMedia(ann.media_url);

    const { error } = await deleteSiteAnnouncement(deleteId);
    if (error) {
      toast.error(error);
    } else {
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId));
      if (editingId === deleteId) setEditingId(null);
      toast.success("Announcement deleted");
    }
    setDeleteLoading(false);
    setDeleteId(null);
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light">Announcements</h1>
        <Button
          onClick={handleNew}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Announcement
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Announcements appear below the hero section on the homepage when
        active. Only one can be active at a time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="border border-border bg-card p-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="border border-border bg-card p-8 text-center">
              <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No announcements yet
              </p>
            </div>
          ) : (
            <div className="border border-border bg-card divide-y divide-border">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    editingId === ann.id
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleEdit(ann)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate flex-1">
                      {ann.headline}
                    </p>
                    {ann.is_active && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {!ann.is_active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(ann.id);
                        }}
                        disabled={saving}
                        className="text-xs text-green-700 hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(ann.id);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {editingId ? (
            <div className="border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-medium">
                {editingId === "new" ? "New Announcement" : "Edit Announcement"}
              </h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Headline *</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Free Delivery on Orders Above 100k"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subtext</label>
                <textarea
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  placeholder="Optional supporting text"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">CTA Button Text</label>
                  <Input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="e.g. Order Now"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">CTA Link</label>
                  <Input
                    value={ctaHref}
                    onChange={(e) => setCtaHref(e.target.value)}
                    placeholder="/shop"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Media (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                {mediaUrl ? (
                  <div className="relative border border-border rounded-lg overflow-hidden">
                    {mediaType === "video" ? (
                      <video
                        src={mediaUrl}
                        className="w-full aspect-video object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Announcement"
                        className="w-full aspect-video object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="p-1.5 bg-white/80 hover:bg-white transition-colors rounded-full"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleRemoveMedia}
                        disabled={uploadingMedia}
                        className="p-1.5 bg-white/80 hover:bg-white transition-colors rounded-full"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                    {uploadingMedia && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Upload image or video
                    </p>
                  </button>
                )}
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 border border-border rounded cursor-pointer"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-10 flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 border border-border rounded cursor-pointer"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preview</label>
                <div
                  className="rounded-lg p-4 flex items-center gap-3"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  {mediaUrl && mediaType === "image" && (
                    <img
                      src={mediaUrl}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  )}
                  <p className="text-sm font-medium">{headline || "Headline"}</p>
                  {subtext && (
                    <p className="text-xs opacity-80 hidden sm:block">{subtext}</p>
                  )}
                  {ctaLabel && (
                    <span className="ml-2 text-xs font-semibold underline underline-offset-2">
                      {ctaLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-primary-foreground"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId === "new" ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-border bg-card p-12 text-center">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Select an announcement to edit, or create a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this announcement. This action cannot
            be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleConfirmDelete}
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
