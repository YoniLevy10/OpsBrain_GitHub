import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const getTypeFromName = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
  return 'other';
};

export function useDocuments() {
  const { user, workspaceId } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setDocuments([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err);
      setDocuments([]);
      setLoading(false);
      return;
    }
    setDocuments(data ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file) => {
      if (!file) return null;
      if (!workspaceId) throw new Error('Missing workspace');
      if (!user?.id) throw new Error('Not authenticated');

      setUploading(true);
      try {
        const path = `${workspaceId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
        if (upErr) throw upErr;
        const ft = getTypeFromName(file.name);
        const { data, error: insErr } = await supabase
          .from('documents')
          .insert({
            workspace_id: workspaceId,
            uploaded_by: user.id,
            name: file.name,
            file_type: ft,
            size_bytes: file.size,
            storage_path: path,
            data: { title: file.name, storage_path: path, file_size: file.size, file_type: ft },
          })
          .select()
          .single();
        if (insErr) throw insErr;
        setDocuments((prev) => [data, ...prev]);
        return data;
      } finally {
        setUploading(false);
      }
    },
    [user?.id, workspaceId]
  );

  const createDownloadUrl = useCallback(async (storagePath, expiresSec = 60) => {
    const { data, error: err } = await supabase.storage.from('documents').createSignedUrl(storagePath, expiresSec);
    if (err) throw err;
    return data?.signedUrl ?? null;
  }, []);

  const remove = useCallback(async ({ id, storage_path }) => {
    if (storage_path) await supabase.storage.from('documents').remove([storage_path]);
    const { error: err } = await supabase.from('documents').delete().eq('id', id);
    if (err) throw err;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const normalized = useMemo(() => {
    return (documents || []).map((d) => ({
      ...d,
      displayName: d.name || d.data?.title || 'מסמך',
      storagePath: d.storage_path || d.data?.storage_path || null,
      fileType: d.file_type || d.data?.file_type || getTypeFromName(d.name || d.data?.title),
      sizeBytes: d.size_bytes ?? d.data?.file_size ?? null,
    }));
  }, [documents]);

  return {
    documents: normalized,
    rawDocuments: documents,
    loading,
    error,
    uploading,
    refresh,
    upload,
    createDownloadUrl,
    remove,
  };
}

