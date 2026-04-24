// @ts-nocheck
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Settings,
  Menu,
  X,
  Brain,
  Users,
  DollarSign,
  Search,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from './components/GlobalSearch';
import NotificationCenter from './components/NotificationCenter';
import WorkspaceSelector from '@/components/workspace/WorkspaceSelector';
import { getActiveNavModules, readWorkspaceConfig } from '@/lib/moduleRegistry';

const OpsAgent = lazy(() => import('@/components/ai/OpsAgent'));

function LayoutContent() {
  const { user, signOut, workspaceName, activeWorkspace } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [workspaceConfig, setWorkspaceConfig] = useState(() => readWorkspaceConfig());
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPageName =
    pathParts[0] === 'app' && pathParts[1] ? pathParts[1] : pathParts[0] || 'Dashboard';

  const fullName = user?.user_metadata?.full_name || user?.email || 'משתמש';
  const initial = fullName[0]?.toUpperCase() || '?';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const onCfg = () => setWorkspaceConfig(readWorkspaceConfig());
    window.addEventListener('storage', onCfg);
    window.addEventListener('opsbrain_workspace_config_updated', onCfg);
    return () => {
      window.removeEventListener('storage', onCfg);
      window.removeEventListener('opsbrain_workspace_config_updated', onCfg);
    };
  }, []);

  const activeNav = getActiveNavModules(workspaceConfig);
  const mainPages = [
    activeNav[0]?.page || 'Dashboard',
    activeNav[1]?.page || 'TeamChat',
    activeNav[2]?.page || 'Documents',
    'Settings',
  ];
  const isChildRoute = !mainPages.includes(currentPageName);

  const navItems = activeNav.slice(0, 9).map((m) => ({
    name: m.name,
    href: m.route,
    icon: m.Icon,
    page: m.page,
  }));

  const moreItems = activeNav.slice(9).map((m) => ({
    name: m.name,
    href: m.route,
    icon: m.Icon,
    page: m.page,
  }));

  const teamNav = [{ name: 'צוות והרשאות', href: '/app/TeamPermissions', icon: Users, page: 'TeamPermissions' }];

  const settingsNav = [
    { name: 'הגדרות', href: '/app/Settings', icon: Settings, page: 'Settings' },
    { name: 'חיוב ותכנית', href: '/app/Subscriptions', icon: DollarSign, page: 'Subscriptions' },
    { name: 'דיווח על בעיה (במקור)', href: '/app/Bamakor', icon: Building2, page: 'Bamakor' },
  ];

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    return (
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm",
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          {isChildRoute ? (
            <button onClick={() => navigate(-1)} className="p-2">
              <ChevronLeft className="w-5 h-5 text-slate-900" />
            </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="p-2">
              <Menu className="w-5 h-5 text-slate-900" />
            </button>
          )}
          <Link to="/app/Dashboard" className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">OpsBrain</span>
          </Link>
          <div className="flex items-center">
            <NotificationCenter />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-t border-slate-200">
        <div className="grid grid-cols-4 h-16">
          {[
            { Icon: navItems[0]?.icon || Brain, label: 'בית', page: navItems[0]?.page || 'Dashboard', href: navItems[0]?.href || '/app/Dashboard' },
            { Icon: navItems[3]?.icon || Users, label: 'מודול', page: navItems[3]?.page || 'Tasks', href: navItems[3]?.href || '/app/Tasks' },
            { Icon: DollarSign, label: 'כספים', page: 'Finance', href: '/app/Finance' },
            { Icon: Settings, label: 'הגדרות', page: 'Settings', href: '/app/Settings' },
          ].map(({ Icon, label, page, href }) => (
            <button
              key={page}
              onClick={() => navigate(href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                currentPageName === page ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 bg-white/90 backdrop-blur flex flex-col transform transition-transform duration-300 border-l border-slate-200",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">OpsBrain</h1>
              <p className="text-xs text-slate-500">AI לניהול עסקי</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden lg:block [&_button]:text-slate-700 [&_button:hover]:bg-slate-100">
              <NotificationCenter />
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 pt-2 pb-3">
            <WorkspaceSelector />
          </div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-1">ראשי</p>
          {navItems.map(item => <NavLink key={item.page} item={item} />)}

          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">נוסף</p>
          {moreItems.map(item => <NavLink key={item.page} item={item} />)}

          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">צוות</p>
          {teamNav.map(item => <NavLink key={item.page} item={item} />)}

          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">מערכת</p>
          {settingsNav.map(item => <NavLink key={item.page} item={item} />)}
        </nav>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-slate-200">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const ok = window.confirm('האם אתה בטוח שברצונך להתנתק?');
                  if (!ok) return;
                  await signOut();
                  navigate('/Login');
                }}
                className="w-full px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200"
              >
                יציאה מהחשבון
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/75 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center ring-1 ring-slate-200 shadow-sm">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-slate-500">OpsBrain</div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-semibold truncate text-slate-900">{workspaceName || 'מרחב עבודה'}</div>
                {activeWorkspace?.plan && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                    {String(activeWorkspace.plan).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="w-[280px] ml-2">
              <WorkspaceSelector />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/app/Subscriptions')}
              className="hidden xl:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Billing</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 w-[420px] justify-start hover:bg-slate-50"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">חיפוש…</span>
              <span className="mr-auto text-xs text-slate-400">Ctrl K</span>
            </button>
            <div className="[&_button]:text-slate-700 [&_button:hover]:bg-slate-100">
              <NotificationCenter />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="px-4 lg:px-6 py-4"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Suspense fallback={null}>
        <OpsAgent />
      </Suspense>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function Layout() {
  return <LayoutContent />;
}
