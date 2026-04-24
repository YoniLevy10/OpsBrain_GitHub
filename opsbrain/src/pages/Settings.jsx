import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import { GripVertical, Settings as SettingsIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MODULES, readWorkspaceConfig, writeWorkspaceConfig } from '@/lib/moduleRegistry';

function SortableModuleRow({ module, enabled, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-3 p-3 rounded-xl border',
        enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200',
        isDragging ? 'shadow-lg ring-2 ring-indigo-200' : '',
      ].join(' ')}
    >
      <button
        type="button"
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        {...attributes}
        {...listeners}
        aria-label="גרור לשינוי סדר"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <module.Icon className="w-4 h-4 text-slate-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-slate-900 truncate">{module.name}</div>
          <Badge variant="outline" className="text-xs">
            {module.category}
          </Badge>
        </div>
        <div className="text-xs text-slate-500 truncate">{module.description}</div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, workspaceId, workspaceName, loadWorkspace } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: '', phone: '' });
  const [workspace, setWorkspace] = useState({ name: '' });
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moduleCfg, setModuleCfg] = useState(() => readWorkspaceConfig());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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
    ['modules', 'Module Bank'],
  ];

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <PageHeader title="הגדרות" subtitle="פרופיל, עסק וצוות" Icon={SettingsIcon} />
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
            <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">טלפון</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">שם העסק</label>
            <input
              value={workspace.name}
              onChange={(e) => setWorkspace((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <p className="text-xs text-slate-500">שם מוצג בדשבורד: {workspaceName || '—'}</p>
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
            <h3 className="font-medium text-slate-700 mb-3">חברי הצוות ({members.length})</h3>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold">
                    {m.profiles?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.profiles?.full_name || 'משתמש'}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded-full border border-slate-200 text-slate-600">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-slate-700 mb-3">הזמן חבר צוות</h3>
            <div className="flex gap-2 flex-wrap">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="אימייל"
                type="email"
                className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
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

      {tab === 'modules' && (
        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Module Bank</CardTitle>
              <p className="text-sm text-slate-600">
                בחר אילו מודולים יופיעו בניווט הראשי, ושנה את הסדר בגרירה. נשמר מקומית (localStorage).
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-slate-600">
                  פעילים: <span className="font-semibold text-slate-900">{moduleCfg.modules?.active?.length || 0}</span> / {MODULES.length}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = readWorkspaceConfig();
                    setModuleCfg(next);
                    toast.success('הוגדר לברירת מחדל');
                  }}
                >
                  שחזר ברירת מחדל
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (!over || active.id === over.id) return;
                  const order = Array.isArray(moduleCfg?.nav?.order) ? moduleCfg.nav.order : [];
                  const oldIndex = order.indexOf(active.id);
                  const newIndex = order.indexOf(over.id);
                  if (oldIndex === -1 || newIndex === -1) return;
                  const nextOrder = arrayMove(order, oldIndex, newIndex);
                  const next = { ...moduleCfg, nav: { ...(moduleCfg.nav || {}), order: nextOrder } };
                  setModuleCfg(next);
                  writeWorkspaceConfig(next);
                }}
              >
                <SortableContext
                  items={Array.isArray(moduleCfg?.nav?.order) ? moduleCfg.nav.order : []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {(Array.isArray(moduleCfg?.nav?.order) ? moduleCfg.nav.order : []).map((id) => {
                      const mod = MODULES.find((m) => m.id === id);
                      if (!mod) return null;
                      const enabled = Array.isArray(moduleCfg?.modules?.active) && moduleCfg.modules.active.includes(id);
                      return (
                        <SortableModuleRow
                          key={id}
                          module={mod}
                          enabled={enabled}
                          onToggle={(checked) => {
                            const active = new Set(Array.isArray(moduleCfg?.modules?.active) ? moduleCfg.modules.active : []);
                            if (checked) active.add(id);
                            else active.delete(id);
                            const next = {
                              ...moduleCfg,
                              modules: {
                                ...(moduleCfg.modules || {}),
                                active: Array.from(active),
                                bank: MODULES.map((m) => m.id).filter((x) => !active.has(x)),
                              },
                            };
                            setModuleCfg(next);
                            writeWorkspaceConfig(next);
                          }}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">מודולים לא פעילים</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MODULES.filter((m) => !(moduleCfg.modules?.active || []).includes(m.id)).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const active = new Set(Array.isArray(moduleCfg?.modules?.active) ? moduleCfg.modules.active : []);
                        active.add(m.id);
                        const order = Array.isArray(moduleCfg?.nav?.order) ? moduleCfg.nav.order : [];
                        const nextOrder = order.includes(m.id) ? order : [...order, m.id];
                        const next = {
                          ...moduleCfg,
                          modules: {
                            ...(moduleCfg.modules || {}),
                            active: Array.from(active),
                            bank: MODULES.map((x) => x.id).filter((x) => !active.has(x)),
                          },
                          nav: { ...(moduleCfg.nav || {}), order: nextOrder },
                        };
                        setModuleCfg(next);
                        writeWorkspaceConfig(next);
                        toast.success('מודול הופעל');
                      }}
                      className="text-right rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-3"
                    >
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
