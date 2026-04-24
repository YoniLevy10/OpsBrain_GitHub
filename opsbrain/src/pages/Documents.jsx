import { useMemo, useRef, useState } from 'react';
import { PageLoader } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/useDocuments';
import { FileText, Image as ImageIcon, FileSpreadsheet, Paperclip, Upload, Search } from 'lucide-react';

const FILE_ICON_MAP = {
  pdf: FileText,
  image: ImageIcon,
  docx: FileText,
  xlsx: FileSpreadsheet,
  other: Paperclip,
};

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
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">מסמכים</h1>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'מעלה…' : 'העלה קובץ'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={onUpload} />
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש קובץ…"
          className="w-full border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
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
          Icon={FileText}
          title="אין מסמכים עדיין"
          subtitle="העלה קבצים לשמירה ושיתוף עם הצוות"
          action="העלה קובץ"
          onAction={() => fileRef.current?.click()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                {(() => {
                  const Icon = FILE_ICON_MAP[doc.fileType] || FILE_ICON_MAP.other;
                  return <Icon className="w-5 h-5 text-slate-600" aria-hidden />;
                })()}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate mb-1">{doc.displayName}</p>
              <p className="text-xs text-slate-500 mb-3">
                {formatSize(doc.sizeBytes)} ·{' '}
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('he-IL') : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => download(doc)}
                  className="flex-1 text-xs text-indigo-700 border border-indigo-200 py-1.5 rounded-lg hover:bg-indigo-50"
                >
                  הורד
                </button>
                <button
                  onClick={() => deleteDoc(doc)}
                  className="text-xs text-red-600 border border-red-200 px-2 py-1.5 rounded-lg hover:bg-red-50"
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
