-- Public bucket for chat media (images, files, voice)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-media', 'chat-media', true, 26214400)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 26214400;

-- Allow public (anon) read of objects in chat-media
DROP POLICY IF EXISTS "chat_media_read" ON storage.objects;
CREATE POLICY "chat_media_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'chat-media');

-- Allow public (anon) upload to chat-media
DROP POLICY IF EXISTS "chat_media_insert" ON storage.objects;
CREATE POLICY "chat_media_insert" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'chat-media');
