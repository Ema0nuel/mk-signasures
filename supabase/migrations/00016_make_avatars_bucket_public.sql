-- Migration: 00016_make_avatars_bucket_public.sql
-- Description: Make avatars bucket public so avatar URLs work without signed URLs

UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Replace restrictive read policies with a single public read policy
DROP POLICY IF EXISTS "Users can read own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read avatars" ON storage.objects;

CREATE POLICY "Public read access for avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');
