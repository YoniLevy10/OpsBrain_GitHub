import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';

const FILE_ICONS = { pdf: '📄', image: '🖼️', docx: '📝', xlsx: '📊', other: '📎' };
const getType = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
  return 'other';
};

const docDisplayName = (d) => d.name || d.data?.title || 'מסמך';
const docStoragePath = (d) => d.storage_path || d.data?.storage_path;
const docFileType = (d) => d.file_type || getType(docDisplayName(d));
const docSizeBytes = (d) => d.size_bytes ?? d.data?.file_size;

export default function Documents() {
  const { user, workspaceId } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (workspaceId) fetchDocs();
  }, [workspaceId]);

  const fetchDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    setDocs(data ?? []);
    setLoading(false);
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${workspaceId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
    if (upErr) {
      toast.error('שגיאה בהעלאה: ' + upErr.message);
      setUploading(false);
      return;
    }
    const ft = getType(file.name);
    await supabase.from('documents').insert({
      workspace_id: workspaceId,
      uploaded_by: user.id,
      name: file.name,
      file_type: ft,
      size_bytes: file.size,
      storage_path: path,
      data: { title: file.name, storage_path: path, file_size: file.size, file_type: ft },
    });
    toast.success(`${file.name} הועלה בהצלחה`);
    setUploading(false);
    fetchDocs();
    if (fileRef.current) fileRef.current.value = '';
  };

  const download = async (doc) => {
    const path = docStoragePath(doc);
    if (!path) {
      toast.error('אין נתיב קובץ לשורה זו');
      return;
    }
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast.error('שגיאה בהורדה');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const deleteDoc = async (doc) => {
    if (!confirm('למחוק קובץ זה?')) return;
    const path = docStoragePath(doc);
    if (path) await supabase.storage.from('documents').remove([path]);
    await supabase.from('documents').delete().eq('id', doc.id);
    fetchDocs();
    toast.success('קובץ נמחק');
  };

  const filtered = docs.filter((d) => {
    const ft = docFileType(d);
    const matchType = filterType === 'all' || ft === filterType;
    const matchSearch = docDisplayName(d).toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">מסמכים</h1>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
        >
          {uploading ? 'מעלה...' : '+ העלה קובץ'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={upload} />
      </div>
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש קובץ..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">כל הסוגים</option>
          <option value="pdf">PDF</option>
          <option value="image">תמונות</option>
          <option value="docx">Word</option>
          <option value="xlsx">Excel</option>
          <option value="other">אחר</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon="📁"
          title="אין מסמכים עדיין"
          subtitle="העלה קבצים לשמירה ושיתוף עם הצוות"
          action="+ העלה קובץ"
          onAction={() => fileRef.current?.click()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="text-3xl mb-3">{FILE_ICONS[docFileType(doc)] || FILE_ICONS.other}</div>
              <p className="text-sm font-medium text-gray-800 truncate mb-1">{docDisplayName(doc)}</p>
              <p className="text-xs text-gray-400 mb-3">
                {formatSize(docSizeBytes(doc))} ·{' '}
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('he-IL') : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => download(doc)}
                  className="flex-1 text-xs text-[#6C63FF] border border-[#6C63FF] py-1 rounded-lg hover:bg-purple-50"
                >
                  הורד
                </button>
                <button
                  onClick={() => deleteDoc(doc)}
                  className="text-xs text-red-400 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
