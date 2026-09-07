-- Migration: 00020_add_consistent_text_to_banners.sql
-- Description: Add consistent_text flag to hero_banners and expand site-media MIME types

ALTER TABLE public.hero_banners
  ADD COLUMN consistent_text BOOLEAN NOT NULL DEFAULT false;

-- Update site-media bucket to accept more video formats
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/x-matroska'
]
WHERE id = 'site-media';
