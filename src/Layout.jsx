import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  MessageSquare, 
  History, 
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
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageToggle from './components/LanguageToggle';
import WorkspaceSelector from './components/workspace/WorkspaceSelector';
import NotificationCenter from './components/collaboration/NotificationCenter';
import GlobalSearch from './components/GlobalSearch';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { WorkspaceProvider, useWorkspace } from './components/workspace/WorkspaceContext';

function LayoutContent({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t, language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State preservation for bottom nav tabs
  const [pageStates, setPageStates] = useState(() => {
    const saved = sessionStorage.getItem('page_states');
    return saved ? JSON.parse(saved) : {};
  });

  // OpsBrain v1: Main navigation pages
  const mainPages = ['Dashboard', 'Clients', 'Projects', 'Documents', 'Settings'];
  const isChildRoute = !mainPages.includes(currentPageName);
  
  // Save scroll position and state before navigation
  useEffect(() => {
    const savePageState = () => {
      if (mainPages.includes(currentPageName)) {
        const newStates = {
          ...pageStates,
          [currentPageName]: {
            scrollY: window.scrollY,
            timestamp: Date.now()
          }
        };
        setPageStates(newStates);
        sessionStorage.setItem('page_states', JSON.stringify(newStates));
      }
    };
    
    window.addEventListener('beforeunload', savePageState);
    return () => {
      savePageState();
      window.removeEventListener('beforeunload', savePageState);
    };
  }, [currentPageName, pageStates]);
  
  // Restore scroll position after navigation
  useEffect(() => {
    if (mainPages.includes(currentPageName) && pageStates[currentPageName]) {
      const timer = setTimeout(() => {
        window.scrollTo(0, pageStates[currentPageName].scrollY || 0);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentPageName, pageStates]);

  // Global search shortcut (CMD+K / CTRL+K)
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
    base44.auth.me().then(setUser).catch(() => {});
    
    // PWA Meta Tags
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'OpsBrain' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#000000' }
    ];
    
    metaTags.forEach(tag => {
      let element = document.querySelector(`meta[name="${tag.name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.name = tag.name;
        document.head.appendChild(element);
      }
      element.content = tag.content;
    });
  }, []);

  // OpsBrain v1 Core Navigation
  // Focused on: Dashboard, Clients, Projects, Documents, Chat, Team, Settings
  // Deferred to v1.1: Calendar (needs event CRUD), Integrations (sync completely mocked)
  // Deferred to v1.1+: Finance, Automations, Analytics, Reports, Invoices, etc.
  // See OPSBRAIN_V1_GAP_CLOSING_PLAN.md and OPSBRAIN_V1_REALITY_CHECK.md
  const coreNav = [
    { name: language === 'he' ? 'דף הבית' : 'Dashboard', href: createPageUrl('Dashboard'), icon: LayoutDashboard, page: 'Dashboard' },
    { name: language === 'he' ? 'לקוחות' : 'Clients', href: createPageUrl('Clients'), icon: Users, page: 'Clients' },
    { name: language === 'he' ? 'פרויקטים' : 'Projects', href: createPageUrl('Projects'), icon: FolderKanban, page: 'Projects' },
    { name: language === 'he' ? 'מסמכים' : 'Documents', href: createPageUrl('Documents'), icon: FileText, page: 'Documents' },
    { name: language === 'he' ? 'צ\'אט' : 'Chat', href: createPageUrl('Chat'), icon: Brain, page: 'Chat' },
    // TODO v1.1: Calendar - needs event creation CRUD, Google Sync implementation
    // { name: language === 'he' ? 'קלנדר' : 'Calendar', href: createPageUrl('Calendar'), icon: MessageSquare, page: 'Calendar' },
    // TODO v1.1: Integrations - sync operations are currently mocked (random data); needs real OAuth + API
    // { name: language === 'he' ? 'ביוטוח' : 'Integrations', href: createPageUrl('Integrations'), icon: RefreshCw, page: 'Integrations' },
  ];

  // Marketplace מוסתר זמנית
  const marketplaceNav = [];

  const teamNav = [
    { name: language === 'he' ? 'צוות והרשאות' : 'Team & Permissions', href: createPageUrl('Team'), icon: Users, page: 'Team' },
  ];

  // לשוניות מותאמות אישית לפי סוג העסק
  const customTabs = activeWorkspace?.settings?.custom_tabs || [];
  const customNav = customTabs.map(tab => ({
    name: language === 'he' ? tab.he : tab.en,
    href: createPageUrl(tab.key),
    icon: getIconByName(tab.icon),
    page: tab.key
  }));

  function getIconByName(iconName) {
    const icons = {
      Package: FileText,
      Boxes: FileText,
      ShoppingCart: RefreshCw,
      Truck: RefreshCw,
      Warehouse: FileText,
      DollarSign: TrendingUp,
      TrendingUp: TrendingUp,
      UtensilsCrossed: FileText,
      ClipboardList: FileText,
      Users: Users,
      Clock: MessageSquare,
      CheckSquare: FileText,
      Megaphone: FileText,
      UserPlus: Users,
      Calendar: MessageSquare,
      Activity: TrendingUp,
      CreditCard: TrendingUp,
      X: FileText,
      UserCheck: Users,
      Building: FileText,
      FileText: FileText,
      Wrench: RefreshCw,
      Briefcase: FolderKanban,
      Layout: FileText,
      FileCheck: FileText,
      RotateCcw: RefreshCw,
      AlertCircle: FileText,
      Server: FileText,
      Shield: FileText
    };
    return icons[iconName] || FileText;
  }

  const settingsNav = [
    { name: language === 'he' ? 'הגדרות' : 'Settings', href: createPageUrl('Settings'), icon: Settings, page: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 h-16">
          {isChildRoute ? (
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -mr-2 tap-target"
              aria-label={language === 'he' ? 'חזור' : 'Back'}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 -mr-2 tap-target"
              aria-label={language === 'he' ? 'פתח תפריט' : 'Open menu'}
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-gray-900 dark:text-white" />
            <span className="font-semibold text-lg text-gray-900 dark:text-white">OpsBrain</span>
          </Link>
          <div className="flex gap-2">
            <NotificationCenter />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* OpsBrain v1: Mobile Bottom Navigation (4 tabs) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => {
              if (currentPageName === 'Dashboard') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl('Dashboard'));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 tap-target transition-colors",
              currentPageName === 'Dashboard'
                ? "text-black dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs">{language === 'he' ? 'בית' : 'Home'}</span>
          </button>
          <button
            onClick={() => {
              if (currentPageName === 'Projects') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl('Projects'));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 tap-target transition-colors",
              currentPageName === 'Projects'
                ? "text-black dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <FolderKanban className="w-6 h-6" />
            <span className="text-xs">{language === 'he' ? 'פרויקטים' : 'Projects'}</span>
          </button>
          <button
            onClick={() => {
              if (currentPageName === 'Documents') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl('Documents'));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 tap-target transition-colors",
              currentPageName === 'Documents'
                ? "text-black dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs">{language === 'he' ? 'מסמכים' : 'Docs'}</span>
          </button>
          <button
            onClick={() => {
              if (currentPageName === 'Settings') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl('Settings'));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 tap-target transition-colors",
              currentPageName === 'Settings'
                ? "text-black dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">{language === 'he' ? 'הגדרות' : 'Settings'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 bg-white/80 backdrop-blur-xl border-l border-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto touch-scroll",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg text-gray-900">OpsBrain</h1>
                    <p className="text-xs text-gray-500">{language === 'he' ? 'AI לניהול עסקי' : 'AI Business Management'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={language === 'he' ? 'חיפוש (⌘K)' : 'Search (⌘K)'}
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                  </button>
                  <NotificationCenter />
                  <LanguageToggle />
                </div>
              </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* לשוניות ליבה */}
            <div className="pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {language === 'he' ? 'ליבה' : 'Core'}
              </p>
            </div>
            {coreNav.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-gray-900 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* לשוניות מותאמות אישית */}
            {customNav.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {activeWorkspace?.business_type ? (language === 'he' ? 'מותאם עבורך' : 'Custom for You') : (language === 'he' ? 'מיוחדים' : 'Special')}
                  </p>
                </div>
                {customNav.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-gray-900 text-white shadow-lg" 
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* Marketplace */}
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {language === 'he' ? 'שירותים' : 'Services'}
              </p>
            </div>
            {marketplaceNav.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-gray-900 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* צוות */}
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {language === 'he' ? 'צוות' : 'Team'}
              </p>
            </div>
            {teamNav.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-gray-900 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* הגדרות */}
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {language === 'he' ? 'מערכת' : 'System'}
              </p>
            </div>
            {settingsNav.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-gray-900 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          {user && (
            <div className="p-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="mb-3">
                  <WorkspaceSelector />
                </div>
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {user.full_name?.[0] || user.email?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || (language === 'he' ? 'משתמש' : 'User')}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // נקה session storage
                    sessionStorage.clear();
                    // התנתק ופנה למסך התחברות
                    base44.auth.logout('/');
                  }}
                  className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                >
                  {language === 'he' ? 'יציאה מהחשבון' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen safe-area-inset-bottom">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
      );
      }

      export default function Layout(props) {
        return (
          <LanguageProvider>
            <WorkspaceProvider>
              <LayoutContent {...props} />
            </WorkspaceProvider>
          </LanguageProvider>
        );
      }