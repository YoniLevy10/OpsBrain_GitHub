import { useMemo, useRef, useState } from 'react';
import { PageLoader } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/useDocuments';

const FILE_ICONS = { pdf: '📄', image: '🖼️', docx: '📝', xlsx: '📊', other: '📎' };

export default function Documents() {
  const { documents, loading, uploading, upload: uploadDocument, createDownloadUrl, remove } = useDocuments();
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadDocument(file);
      toast.success(`${file.name} הועלה בהצלחה`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהעלאה');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const download = async (doc) => {
    const path = doc.storagePath;
    if (!path) {
      toast.error('אין נתיב קובץ לשורה זו');
      return;
    }
    try {
      const signedUrl = await createDownloadUrl(path, 60);
      if (!signedUrl) throw new Error('missing signed url');
      window.open(signedUrl, '_blank');
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בהורדה');
    }
  };

  const deleteDoc = async (doc) => {
    if (!confirm('למחוק קובץ זה?')) return;
    try {
      await remove({ id: doc.id, storage_path: doc.storagePath });
      toast.success('קובץ נמחק');
    } catch (e) {
      console.error(e);
      toast.error('שגיאה במחיקה');
    }
  };

  const filtered = useMemo(() => {
    return (documents ?? []).filter((d) => {
      const matchType = filterType === 'all' || d.fileType === filterType;
      const matchSearch = (d.displayName || '').toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [documents, filterType, search]);

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
        <input ref={fileRef} type="file" className="hidden" onChange={onUpload} />
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
              <div className="text-3xl mb-3">{FILE_ICONS[doc.fileType] || FILE_ICONS.other}</div>
              <p className="text-sm font-medium text-gray-800 truncate mb-1">{doc.displayName}</p>
              <p className="text-xs text-gray-400 mb-3">
                {formatSize(doc.sizeBytes)} ·{' '}
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
