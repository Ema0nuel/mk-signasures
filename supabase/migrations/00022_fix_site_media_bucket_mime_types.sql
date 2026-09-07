-- Migration: 00022_fix_site_media_bucket_mime_types.sql
-- Description: Force correct MIME types on site-media bucket (previous ON CONFLICT DO NOTHING may have skipped update)

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/x-matroska'
]
WHERE id = 'site-media';
