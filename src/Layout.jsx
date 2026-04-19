import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Menu, 
  X,
  Brain,
  Users,
  FileText,
  FolderKanban,
  DollarSign,
  Package,
  Calendar,
  Bot,
  CheckSquare,
  Search,
  Bell,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageToggle from './components/LanguageToggle';
import WorkspaceSelector from './components/workspace/WorkspaceSelector';
import NotificationCenter from './components/collaboration/NotificationCenter';
import GlobalSearch from './components/GlobalSearch';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { WorkspaceProvider, useWorkspace } from './components/workspace/WorkspaceContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Navigation items for OpsBrain
const navItems = [
  { name: 'Dashboard', nameHe: 'לוח בקרה', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Tasks', nameHe: 'משימות', href: 'Tasks', icon: CheckSquare },
  { name: 'Chat', nameHe: 'צאט', href: 'Chat', icon: MessageSquare },
  { name: 'Documents', nameHe: 'מסמכים', href: 'Documents', icon: FileText },
  { name: 'Finance', nameHe: 'פיננסים', href: 'Finance', icon: DollarSign },
  { name: 'CRM', nameHe: 'לקוחות', href: 'Clients', icon: Users },
  { name: 'Bamakor', nameHe: 'במקור', href: 'Projects', icon: Package },
  { name: 'Calendar', nameHe: 'לוח שנה', href: 'Calendar', icon: Calendar },
  { name: 'AI Agent', nameHe: 'סוכן AI', href: 'Chat', icon: Bot },
  { name: 'Settings', nameHe: 'הגדרות', href: 'Settings', icon: Settings },
];

function LayoutContent({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t, language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRTL = language === 'he';
  
  // State preservation for bottom nav tabs
  const [pageStates, setPageStates] = useState(() => {
    const saved = sessionStorage.getItem('page_states');
    return saved ? JSON.parse(saved) : {};
  });

  // OpsBrain v1: Main navigation pages
  const mainPages = ['Dashboard', 'Clients', 'Projects', 'Documents', 'Chat', 'Tasks', 'Settings'];
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
      { name: 'theme-color', content: '#1A1A2E' }
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

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Navy */}
      <aside className={cn(
        "fixed top-0 z-50 h-full w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        "bg-sidebar text-sidebar-foreground",
        isRTL ? "right-0" : "left-0",
        isRTL 
          ? (sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")
          : (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">OpsBrain</h1>
              <p className="text-xs text-sidebar-foreground/60">Business OS</p>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.href || 
                             (item.href === 'Dashboard' && location.pathname === '/');
              return (
                <li key={item.name}>
                  <Link
                    to={createPageUrl(item.href)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{isRTL ? item.nameHe : item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Workspace Selector & User */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <WorkspaceSelector />
          
          {user && (
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {user.full_name?.[0] || user.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || (isRTL ? 'משתמש' : 'User')}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  base44.auth.logout('/');
                }}
                className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors"
                title={isRTL ? 'יציאה' : 'Logout'}
              >
                <LogOut className="h-4 w-4 text-sidebar-foreground" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          {/* Mobile menu button / Back button */}
          {isChildRoute ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">{isRTL ? 'חזור' : 'Back'}</span>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{isRTL ? 'פתח תפריט' : 'Open menu'}</span>
            </Button>
          )}
          
          {/* Search bar */}
          <div className="flex-1 max-w-xl">
            <div 
              className="relative cursor-pointer"
              onClick={() => setSearchOpen(true)}
            >
              <Search className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                type="text"
                placeholder={isRTL ? "חיפוש..." : "Search anything..."}
                className={cn(
                  "h-10 bg-muted/50 border-0 cursor-pointer focus-visible:ring-1 focus-visible:ring-primary",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
                readOnly
              />
              <kbd className={cn(
                "absolute top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
                isRTL ? "left-3" : "right-3"
              )}>
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <NotificationCenter />
            
            {/* User avatar - Desktop only */}
            <div className="hidden lg:block">
              <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          {[
            { name: 'Home', nameHe: 'בית', icon: LayoutDashboard, page: 'Dashboard' },
            { name: 'Projects', nameHe: 'פרויקטים', icon: FolderKanban, page: 'Projects' },
            { name: 'Docs', nameHe: 'מסמכים', icon: FileText, page: 'Documents' },
            { name: 'Settings', nameHe: 'הגדרות', icon: Settings, page: 'Settings' },
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => {
                if (currentPageName === item.page) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  navigate(createPageUrl(item.page));
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                currentPageName === item.page
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{isRTL ? item.nameHe : item.name}</span>
            </button>
          ))}
        </div>
      </nav>

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
