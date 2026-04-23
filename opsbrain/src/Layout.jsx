// @ts-nocheck
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Menu,
  X,
  Brain,
  Users,
  FileText,
  TrendingUp,
  FolderKanban,
  RefreshCw,
  DollarSign,
  Search,
  ChevronLeft,
  CheckSquare,
  Bot,
  Building2,
  Calendar,
  BookUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from './components/GlobalSearch';
import NotificationCenter from './components/NotificationCenter';

function LayoutContent() {
  const { user, signOut, workspaceName } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageName = location.pathname.split('/').filter(Boolean)[0] || 'Dashboard';

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

  const mainPages = ['Dashboard', 'TeamChat', 'Finance', 'Settings'];
  const isChildRoute = !mainPages.includes(currentPageName);

  const navItems = [
    { name: 'דף הבית', href: '/app/Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'צ׳אט צוות', href: '/app/TeamChat', icon: MessageSquare, page: 'TeamChat' },
    { name: 'אנליטיקה', href: '/app/Analytics', icon: TrendingUp, page: 'Analytics' },
    { name: 'אוטומציות', href: '/app/Automations', icon: RefreshCw, page: 'Automations' },
    { name: 'פיננסים', href: '/app/Finance', icon: DollarSign, page: 'Finance' },
    { name: 'לקוחות', href: '/app/Clients', icon: Users, page: 'Clients' },
    { name: 'פרויקטים', href: '/app/Projects', icon: FolderKanban, page: 'Projects' },
    { name: 'מסמכים', href: '/app/Documents', icon: FileText, page: 'Documents' },
    { name: 'העוזר האישי', href: '/app/FinancialAssistant', icon: Bot, page: 'FinancialAssistant' },
  ];

  const moreItems = [
    { name: 'משימות', href: '/app/Tasks', icon: CheckSquare, page: 'Tasks' },
    { name: 'אנשי קשר (CRM)', href: '/app/Contacts', icon: BookUser, page: 'Contacts' },
    { name: 'יומן', href: '/app/Calendar', icon: Calendar, page: 'Calendar' },
    { name: 'עוזר AI (מודול)', href: '/app/AIAgent', icon: Brain, page: 'AIAgent' },
    { name: 'אינטגרציות', href: '/app/Integrations', icon: RefreshCw, page: 'Integrations' },
  ];

  const teamNav = [{ name: 'צוות והרשאות', href: '/app/TeamPermissions', icon: Users, page: 'TeamPermissions' }];

  const settingsNav = [
    { name: 'הגדרות', href: '/app/Settings', icon: Settings, page: 'Settings' },
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
            ? "bg-[#6B46C1] text-white shadow-lg shadow-[#6B46C1]/30"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white" dir="rtl">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A1A2E] border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          {isChildRoute ? (
            <button onClick={() => navigate(-1)} className="p-2">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="p-2">
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}
          <Link to="/app/Dashboard" className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#8B5CF6]" />
            <span className="font-bold text-white">OpsBrain</span>
          </Link>
          <div className="flex items-center">
            <NotificationCenter />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E] border-t border-white/10">
        <div className="grid grid-cols-4 h-16">
          {[
            { icon: LayoutDashboard, label: 'בית', page: 'Dashboard', href: '/app/Dashboard' },
            { icon: CheckSquare, label: 'משימות', page: 'Tasks', href: '/app/Tasks' },
            { icon: DollarSign, label: 'כספים', page: 'Finance', href: '/app/Finance' },
            { icon: Settings, label: 'הגדרות', page: 'Settings', href: '/app/Settings' },
          ].map(({ icon: Icon, label, page, href }) => (
            <button
              key={page}
              onClick={() => navigate(href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                currentPageName === page ? "text-[#8B5CF6]" : "text-gray-500"
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
        "fixed top-0 right-0 z-50 h-full w-64 bg-[#1A1A2E] flex flex-col transform transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6B46C1] rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">OpsBrain</h1>
              <p className="text-xs text-gray-500">AI לניהול עסקי</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden lg:block [&_button]:text-gray-300 [&_button:hover]:bg-white/10">
              <NotificationCenter />
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-1">ראשי</p>
          {navItems.map(item => <NavLink key={item.page} item={item} />)}

          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">נוסף</p>
          {moreItems.map(item => <NavLink key={item.page} item={item} />)}

          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">צוות</p>
          {teamNav.map(item => <NavLink key={item.page} item={item} />)}

          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">מערכת</p>
          {settingsNav.map(item => <NavLink key={item.page} item={item} />)}
        </nav>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-[#6B46C1] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={async () => { await signOut(); navigate('/Login'); }}
                className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition-colors border border-white/10"
              >
                יציאה מהחשבון
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen bg-[#0F0F1A]">
        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-[#2A2A45] bg-[#0F0F1A]/80 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center ring-1 ring-white/10">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-[#A0A0C0]">OpsBrain</div>
              <div className="font-semibold truncate">{workspaceName || 'מרחב עבודה'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E1E35] border border-[#2A2A45] text-[#A0A0C0] w-[420px] justify-start"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">חיפוש…</span>
              <span className="mr-auto text-xs text-[#A0A0C0]/70">Ctrl K</span>
            </button>
            <div className="[&_button]:text-gray-200 [&_button:hover]:bg-white/10">
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

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function Layout() {
  return <LayoutContent />;
}
