import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Header from './Header';

export default function OpsBrainLayout({ children, isRTL = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [children]);
  
  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Open search modal
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isRTL={isRTL}
      />
      
      {/* Main content area */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          isRTL={isRTL}
        />
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
