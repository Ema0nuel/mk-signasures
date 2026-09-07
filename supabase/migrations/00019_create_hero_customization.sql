-- Migration: 00019_create_hero_customization.sql
-- Description: Create hero banner customization, slides, CTAs, and site announcements

-- ============================================================
-- 1. Enums
-- ============================================================

CREATE TYPE public.banner_media_type AS ENUM ('photo', 'video', 'photo_video');
CREATE TYPE public.banner_transition AS ENUM ('fade', 'smooth', 'static');

-- ============================================================
-- 2. Tables
-- ============================================================

-- Hero Banners (one per configuration, only one active at a time)
CREATE TABLE public.hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  transition public.banner_transition NOT NULL DEFAULT 'fade',
  autoplay_ms INTEGER NOT NULL DEFAULT 5000,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hero Slides (1-10 per banner)
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES public.hero_banners(id) ON DELETE CASCADE,
  media_type public.banner_media_type NOT NULL DEFAULT 'photo',
  image_url TEXT,
  video_url TEXT,
  headline TEXT NOT NULL DEFAULT '',
  subtext TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hero Slide CTAs (buttons per slide)
CREATE TABLE public.hero_slide_ctas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES public.hero_slides(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'primary',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site Announcements (one active at a time)
CREATE TABLE public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  headline TEXT NOT NULL,
  subtext TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_type TEXT,
  cta_label TEXT,
  cta_href TEXT,
  bg_color TEXT NOT NULL DEFAULT '#1a1a1a',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. RLS Policies
-- ============================================================

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slide_ctas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can view hero banners"
  ON public.hero_banners FOR SELECT USING (true);

CREATE POLICY "Public can view hero slides"
  ON public.hero_slides FOR SELECT USING (true);

CREATE POLICY "Public can view hero slide ctas"
  ON public.hero_slide_ctas FOR SELECT USING (true);

CREATE POLICY "Public can view announcements"
  ON public.site_announcements FOR SELECT USING (true);

-- Admin full CRUD
CREATE POLICY "Admins can manage hero banners"
  ON public.hero_banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage hero slide ctas"
  ON public.hero_slide_ctas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON public.site_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 4. Triggers
-- ============================================================

CREATE TRIGGER set_hero_banners_updated_at
  BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_site_announcements_updated_at
  BEFORE UPDATE ON public.site_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. Indexes
-- ============================================================

CREATE INDEX idx_hero_slides_banner_id ON public.hero_slides(banner_id);
CREATE INDEX idx_hero_slide_ctas_slide_id ON public.hero_slide_ctas(slide_id);
CREATE INDEX idx_hero_banners_is_active ON public.hero_banners(is_active);
CREATE INDEX idx_hero_banners_sort_order ON public.hero_banners(sort_order);
CREATE INDEX idx_hero_slides_sort_order ON public.hero_slides(sort_order);

-- ============================================================
-- 6. Storage Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public read access for site media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'site-media');

-- Admin insert
CREATE POLICY "Admins can upload site media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admin update
CREATE POLICY "Admins can update site media"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'site-media'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admin delete
CREATE POLICY "Admins can delete site media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'site-media'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
