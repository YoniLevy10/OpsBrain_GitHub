// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase, uploadFile, getFileUrl } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Upload, Download, FileText, Image, File } from 'lucide-react';

const getIcon = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
  if (ext === 'pdf') return FileText;
  return File;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function Documents() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const fileRef = useRef();

  useEffect(() => {
    if (!user) return;
    initWorkspace();
  }, [user]);

  const initWorkspace = async () => {
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const wsId = data?.workspace_id;
    setWorkspaceId(wsId);
    if (wsId) fetchFiles(wsId);
    else setLoading(false);
  };

  const fetchFiles = async (wsId) => {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false });
    setFiles(data || []);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;
    setUploading(true);
    const path = `${workspaceId}/${Date.now()}_${file.name}`;
    const { error: storageErr } = await uploadFile('documents', path, file);
    if (!storageErr) {
      const url = getFileUrl('documents', path);
      const { data: doc } = await supabase.from('documents').insert({
        workspace_id: workspaceId,
        data: {
          title: file.name,
          file_url: url,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        },
      }).select().single();
      if (doc) setFiles(prev => [doc, ...prev]);
    }
    setUploading(false);
    fileRef.current.value = '';
  };

  const filterOptions = [
    { key: 'all', label: 'הכל' },
    { key: 'pdf', label: 'PDF' },
    { key: 'image', label: 'תמונות' },
    { key: 'other', label: 'אחר' },
  ];

  const rowTitle = (f) => f.data?.title ?? f.title;
  const rowSize = (f) => f.data?.file_size ?? f.file_size;
  const rowUrl = (f) => f.data?.file_url ?? f.file_url;

  const filtered = files.filter(f => {
    if (filter === 'all') return true;
    const ext = rowTitle(f)?.split('.').pop()?.toLowerCase();
    if (filter === 'pdf') return ext === 'pdf';
    if (filter === 'image') return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    return !['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">מסמכים</h1>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'מעלה...' : 'העלה קובץ'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === opt.key
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>אין קבצים עדיין. העלה את הקובץ הראשון!</p>
            </div>
          ) : filtered.map(file => {
            const title = rowTitle(file);
            const Icon = getIcon(title);
            return (
              <div key={file.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 group hover:shadow-md transition-shadow">
                <Icon className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="text-xs text-gray-700 text-center truncate w-full font-medium">{title}</p>
                {rowSize(file) ? (
                  <p className="text-xs text-gray-400">{formatSize(rowSize(file))}</p>
                ) : null}
                <p className="text-xs text-gray-400">
                  {new Date(file.created_at).toLocaleDateString('he-IL')}
                </p>
                {rowUrl(file) && (
                  <a
                    href={rowUrl(file)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                  >
                    <Download className="w-3 h-3" />
                    הורד
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
