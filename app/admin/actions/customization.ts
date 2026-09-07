"use server";

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// Banner CRUD
// ============================================================

export async function getHeroBanners() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("hero_banners")
    .select("*, hero_slides(id)")
    .order("sort_order", { ascending: true });

  if (error) return { data: null, error: error.message };

  const banners = (data ?? []).map((b: Record<string, unknown>) => {
    const slideCount = Array.isArray(b.hero_slides) ? b.hero_slides.length : 0;
    const { hero_slides, ...rest } = b;
    return { ...rest, slide_count: slideCount };
  });

  return { data: banners, error: null };
}

export async function getHeroBannerById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("hero_banners")
    .select(`
      *,
      hero_slides (
        *,
        hero_slide_ctas (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Not found" };

  // Sort slides and CTAs
  data.hero_slides.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
    (a.sort_order as number) - (b.sort_order as number)
  );
  for (const slide of data.hero_slides) {
    slide.hero_slide_ctas.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      (a.sort_order as number) - (b.sort_order as number)
    );
  }

  return { data, error: null };
}

export async function createHeroBanner(data: { name: string }) {
  const supabase = getAdminClient();
  const { data: banner, error } = await supabase
    .from("hero_banners")
    .insert({ name: data.name })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: banner, error: null };
}

export async function updateHeroBanner(
  id: string,
  updates: Partial<{
    name: string;
    transition: string;
    autoplay_ms: number;
    sort_order: number;
    is_active: boolean;
    consistent_text: boolean;
  }>
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("hero_banners")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteHeroBanner(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("hero_banners")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function activateHeroBanner(id: string) {
  const supabase = getAdminClient();

  // Deactivate all banners first
  await supabase
    .from("hero_banners")
    .update({ is_active: false })
    .eq("is_active", true);

  // Activate the target
  const { error } = await supabase
    .from("hero_banners")
    .update({ is_active: true })
    .eq("id", id);

  return { error: error?.message ?? null };
}

// ============================================================
// Slide CRUD
// ============================================================

export async function createHeroSlide(data: {
  banner_id: string;
  media_type?: string;
  headline?: string;
  subtext?: string;
  sort_order?: number;
}) {
  const supabase = getAdminClient();
  const { data: slide, error } = await supabase
    .from("hero_slides")
    .insert({
      banner_id: data.banner_id,
      media_type: data.media_type ?? "photo",
      headline: data.headline ?? "",
      subtext: data.subtext ?? "",
      sort_order: data.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: slide, error: null };
}

export async function updateHeroSlide(
  id: string,
  updates: Partial<{
    media_type: string;
    image_url: string | null;
    video_url: string | null;
    headline: string;
    subtext: string;
    sort_order: number;
  }>
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("hero_slides")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteHeroSlide(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("hero_slides")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

// ============================================================
// CTA CRUD
// ============================================================

export async function createSlideCta(data: {
  slide_id: string;
  label: string;
  href: string;
  variant?: string;
  sort_order?: number;
}) {
  const supabase = getAdminClient();
  const { data: cta, error } = await supabase
    .from("hero_slide_ctas")
    .insert({
      slide_id: data.slide_id,
      label: data.label,
      href: data.href,
      variant: data.variant ?? "primary",
      sort_order: data.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: cta, error: null };
}

export async function updateSlideCta(
  id: string,
  updates: Partial<{
    label: string;
    href: string;
    variant: string;
    sort_order: number;
  }>
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("hero_slide_ctas")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteSlideCta(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("hero_slide_ctas")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

// ============================================================
// Media Upload
// ============================================================

export async function uploadSiteMedia(
  fileBase64: string,
  fileName: string,
  fileType: string,
  folder: string
) {
  const supabase = getAdminClient();
  const ext = fileName.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(fileBase64, "base64");

  const { error: uploadError } = await supabase.storage
    .from("site-media")
    .upload(path, buffer, { contentType: fileType });

  if (uploadError) return { url: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("site-media").getPublicUrl(path);

  return { url: publicUrl, error: null };
}

export async function deleteSiteMedia(url: string) {
  const supabase = getAdminClient();
  const bucketUrl = supabase.storage.from("site-media").getPublicUrl("").data.publicUrl;
  const path = url.replace(bucketUrl, "");

  if (!path || path === url) return { error: null };

  const { error } = await supabase.storage.from("site-media").remove([path]);
  return { error: error?.message ?? null };
}

// ============================================================
// Announcement CRUD
// ============================================================

export async function getSiteAnnouncements() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createSiteAnnouncement(data: {
  headline: string;
  subtext?: string;
  media_url?: string | null;
  media_type?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  bg_color?: string;
  text_color?: string;
}) {
  const supabase = getAdminClient();
  const { data: announcement, error } = await supabase
    .from("site_announcements")
    .insert({
      headline: data.headline,
      subtext: data.subtext ?? "",
      media_url: data.media_url ?? null,
      media_type: data.media_type ?? null,
      cta_label: data.cta_label ?? null,
      cta_href: data.cta_href ?? null,
      bg_color: data.bg_color ?? "#1a1a1a",
      text_color: data.text_color ?? "#ffffff",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: announcement, error: null };
}

export async function updateSiteAnnouncement(
  id: string,
  updates: Partial<{
    headline: string;
    subtext: string;
    media_url: string | null;
    media_type: string | null;
    cta_label: string | null;
    cta_href: string | null;
    bg_color: string;
    text_color: string;
    is_active: boolean;
  }>
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("site_announcements")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteSiteAnnouncement(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("site_announcements")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function activateSiteAnnouncement(id: string) {
  const supabase = getAdminClient();

  await supabase
    .from("site_announcements")
    .update({ is_active: false })
    .eq("is_active", true);

  const { error } = await supabase
    .from("site_announcements")
    .update({ is_active: true })
    .eq("id", id);

  return { error: error?.message ?? null };
}
