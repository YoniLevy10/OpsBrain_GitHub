-- OpsBrain — Storage bucket `documents` (הרץ אחרי יצירת ה-bucket ב-Dashboard)
-- Dashboard → Storage → New bucket → documents, Public: OFF

-- מדיניות upload
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- מדיניות צפייה
DROP POLICY IF EXISTS "authenticated_select" ON storage.objects;
CREATE POLICY "authenticated_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- מדיניות מחיקה (בעלים — owner ב-Supabase הוא uuid)
DROP POLICY IF EXISTS "owner_delete" ON storage.objects;
CREATE POLICY "owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND owner = auth.uid()
);
