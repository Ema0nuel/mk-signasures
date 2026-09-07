"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getHeroBannerById,
  updateHeroBanner,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  createSlideCta,
  updateSlideCta,
  deleteSlideCta,
} from "@/app/admin/actions/customization";
import { compressImage } from "@/lib/image-compress";
import { convertVideo } from "@/lib/video-convert";
import { deleteFromStorage } from "@/lib/supabase/upload";
import { getSiteRoutes } from "@/app/admin/actions/routes";
import { useBannerEditorStore, type SlideCTA } from "@/stores/banner-editor";
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
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  Film,
  GripVertical,
} from "lucide-react";
import type {
  HeroBannerWithSlides,
  HeroSlideWithCtas,
} from "@/types/database";

interface Slide extends HeroSlideWithCtas {
  hero_slide_ctas: SlideCTA[];
}

interface Banner extends HeroBannerWithSlides {
  hero_slides: Slide[];
}

async function adminUpload(
  bucket: string,
  path: string,
  file: File | Blob,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const formData = new FormData();
  formData.append("file", file, path.split("/").pop() || "file");
  formData.append("bucket", bucket);
  formData.append("path", path);

  const res = await fetch("/api/admin-upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) return { url: null, error: data.error || "Upload failed" };
  return { url: data.url, error: null };
}

export default function BannerEditorView({ bannerId }: { bannerId: string }) {
  const router = useRouter();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Banner settings
  const [name, setName] = useState("");
  const [transition, setTransition] = useState<string>("fade");
  const [autoplayMs, setAutoplayMs] = useState(5000);
  const [consistentText, setConsistentText] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Delete dialog
  const [deleteSlideId, setDeleteSlideId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Video conversion progress
  const [videoProgress, setVideoProgress] = useState<{ stage: string; percent: number } | null>(null);

  // Dynamic routes
  const [siteRoutes, setSiteRoutes] = useState<Array<{ label: string; href: string }>>([]);

  // Zustand store for CTA state management
  const { ctas, setCtas, addCta, updateCta, removeCta, hasUnsavedChanges, getDirtyCtas, markSaved } =
    useBannerEditorStore();
  const [savingCtas, setSavingCtas] = useState(false);

  useEffect(() => {
    loadBanner();
    getSiteRoutes().then(setSiteRoutes);
  }, [bannerId]);

  async function loadBanner() {
    const { data, error } = await getHeroBannerById(bannerId);
    if (error || !data) {
      toast.error(error ?? "Banner not found");
      router.push("/admin/customization/banners");
      return;
    }
    setBanner(data as Banner);
    setName(data.name);
    setTransition(data.transition);
    setAutoplayMs(data.autoplay_ms);
    setConsistentText(data.consistent_text ?? false);
    setPlaybackRate(data.playback_rate ?? 1.0);
    // Hydrate CTA store with first slide's CTAs
    const firstSlide = data.hero_slides?.[0];
    if (firstSlide) {
      setCtas(firstSlide.hero_slide_ctas as SlideCTA[]);
    }
    setLoading(false);
  }

  const slides = banner?.hero_slides ?? [];
  const currentSlide = slides[activeSlide];

  // ============================================================
  // Banner Settings
  // ============================================================

  async function handleSaveSettings() {
    if (!name.trim()) {
      toast.error("Banner name is required");
      return;
    }
    setSaving(true);
    const { error } = await updateHeroBanner(bannerId, {
      name: name.trim(),
      transition,
      autoplay_ms: autoplayMs,
      consistent_text: consistentText,
      playback_rate: playbackRate,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success("Settings saved");
    }
    setSaving(false);
  }

  // ============================================================
  // Slide Management
  // ============================================================

  async function handleAddSlide() {
    if (slides.length >= 10) return;
    setSaving(true);

    // When consistent text is on, carry over text from slide 0
    const sourceSlide = consistentText && slides.length > 0 ? slides[0] : null;

    const { data, error } = await createHeroSlide({
      banner_id: bannerId,
      sort_order: slides.length,
      headline: sourceSlide?.headline ?? "",
      subtext: sourceSlide?.subtext ?? "",
    });
    if (error) {
      toast.error(error);
      setSaving(false);
      return;
    }

    // Also copy CTAs from slide 0 when consistent text is on
    const newCtas: SlideCTA[] = [];
    if (sourceSlide?.hero_slide_ctas) {
      for (const cta of sourceSlide.hero_slide_ctas) {
        const { data: ctaData } = await createSlideCta({
          slide_id: data.id,
          label: cta.label,
          href: cta.href,
          variant: cta.variant,
          sort_order: cta.sort_order,
        });
        if (ctaData) newCtas.push(ctaData as SlideCTA);
      }
    }

    setBanner((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hero_slides: [...prev.hero_slides, { ...data, hero_slide_ctas: newCtas }],
      };
    });
    setActiveSlide(slides.length);
    toast.success("Slide added");
    setSaving(false);
  }

  async function handleRemoveSlide(slide: Slide) {
    setDeleteSlideId(slide.id);
  }

  async function confirmDeleteSlide() {
    if (!deleteSlideId) return;
    setDeleteLoading(true);
    const { error } = await deleteHeroSlide(deleteSlideId);
    if (error) {
      toast.error(error);
    } else {
      // Clean up media files
      const slide = slides.find((s) => s.id === deleteSlideId);
      if (slide?.image_url) await deleteFromStorage("site-media", slide.image_url);
      if (slide?.video_url) await deleteFromStorage("site-media", slide.video_url);

      setBanner((prev) => {
        if (!prev) return prev;
        const newSlides = prev.hero_slides.filter(
          (s) => s.id !== deleteSlideId
        );
        return { ...prev, hero_slides: newSlides };
      });
      setActiveSlide((prev) => Math.max(0, prev - 1));
      toast.success("Slide deleted");
    }
    setDeleteLoading(false);
    setDeleteSlideId(null);
  }

  // ============================================================
  // Slide Media Upload
  // ============================================================

  async function handleSlideImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file || !currentSlide) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPEG, PNG, or WebP");
      return;
    }

    setSaving(true);

    // Delete old image if replacing
    if (currentSlide.image_url) {
      await deleteFromStorage("site-media", currentSlide.image_url);
    }

    const compressed = await compressImage(file);
    const path = `banners/${bannerId}/slides/${currentSlide.id}/${Date.now()}-${compressed.fileName}`;

    const { url, error } = await adminUpload(
      "site-media",
      path,
      compressed.blob,
      compressed.mimeType
    );

    if (error || !url) {
      toast.error(`Upload failed: ${error}`);
      setSaving(false);
      return;
    }

    await updateHeroSlide(currentSlide.id, { image_url: url });
    setBanner((prev) => {
      if (!prev) return prev;
      const newSlides = [...prev.hero_slides];
      newSlides[activeSlide] = { ...newSlides[activeSlide], image_url: url };
      return { ...prev, hero_slides: newSlides };
    });
    toast.success("Image uploaded");
    setSaving(false);
  }

  async function handleSlideVideoUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file || !currentSlide) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video too large (max 200MB)");
      return;
    }

    setSaving(true);

    // Delete old video if replacing
    if (currentSlide.video_url) {
      await deleteFromStorage("site-media", currentSlide.video_url);
    }

    try {
      // Convert video to MP4 with progress updates
      setVideoProgress({ stage: "compressing", percent: 0 });
      const convertedBlob = await convertVideo(file, (stage, percent) => {
        if (stage === "loading") {
          setVideoProgress({ stage: "loading engine", percent });
        } else if (stage === "converting") {
          setVideoProgress({ stage: "converting", percent });
        } else {
          setVideoProgress({ stage, percent });
        }
      });

      // Upload converted MP4 via server action (bypasses RLS)
      setVideoProgress({ stage: "uploading", percent: 0 });

      // Debug: log converted file details
      console.log("Converted blob:", {
        type: convertedBlob.type,
        sizeBytes: convertedBlob.size,
        sizeMB: (convertedBlob.size / (1024 * 1024)).toFixed(2),
      });

      const path = `banners/${bannerId}/slides/${currentSlide.id}/${Date.now()}.mp4`;

      const { url, error } = await adminUpload(
        "site-media",
        path,
        convertedBlob,
        "video/mp4"
      );

      if (error || !url) {
        toast.error(`Upload failed: ${error}`);
        setVideoProgress(null);
        setSaving(false);
        return;
      }

      await updateHeroSlide(currentSlide.id, { video_url: url });
      setBanner((prev) => {
        if (!prev) return prev;
        const newSlides = [...prev.hero_slides];
        newSlides[activeSlide] = { ...newSlides[activeSlide], video_url: url };
        return { ...prev, hero_slides: newSlides };
      });
      toast.success("Video converted and uploaded");
    } catch (err) {
      toast.error(`Conversion failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    setVideoProgress(null);
    setSaving(false);
  }

  async function handleRemoveSlideMedia(type: "image" | "video") {
    if (!currentSlide) return;
    setSaving(true);

    const url = type === "image" ? currentSlide.image_url : currentSlide.video_url;
    if (url) await deleteFromStorage("site-media", url);

    await updateHeroSlide(currentSlide.id, {
      [type === "image" ? "image_url" : "video_url"]: null,
    });

    setBanner((prev) => {
      if (!prev) return prev;
      const newSlides = [...prev.hero_slides];
      newSlides[activeSlide] = {
        ...newSlides[activeSlide],
        [type === "image" ? "image_url" : "video_url"]: null,
      };
      return { ...prev, hero_slides: newSlides };
    });
    setSaving(false);
    toast.success(`${type === "image" ? "Image" : "Video"} removed`);
  }

  // ============================================================
  // Slide Content
  // ============================================================

  async function handleSlideContentSave() {
    if (!currentSlide) return;
    setSaving(true);
    const { error } = await updateHeroSlide(currentSlide.id, {
      headline: currentSlide.headline,
      subtext: currentSlide.subtext,
      media_type: currentSlide.media_type,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success("Slide saved");
    }
    setSaving(false);
  }

  function updateSlideLocal(
    field: keyof Slide,
    value: string | number | null
  ) {
    setBanner((prev) => {
      if (!prev) return prev;
      const newSlides = [...prev.hero_slides];
      newSlides[activeSlide] = {
        ...newSlides[activeSlide],
        [field]: value,
      };
      return { ...prev, hero_slides: newSlides };
    });
  }

  // ============================================================
  // CTA Management (local-first via Zustand)
  // ============================================================

  function handleAddCta() {
    addCta();
  }

  function handleUpdateCtaLocal(
    ctaId: string,
    updates: Partial<{ label: string; href: string; variant: string }>
  ) {
    updateCta(ctaId, updates as Parameters<typeof updateCta>[1]);
  }

  function handleDeleteCtaLocal(ctaId: string) {
    removeCta(ctaId);
  }

  async function handleSaveCtas() {
    if (!currentSlide) return;
    const { toCreate, toUpdate, toDelete } = getDirtyCtas();
    if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSavingCtas(true);

    // Delete removed CTAs
    for (const id of toDelete) {
      await deleteSlideCta(id);
    }

    // Update modified CTAs
    for (const { id, updates } of toUpdate) {
      await updateSlideCta(id, updates);
    }

    // Create new CTAs
    const createdCtas: SlideCTA[] = [];
    for (const cta of toCreate) {
      const { data, error } = await createSlideCta({
        slide_id: currentSlide.id,
        label: cta.label,
        href: cta.href,
        variant: cta.variant,
        sort_order: cta.sort_order,
      });
      if (!error && data) {
        createdCtas.push({ ...data, _isNew: false } as SlideCTA);
      }
    }

    // Merge: kept originals + newly created
    const currentIds = new Set(toCreate.map((c) => c.id));
    const kept = ctas.filter((c) => !currentIds.has(c.id));
    const finalCtas = [...kept, ...createdCtas].map((c, i) => ({ ...c, sort_order: i }));

    // Update local banner state with real IDs
    setBanner((prev) => {
      if (!prev) return prev;
      const newSlides = [...prev.hero_slides];
      newSlides[activeSlide] = {
        ...newSlides[activeSlide],
        hero_slide_ctas: finalCtas,
      };
      return { ...prev, hero_slides: newSlides };
    });

    markSaved(finalCtas);
    toast.success("Buttons saved");
    setSavingCtas(false);
  }

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse border border-border" />
      </div>
    );
  }

  if (!banner) return null;

  const showVideo = currentSlide?.media_type === "video" || currentSlide?.media_type === "photo_video";
  const showImage = currentSlide?.media_type === "photo" || currentSlide?.media_type === "photo_video";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/customization/banners"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Banners
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-primary text-primary-foreground"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>

      <h1 className="font-heading text-2xl font-light">Edit Banner</h1>

      {/* Banner Settings */}
      <div className="border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium">Banner Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
              placeholder="Banner name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Transition</label>
            <select
              value={transition}
              onChange={(e) => setTransition(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="fade">Fade (700ms)</option>
              <option value="smooth">Smooth (1000ms)</option>
              <option value="static">Static (instant)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Autoplay Interval</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={autoplayMs}
                onChange={(e) => setAutoplayMs(Number(e.target.value))}
                min={1000}
                max={30000}
                step={500}
                className="h-10"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {autoplayMs / 1000}s
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setConsistentText(!consistentText)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                consistentText ? "bg-gold" : "bg-muted"
              }`}
              role="switch"
              aria-checked={consistentText}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  consistentText ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <div>
              <label className="text-sm font-medium">Consistent Text</label>
              <p className="text-xs text-muted-foreground">
                Keep headline, subtext, and buttons the same across all slides.
                Only the media changes.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Video Playback Speed</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.1}
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-medium tabular-nums w-10 text-right">
                {playbackRate.toFixed(1)}x
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Slow: 0.5x, Normal: 1.0x, Fast: 1.5x. Videos advance to next slide when finished.
            </p>
          </div>
        </div>
      </div>

      {/* Slides Section */}
      <div className="border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            Slides ({slides.length}/10)
          </h2>
          <div className="flex items-center gap-1">
            {slides.length > 1 && (
              <button
                onClick={() => handleRemoveSlide(slides[activeSlide])}
                disabled={saving}
                className="h-8 px-2 text-xs text-destructive hover:text-destructive border border-border hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {slides.length < 10 && (
              <button
                onClick={handleAddSlide}
                disabled={saving}
                className="h-8 px-3 text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Slide
              </button>
            )}
          </div>
        </div>

        {/* Slide Tabs */}
        {slides.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => {
                  setActiveSlide(idx);
                  setCtas(slides[idx].hero_slide_ctas as SlideCTA[]);
                }}
                className={`shrink-0 h-9 px-4 text-xs font-medium border transition-colors ${
                  idx === activeSlide
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                Slide {idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Slide Editor */}
        {currentSlide && (
          <div className="space-y-5 pt-2">
            {/* Media Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Media Type</label>
              <select
                value={currentSlide.media_type}
                onChange={(e) => {
                  updateSlideLocal("media_type", e.target.value);
                  // Save immediately so the server matches
                  updateHeroSlide(currentSlide.id, {
                    media_type: e.target.value,
                  });
                }}
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 max-w-xs"
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="photo_video">Photo + Video</option>
              </select>
            </div>

            {/* Media Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Media</label>
              <div
                className={`grid gap-4 ${
                  showImage && showVideo ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {/* Image Upload */}
                {showImage && (
                  <SlideMediaUpload
                    type="image"
                    url={currentSlide.image_url}
                    onUpload={handleSlideImageUpload}
                    onRemove={() => handleRemoveSlideMedia("image")}
                    saving={saving}
                    inputId={`slide-img-${currentSlide.id}`}
                  />
                )}

                {/* Video Upload */}
                {showVideo && (
                  <SlideMediaUpload
                    type="video"
                    url={currentSlide.video_url}
                    onUpload={handleSlideVideoUpload}
                    onRemove={() => handleRemoveSlideMedia("video")}
                    saving={saving}
                    inputId={`slide-vid-${currentSlide.id}`}
                    videoProgress={videoProgress}
                  />
                )}
              </div>
            </div>

            {/* Headline & Subtext */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Headline</label>
                <Input
                  value={currentSlide.headline}
                  onChange={(e) => updateSlideLocal("headline", e.target.value)}
                  placeholder="Main heading text"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subtext</label>
                <textarea
                  value={currentSlide.subtext}
                  onChange={(e) => updateSlideLocal("subtext", e.target.value)}
                  placeholder="Supporting text below the headline"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>
              <Button
                onClick={handleSlideContentSave}
                disabled={saving}
                variant="outline"
                className="h-9"
              >
                {saving && <Loader2 className="mr-2 h-3.5 animate-spin" />}
                Save Slide Content
              </Button>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Buttons ({ctas.length})
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAddCta}
                    className="h-8 px-3 text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Button
                  </button>
                  {hasUnsavedChanges() && (
                    <button
                      onClick={handleSaveCtas}
                      disabled={savingCtas}
                      className="h-8 px-3 text-xs font-medium text-primary border border-primary hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                    >
                      {savingCtas && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save Buttons
                    </button>
                  )}
                </div>
              </div>

              {ctas.map((cta) => (
                <div
                  key={cta.id}
                  className="flex items-center gap-2 p-3 border border-border rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    value={cta.label}
                    onChange={(e) => handleUpdateCtaLocal(cta.id, { label: e.target.value })}
                    placeholder="Button text"
                    className="h-9 flex-1"
                  />
                  <div className="flex-1">
                    <select
                      value={
                        siteRoutes.some((p) => p.href === cta.href)
                          ? cta.href
                          : "__custom__"
                      }
                      onChange={(e) => {
                        if (e.target.value !== "__custom__") {
                          handleUpdateCtaLocal(cta.id, { href: e.target.value });
                        }
                      }}
                      className="w-full h-9 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus:border-ring"
                    >
                      {siteRoutes.map((link) => (
                        <option key={link.href} value={link.href}>
                          {link.label}
                        </option>
                      ))}
                    </select>
                    {!siteRoutes.some((p) => p.href === cta.href) && (
                      <Input
                        value={cta.href}
                        onChange={(e) => handleUpdateCtaLocal(cta.id, { href: e.target.value })}
                        placeholder="/your-custom-path"
                        className="h-9 mt-1"
                      />
                    )}
                  </div>
                  <select
                    value={cta.variant}
                    onChange={(e) => handleUpdateCtaLocal(cta.id, { variant: e.target.value })}
                    className="h-9 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus:border-ring"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                  <button
                    onClick={() => handleDeleteCtaLocal(cta.id)}
                    className="h-9 px-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Slide Dialog */}
      <Dialog
        open={!!deleteSlideId}
        onOpenChange={(open) => {
          if (!open) setDeleteSlideId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Slide</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this slide, its media files, and all
            buttons. This action cannot be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteSlideId(null)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={confirmDeleteSlide}
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

// ============================================================
// Slide Media Upload Subcomponent
// ============================================================

function SlideMediaUpload({
  type,
  url,
  onUpload,
  onRemove,
  saving,
  inputId,
  videoProgress,
}: {
  type: "image" | "video";
  url: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  saving: boolean;
  inputId: string;
  videoProgress?: { stage: string; percent: number } | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const stageLabel = videoProgress?.stage === "loading engine"
    ? "Loading converter..."
    : videoProgress?.stage === "compressing"
    ? "Compressing..."
    : videoProgress?.stage === "converting"
    ? "Converting to MP4..."
    : videoProgress?.stage === "uploading"
    ? "Uploading..."
    : "";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={type === "image" ? "image/jpeg,image/png,image/webp" : "video/*"}
        onChange={onUpload}
        className="hidden"
        id={inputId}
      />
      {url ? (
        <div className="relative border border-border rounded-lg overflow-hidden">
          {type === "image" ? (
            <img
              src={url}
              alt="Slide"
              className="w-full aspect-video object-cover"
            />
          ) : (
            <video
              src={url}
              className="w-full aspect-video object-cover"
              muted
              playsInline
            />
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={saving}
              className="p-1.5 bg-white/80 hover:bg-white transition-colors rounded-full"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRemove}
              disabled={saving}
              className="p-1.5 bg-white/80 hover:bg-white transition-colors rounded-full"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors"
        >
          {type === "image" ? (
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          ) : (
            <Film className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          )}
          <p className="text-xs text-muted-foreground">
            {type === "image" ? "Upload slide image" : "Upload any video format"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {type === "image" ? "JPEG, PNG, or WebP" : "MP4 or WebM, max 200MB"}
          </p>
        </button>
      )}
      {/* Progress bar below the upload area */}
      {videoProgress && (
        <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-sm font-medium">{stageLabel}</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${videoProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{videoProgress.percent}%</p>
        </div>
      )}
    </div>
  );
}
