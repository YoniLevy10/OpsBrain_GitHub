// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { User, Building2, Users, Bell, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: 'profile', label: 'פרופיל', icon: User },
  { key: 'business', label: 'עסק', icon: Building2 },
  { key: 'team', label: 'חברי צוות', icon: Users },
  { key: 'notifications', label: 'התראות', icon: Bell },
];

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: '', phone: '' });
  const [workspace, setWorkspace] = useState({ name: '', slug: '' });
  const [workspaceId, setWorkspaceId] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [notifications, setNotifications] = useState({ tasks: true, finance: true, messages: true });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    // Profile
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) setProfile({ full_name: prof.full_name || '', phone: prof.phone || '' });
    else setProfile({ full_name: user.user_metadata?.full_name || '', phone: '' });

    // Workspace
    const { data: mem } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).single();
    const wsId = mem?.workspace_id;
    setWorkspaceId(wsId);

    if (wsId) {
      const { data: ws } = await supabase.from('workspaces').select('*').eq('id', wsId).single();
      if (ws) setWorkspace({ name: ws.name || '', slug: ws.slug || '' });

      const { data: mems } = await supabase.from('workspace_members').select('*, profiles(full_name)').eq('workspace_id', wsId);
      setMembers(mems || []);
    }
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || 'שגיאה בשמירת הפרופיל');
      return;
    }
    toast.success('הפרופיל נשמר בהצלחה');
    showSaved();
  };

  const saveBusiness = async () => {
    if (!workspaceId) return;
    setSaving(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ name: workspace.name, slug: workspace.slug })
      .eq('id', workspaceId);
    setSaving(false);
    if (error) {
      toast.error(error.message || 'שגיאה בשמירה');
      return;
    }
    toast.success('פרטי העסק נשמרו');
    showSaved();
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !workspaceId) return;
    toast.info('הזמנות לפי אימייל יתווספו בגרסה הבאה (נדרש שירות צד שרת או Edge Function).');
    setInviteEmail('');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#6C63FF] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-semibold text-gray-800 mb-4">פרטי פרופיל</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
              <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
              <input value={user?.email || ''} disabled className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="050-0000000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 bg-[#6C63FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52e0] disabled:opacity-50 transition-colors mt-2">
              {saved ? <><Check className="w-4 h-4" />נשמר!</> : <><Save className="w-4 h-4" />{saving ? 'שומר...' : 'שמור שינויים'}</>}
            </button>
          </div>
        )}

        {/* Business Tab */}
        {tab === 'business' && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-semibold text-gray-800 mb-4">הגדרות עסק</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
              <input value={workspace.name} onChange={e => setWorkspace(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מזהה (slug)</label>
              <input value={workspace.slug} onChange={e => setWorkspace(p => ({ ...p, slug: e.target.value }))} placeholder="my-business"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <button onClick={saveBusiness} disabled={saving} className="flex items-center gap-2 bg-[#6C63FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52e0] disabled:opacity-50 transition-colors mt-2">
              {saved ? <><Check className="w-4 h-4" />נשמר!</> : <><Save className="w-4 h-4" />{saving ? 'שומר...' : 'שמור שינויים'}</>}
            </button>
          </div>
        )}

        {/* Team Tab */}
        {tab === 'team' && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">חברי צוות</h2>
            <div className="space-y-2 mb-6">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-[#6C63FF] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(m.profiles?.full_name || m.user_id?.slice(0, 8) || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{m.profiles?.full_name || '—'}</p>
                    <p className="text-xs text-gray-500 font-mono">{m.user_id?.slice(0, 8)}…</p>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{m.role}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">הזמן חבר צוות</h3>
              <div className="flex gap-2">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="אימייל של חבר הצוות"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]" />
                <button onClick={inviteMember} className="bg-[#6C63FF] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52e0] transition-colors">
                  הזמן
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">הגדרות התראות</h2>
            <div className="space-y-4 max-w-md">
              {[
                { key: 'tasks', label: 'משימות חדשות', desc: 'קבל התראה כשמוקצית לך משימה חדשה' },
                { key: 'finance', label: 'עדכוני פיננסים', desc: 'התראות על תנועות פיננסיות' },
                { key: 'messages', label: 'הודעות צוות', desc: 'התראות על הודעות חדשות בצ\'אט' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-[#6C63FF]' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
              <button onClick={showSaved} className="flex items-center gap-2 bg-[#6C63FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52e0] transition-colors mt-2">
                {saved ? <><Check className="w-4 h-4" />נשמר!</> : <><Save className="w-4 h-4" />שמור הגדרות</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
