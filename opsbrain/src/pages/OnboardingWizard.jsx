import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronLeft, ChevronRight, LayoutDashboard, MessageSquare, FileText, DollarSign, Calendar } from 'lucide-react';

const STORAGE_KEY = 'opsbrain_workspace_config';

const BUSINESS_TYPES = [
  { id: 'import_export', label: 'Import/Export' },
  { id: 'services', label: 'Services' },
  { id: 'retail', label: 'Retail' },
  { id: 'construction', label: 'Construction' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'tech', label: 'Tech' },
  { id: 'other', label: 'Other' },
];

const TEAM_SIZES = [
  { id: 'solo', label: 'Just me' },
  { id: '2_5', label: '2-5' },
  { id: '6_15', label: '6-15' },
  { id: '16_50', label: '16-50' },
  { id: '50_plus', label: '50+' },
];

const CORE_NEEDS = [
  { id: 'orders', label: 'Orders & deals' },
  { id: 'crm', label: 'Client relationships' },
  { id: 'tasks', label: 'Team tasks' },
  { id: 'documents', label: 'Documents & contracts' },
  { id: 'chat', label: 'Team chat' },
  { id: 'calendar', label: 'Calendar' },
];

const ALL_MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Overview and quick actions',
    route: '/app/Dashboard',
    Icon: LayoutDashboard,
  },
  { id: 'tasks', name: 'Tasks', description: 'Kanban and reminders', route: '/app/Tasks', Icon: Check },
  { id: 'documents', name: 'Documents', description: 'Files and contracts', route: '/app/Documents', Icon: FileText },
  { id: 'chat', name: 'Team Chat', description: 'Channels and messages', route: '/app/TeamChat', Icon: MessageSquare },
  { id: 'finance', name: 'Finance', description: 'Transactions and reports', route: '/app/Finance', Icon: DollarSign },
  { id: 'calendar', name: 'Calendar', description: 'Events and planning', route: '/app/Calendar', Icon: Calendar },
  // Accessible but hidden by default unless activated:
  { id: 'crm', name: 'CRM', description: 'Contacts and clients', route: '/app/Contacts', Icon: FileText },
  { id: 'integrations', name: 'Integrations', description: 'Connect services', route: '/app/Integrations', Icon: Calendar },
  { id: 'automations', name: 'Automations', description: 'Rules & runners', route: '/app/Automations', Icon: Calendar },
  { id: 'analytics', name: 'Analytics', description: 'Insights & dashboards', route: '/app/Analytics', Icon: Calendar },
  { id: 'projects', name: 'Projects', description: 'Plans & timelines', route: '/app/Projects', Icon: Calendar },
];

function inferActiveModules({ coreNeeds }) {
  const set = new Set(['dashboard']);
  for (const need of coreNeeds) {
    if (need === 'tasks') set.add('tasks');
    if (need === 'documents') set.add('documents');
    if (need === 'chat') set.add('chat');
    if (need === 'calendar') set.add('calendar');
    if (need === 'crm') set.add('crm');
    if (need === 'orders') set.add('projects');
  }
  // always keep finance available, but only activate if asked
  if (coreNeeds.includes('orders')) set.add('finance');
  return Array.from(set);
}

function Pill({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-2 rounded-xl border text-sm transition-colors text-left w-full sm:w-auto',
        selected
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white/70 border-slate-200 text-slate-800 hover:bg-slate-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ModuleCard({ module, active }) {
  const Icon = module.Icon;
  return (
    <div
      className={[
        'rounded-xl border p-3 flex items-start gap-3',
        active ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <div
        className={[
          'w-9 h-9 rounded-xl flex items-center justify-center border',
          active ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200',
        ].join(' ')}
      >
        <Icon className={['w-4 h-4', active ? 'text-white' : 'text-slate-700'].join(' ')} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-slate-900 truncate">{module.name}</div>
          <Badge variant={active ? 'default' : 'outline'}>{active ? 'ACTIVE' : 'BANK'}</Badge>
        </div>
        <div className="text-xs text-slate-600 mt-1">{module.description}</div>
      </div>
    </div>
  );
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState(null);
  const [teamSize, setTeamSize] = useState(null);
  const [coreNeeds, setCoreNeeds] = useState([]);
  const [workspaceName, setWorkspaceName] = useState('');

  const activeModules = useMemo(() => inferActiveModules({ coreNeeds }), [coreNeeds]);
  const { activeList, bankList } = useMemo(() => {
    const activeSet = new Set(activeModules);
    const activeList = [];
    const bankList = [];
    for (const m of ALL_MODULES) {
      if (activeSet.has(m.id)) activeList.push(m);
      else bankList.push(m);
    }
    return { activeList, bankList };
  }, [activeModules]);

  const progress = Math.round((step / 5) * 100);

  const canContinue =
    (step === 1 && !!businessType) ||
    (step === 2 && !!teamSize) ||
    (step === 3 && coreNeeds.length > 0) ||
    step === 4 ||
    (step === 5 && workspaceName.trim().length >= 2);

  const goNext = () => {
    if (!canContinue) return;
    if (step < 5) setStep((s) => s + 1);
    else {
      const config = {
        version: 1,
        createdAt: new Date().toISOString(),
        businessType,
        teamSize,
        coreNeeds,
        workspaceName: workspaceName.trim(),
        modules: {
          active: activeModules,
          bank: ALL_MODULES.map((m) => m.id).filter((id) => !activeModules.includes(id)),
        },
        nav: {
          order: activeModules,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast.success('Workspace configured');
      navigate('/app/Dashboard');
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate('/app/Dashboard');
  };

  const toggleNeed = (id) => {
    setCoreNeeds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="ltr">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button variant="outline" onClick={goBack} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-sm text-slate-600">
            Step <span className="font-semibold text-slate-900">{step}</span>/5
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="text-xs text-slate-500">Setup progress</div>
            </div>
            <CardTitle className="text-2xl">First-run setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-600">What kind of business are you?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((o) => (
                    <Pill key={o.id} selected={businessType === o.id} onClick={() => setBusinessType(o.id)}>
                      {o.label}
                    </Pill>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-600">How many people on your team?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEAM_SIZES.map((o) => (
                    <Pill key={o.id} selected={teamSize === o.id} onClick={() => setTeamSize(o.id)}>
                      {o.label}
                    </Pill>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-600">What do you need to manage?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CORE_NEEDS.map((o) => (
                    <Pill key={o.id} selected={coreNeeds.includes(o.id)} onClick={() => toggleNeed(o.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{o.label}</span>
                        {coreNeeds.includes(o.id) ? <Check className="w-4 h-4" /> : null}
                      </div>
                    </Pill>
                  ))}
                </div>
                <div className="text-xs text-slate-500">Multi-select supported.</div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">Module activation</div>
                  <div className="text-xs text-slate-500">
                    These modules will be active in your main navigation. You can enable more later from Settings → Module Bank.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</div>
                    <div className="space-y-2">
                      {activeList.map((m) => (
                        <ModuleCard key={m.id} module={m} active />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Module Bank</div>
                    <div className="space-y-2">
                      {bankList.slice(0, 6).map((m) => (
                        <ModuleCard key={m.id} module={m} active={false} />
                      ))}
                      {bankList.length > 6 ? (
                        <div className="text-xs text-slate-500">+ {bankList.length - 6} more modules</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-600">Workspace name</div>
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Operations"
                />
                <div className="text-xs text-slate-500">
                  This is stored locally as part of <code className="font-mono">{STORAGE_KEY}</code>.
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" onClick={goBack} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={goNext} disabled={!canContinue} className="gap-2">
                {step < 5 ? 'Continue' : 'Finish'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

