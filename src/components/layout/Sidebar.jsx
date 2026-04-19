import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Users, 
  Package, 
  Calendar, 
  Bot, 
  Settings,
  Brain
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', nameHe: 'לוח בקרה', href: '/Dashboard', icon: LayoutDashboard },
  { name: 'Tasks', nameHe: 'משימות', href: '/Tasks', icon: CheckSquare },
  { name: 'Chat', nameHe: 'צאט', href: '/Chat', icon: MessageSquare },
  { name: 'Documents', nameHe: 'מסמכים', href: '/Documents', icon: FileText },
  { name: 'Finance', nameHe: 'פיננסים', href: '/Finance', icon: DollarSign },
  { name: 'CRM', nameHe: 'לקוחות', href: '/Clients', icon: Users },
  { name: 'Bamakor', nameHe: 'במקור', href: '/Bamakor', icon: Package },
  { name: 'Calendar', nameHe: 'לוח שנה', href: '/Calendar', icon: Calendar },
  { name: 'AI Agent', nameHe: 'סוכן AI', href: '/AIAgent', icon: Bot },
  { name: 'Settings', nameHe: 'הגדרות', href: '/Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, isRTL = false }) {
  const location = useLocation();
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-full w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          "bg-sidebar text-sidebar-foreground",
          isRTL ? "right-0" : "left-0",
          isRTL 
            ? (isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")
            : (isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">OpsBrain</h1>
            <p className="text-xs text-sidebar-foreground/60">Business OS</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href === '/Dashboard' && location.pathname === '/');
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
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
        
        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs font-semibold text-secondary-foreground">OB</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">OpsBrain Pro</p>
              <p className="text-xs text-sidebar-foreground/60">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
