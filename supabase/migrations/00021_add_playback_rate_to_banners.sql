-- Migration: 00021_add_playback_rate_to_banners.sql
-- Description: Add playback_rate to hero_banners for video speed control

ALTER TABLE public.hero_banners
  ADD COLUMN playback_rate NUMERIC(3,1) NOT NULL DEFAULT 1.0;

-- Add check constraint: playback rate must be between 0.1 and 2.0
ALTER TABLE public.hero_banners
  ADD CONSTRAINT hero_banners_playback_rate_check
  CHECK (playback_rate >= 0.1 AND playback_rate <= 2.0);
