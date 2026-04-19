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
  const { user, signOut } = useAuth();
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

  const mainPages = ['Dashboard', 'Chat', 'Finance', 'Settings'];
  const isChildRoute = !mainPages.includes(currentPageName);

  const navItems = [
    { name: 'דף הבית', href: '/Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'משימות', href: '/Tasks', icon: CheckSquare, page: 'Tasks' },
    { name: 'לקוחות CRM', href: '/Contacts', icon: BookUser, page: 'Contacts' },
    { name: 'פיננסים', href: '/Finance', icon: DollarSign, page: 'Finance' },
    { name: 'מסמכים', href: '/Documents', icon: FileText, page: 'Documents' },
    { name: 'יומן', href: '/Calendar', icon: Calendar, page: 'Calendar' },
    { name: 'צ\'אט צוות', href: '/Chat', icon: MessageSquare, page: 'Chat' },
    { name: 'עוזר AI', href: '/AIAgent', icon: Bot, page: 'AIAgent' },
    { name: 'במקור', href: '/Bamakor', icon: Building2, page: 'Bamakor' },
  ];

  const moreItems = [
    { name: 'ניתוח עסקי', href: '/Analytics', icon: TrendingUp, page: 'Analytics' },
    { name: 'אוטומציות', href: '/Automations', icon: RefreshCw, page: 'Automations' },
    { name: 'פרויקטים', href: '/Projects', icon: FolderKanban, page: 'Projects' },
    { name: 'צוות', href: '/Team', icon: Users, page: 'Team' },
    { name: 'אינטגרציות', href: '/Integrations', icon: RefreshCw, page: 'Integrations' },
  ];

  const settingsNav = [
    { name: 'הגדרות', href: '/Settings', icon: Settings, page: 'Settings' },
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
            ? "bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]" dir="rtl">
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
          <Link to="/Dashboard" className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#6C63FF]" />
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
            { icon: LayoutDashboard, label: 'בית', page: 'Dashboard', href: '/Dashboard' },
            { icon: CheckSquare, label: 'משימות', page: 'Tasks', href: '/Tasks' },
            { icon: DollarSign, label: 'כספים', page: 'Finance', href: '/Finance' },
            { icon: Settings, label: 'הגדרות', page: 'Settings', href: '/Settings' },
          ].map(({ icon: Icon, label, page, href }) => (
            <button
              key={page}
              onClick={() => navigate(href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                currentPageName === page ? "text-[#6C63FF]" : "text-gray-500"
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
            <div className="w-9 h-9 bg-[#6C63FF] rounded-xl flex items-center justify-center">
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

          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">מערכת</p>
          {settingsNav.map(item => <NavLink key={item.page} item={item} />)}
        </nav>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-[#6C63FF] rounded-full flex items-center justify-center shrink-0">
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
      <main className="lg:mr-64 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
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
