import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  DollarSign,
  CheckSquare,
  BookUser,
  Calendar,
  RefreshCw,
  TrendingUp,
  FolderKanban,
  Users,
  Bot,
  Brain,
} from 'lucide-react';

export const WORKSPACE_CONFIG_KEY = 'opsbrain_workspace_config';

/**
 * Single source of truth for all modules that can appear in navigation.
 * Keep this list stable; the onboarding wizard and Module Bank both rely on it.
 */
export const MODULES = [
  {
    id: 'dashboard',
    name: 'דף הבית',
    description: 'תצוגת מצב ופעולות מהירות',
    route: '/app/Dashboard',
    page: 'Dashboard',
    category: 'Operations',
    Icon: LayoutDashboard,
    defaultActive: true,
  },
  {
    id: 'teamchat',
    name: 'צ׳אט צוות',
    description: 'ערוצים, הודעות וקבצים',
    route: '/app/TeamChat',
    page: 'TeamChat',
    category: 'Communication',
    Icon: MessageSquare,
    defaultActive: true,
  },
  {
    id: 'documents',
    name: 'מסמכים',
    description: 'מסמכים, חוזים וקבצים',
    route: '/app/Documents',
    page: 'Documents',
    category: 'Operations',
    Icon: FileText,
    defaultActive: true,
  },
  {
    id: 'tasks',
    name: 'משימות',
    description: 'ניהול משימות וקאנבן',
    route: '/app/Tasks',
    page: 'Tasks',
    category: 'Operations',
    Icon: CheckSquare,
    defaultActive: true,
  },
  {
    id: 'finance',
    name: 'פיננסים',
    description: 'הכנסות, הוצאות ודוחות',
    route: '/app/Finance',
    page: 'Finance',
    category: 'Finance',
    Icon: DollarSign,
    defaultActive: true,
  },
  {
    id: 'calendar',
    name: 'יומן',
    description: 'אירועים ותכנון',
    route: '/app/Calendar',
    page: 'Calendar',
    category: 'Communication',
    Icon: Calendar,
    defaultActive: false,
  },
  {
    id: 'crm',
    name: 'אנשי קשר (CRM)',
    description: 'לקוחות/ספקים ואינטראקציות',
    route: '/app/Contacts',
    page: 'Contacts',
    category: 'Operations',
    Icon: BookUser,
    defaultActive: false,
  },
  {
    id: 'clients',
    name: 'לקוחות',
    description: 'לקוחות ותצוגות',
    route: '/app/Clients',
    page: 'Clients',
    category: 'Operations',
    Icon: Users,
    defaultActive: false,
  },
  {
    id: 'projects',
    name: 'פרויקטים',
    description: 'תקציבים וציר זמן',
    route: '/app/Projects',
    page: 'Projects',
    category: 'Operations',
    Icon: FolderKanban,
    defaultActive: false,
  },
  {
    id: 'integrations',
    name: 'אינטגרציות',
    description: 'חיבורים וסנכרונים',
    route: '/app/Integrations',
    page: 'Integrations',
    category: 'Operations',
    Icon: RefreshCw,
    defaultActive: false,
  },
  {
    id: 'automations',
    name: 'אוטומציות',
    description: 'טריגרים ותהליכים',
    route: '/app/Automations',
    page: 'Automations',
    category: 'Operations',
    Icon: RefreshCw,
    defaultActive: false,
  },
  {
    id: 'analytics',
    name: 'אנליטיקה',
    description: 'מדדים ותובנות',
    route: '/app/Analytics',
    page: 'Analytics',
    category: 'Analytics',
    Icon: TrendingUp,
    defaultActive: false,
  },
  {
    id: 'financialAssistant',
    name: 'העוזר האישי',
    description: 'דוחות ועזרה פיננסית',
    route: '/app/FinancialAssistant',
    page: 'FinancialAssistant',
    category: 'Finance',
    Icon: Bot,
    defaultActive: false,
  },
  {
    id: 'aiAgent',
    name: 'עוזר AI (מודול)',
    description: 'סוכן AI פנימי',
    route: '/app/AIAgent',
    page: 'AIAgent',
    category: 'Analytics',
    Icon: Brain,
    defaultActive: false,
  },
];

export function getDefaultWorkspaceConfig() {
  const active = MODULES.filter((m) => m.defaultActive).map((m) => m.id);
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    modules: {
      active,
      bank: MODULES.map((m) => m.id).filter((id) => !active.includes(id)),
    },
    nav: { order: active },
  };
}

export function readWorkspaceConfig() {
  if (typeof window === 'undefined') return getDefaultWorkspaceConfig();
  const raw = window.localStorage.getItem(WORKSPACE_CONFIG_KEY);
  if (!raw) return getDefaultWorkspaceConfig();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return getDefaultWorkspaceConfig();
    const known = new Set(MODULES.map((m) => m.id));
    const ALIAS = {
      chat: 'teamchat',
      teamChat: 'teamchat',
      financial_assistant: 'financialAssistant',
      financialassistant: 'financialAssistant',
    };
    const normalize = (id) => {
      const raw = String(id || '');
      const mapped = ALIAS[raw] || ALIAS[raw.toLowerCase()] || raw;
      return mapped;
    };

    const activeRaw = Array.isArray(parsed?.modules?.active) ? parsed.modules.active : [];
    const orderRaw = Array.isArray(parsed?.nav?.order) ? parsed.nav.order : [];

    const active = Array.from(
      new Set(activeRaw.map(normalize).filter((id) => known.has(id)))
    );
    const order = Array.from(
      new Set(orderRaw.map(normalize).filter((id) => known.has(id)))
    );
    const effectiveOrder = order.length ? order : active;
    return {
      ...getDefaultWorkspaceConfig(),
      ...parsed,
      modules: {
        ...getDefaultWorkspaceConfig().modules,
        ...(parsed.modules || {}),
        active,
      },
      nav: { ...getDefaultWorkspaceConfig().nav, ...(parsed.nav || {}), order: effectiveOrder },
    };
  } catch {
    return getDefaultWorkspaceConfig();
  }
}

export function writeWorkspaceConfig(next) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WORKSPACE_CONFIG_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('opsbrain_workspace_config_updated'));
}

export function getActiveNavModules(config) {
  const cfg = config || readWorkspaceConfig();
  const active = new Set(Array.isArray(cfg?.modules?.active) ? cfg.modules.active : []);
  const order = Array.isArray(cfg?.nav?.order) ? cfg.nav.order : [];
  const byId = new Map(MODULES.map((m) => [m.id, m]));

  const ordered = order.filter((id) => active.has(id) && byId.has(id)).map((id) => byId.get(id));
  const rest = MODULES.filter((m) => active.has(m.id) && !order.includes(m.id));
  return [...ordered, ...rest];
}

