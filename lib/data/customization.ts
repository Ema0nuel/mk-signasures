import { createClient } from "@/lib/supabase/server";

export async function getActiveHeroBanner() {
  try {
    const supabase = await createClient();
    const { data: banner } = await supabase
      .from("hero_banners")
      .select(`
        *,
        hero_slides (
          *,
          hero_slide_ctas (*)
        )
      `)
      .eq("is_active", true)
      .single();

    if (!banner) return null;

    // Sort slides by sort_order
    banner.hero_slides.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );

    // Sort CTAs within each slide
    for (const slide of banner.hero_slides) {
      slide.hero_slide_ctas.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    return banner;
  } catch {
    return null;
  }
}

export async function getActiveAnnouncement() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_announcements")
      .select("*")
      .eq("is_active", true)
      .single();

    return data ?? null;
  } catch {
    return null;
  }
}
