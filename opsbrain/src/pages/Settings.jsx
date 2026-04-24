import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import { toast } from 'sonner';

export default function Settings() {
  const { user, workspaceId, workspaceName, loadWorkspace } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: '', phone: '' });
  const [workspace, setWorkspace] = useState({ name: '' });
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && workspaceId) loadAll();
  }, [user, workspaceId]);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: prof }, { data: ws }, { data: mem }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('workspaces').select('*').eq('id', workspaceId).maybeSingle(),
      supabase.from('workspace_members').select('user_id, role').eq('workspace_id', workspaceId),
    ]);
    if (prof) setProfile({ full_name: prof.full_name || '', phone: prof.phone || '' });
    if (ws) setWorkspace({ name: ws.name || '' });
    const ids = (mem ?? []).map((m) => m.user_id).filter(Boolean);
    let withNames = [];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      const map = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
      withNames = (mem ?? []).map((m) => ({
        ...m,
        profiles: map[m.user_id] ? { full_name: map[m.user_id].full_name } : null,
      }));
    } else {
      withNames = mem ?? [];
    }
    setMembers(withNames);
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      toast.error('שגיאה בשמירה');
      return;
    }
    toast.success('פרופיל נשמר');
  };

  const saveWorkspace = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ name: workspace.name, updated_at: new Date().toISOString() })
      .eq('id', workspaceId);
    setSaving(false);
    if (error) {
      toast.error('שגיאה בשמירה');
      return;
    }
    toast.success('פרטי העסק נשמרו');
    loadWorkspace(user.id);
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('אימייל חובה');
      return;
    }
    toast.success(`הזמנה נשלחה ל-${inviteEmail} (בקרוב)`);
    setInviteEmail('');
  };

  const TABS = [
    ['profile', 'פרופיל'],
    ['business', 'עסק'],
    ['team', 'צוות'],
  ];

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">הגדרות</h1>
      <div className="flex gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap ${tab === key ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      )}

      {tab === 'business' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
            <input
              value={workspace.name}
              onChange={(e) => setWorkspace((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400">שם מוצג בדשבורד: {workspaceName || '—'}</p>
          <button
            onClick={saveWorkspace}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      )}

      {tab === 'team' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">חברי הצוות ({members.length})</h3>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold">
                    {m.profiles?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.profiles?.full_name || 'משתמש'}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded-full border border-gray-200 text-gray-500">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-3">הזמן חבר צוות</h3>
            <div className="flex gap-2 flex-wrap">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="אימייל"
                type="email"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={inviteMember}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                שלח הזמנה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
