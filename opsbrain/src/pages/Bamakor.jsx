import { useMemo, useState } from 'react';
import { bamakorSupabase, isBamakorConfigured } from '@/lib/bamakorSupabase';
import { toast } from 'sonner';

const inputClass =
  'mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400';

export default function Bamakor() {
  const client = useMemo(() => (isBamakorConfigured ? bamakorSupabase : null), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!client) {
    return (
      <div dir="rtl" className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">במקור — דיווח על בעיה</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          <p className="mb-3">כדי לשמור דיווחים בפרויקט Supabase נפרד של במקור, הוסף ל־`.env.local`:</p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 font-mono text-xs text-slate-800 space-y-1">
            <div>VITE_BAMAKOR_URL=https://your-bamakor-project.supabase.co</div>
            <div>VITE_BAMAKOR_KEY=your_bamakor_anon_key</div>
          </div>
          <p className="text-xs mt-3 text-slate-500">
            ואז הרץ SQL ליצירת טבלת `bug_reports` (ראו `opsbrain/supabase/bamakor_bug_reports.sql` בריפו).
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!title.trim()) {
      toast.error('כותרת חובה');
      return;
    }
    setSaving(true);
    try {
      let screenshot_path = null;
      if (file) {
        const path = `bug-reports/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await client.storage.from('documents').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        screenshot_path = path;
      }

      const { error } = await client.from('bug_reports').insert({
        title: title.trim(),
        description: description.trim() || null,
        severity,
        screenshot_path,
      });
      if (error) throw error;

      toast.success('הדיווח נשמר');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setFile(null);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בשמירת דיווח (בדוק טבלה/Storage policies)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">במקור — דיווח על בעיה</h1>
        <p className="text-slate-500 mt-1">שולח לפרויקט Supabase של במקור (לא לפרויקט הראשי)</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
        <div>
          <label className="text-xs text-slate-500 font-medium">כותרת</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="תקציר קצר של הבעיה"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 font-medium">תיאור</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[120px]`}
            placeholder="צעדים לשחזור, מה ציפית לראות, מה קרה בפועל…"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 font-medium">חומרה</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputClass}>
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="critical">קריטית</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-medium">צילום מסך (אופציונלי)</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-slate-600" />
          <p className="text-xs text-slate-500 mt-2">
            מועלה ל-bucket `documents` בפרויקט במקור תחת `bug-reports/…` (דורש מדיניות Storage מתאימה).
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
        >
          {saving ? 'שולח…' : 'שלח דיווח'}
        </button>
      </div>
    </div>
  );
}
