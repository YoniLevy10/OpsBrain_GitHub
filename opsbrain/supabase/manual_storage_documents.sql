-- OpsBrain — Storage bucket "documents" (הרץ ב-SQL Editor אחרי יצירת ה-bucket ב-Dashboard)
-- Dashboard → Storage → New bucket → name: documents, Public: OFF
--
-- מדיניות לדוגמה (התאם ל-schema של storage.objects בפרויקט שלך):

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "documents_insert_authenticated"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "documents_select_authenticated"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'documents');

-- מחיקה לפי owner — שדה owner ב-Supabase Storage הוא uuid:
-- CREATE POLICY "documents_delete_own"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'documents' AND owner = auth.uid());
