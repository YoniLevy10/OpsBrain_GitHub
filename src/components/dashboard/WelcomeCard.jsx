import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function WelcomeCard({ userName, businessName }) {
  const { t } = useLanguage();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('welcome.morning');
    if (hour < 18) return t('welcome.afternoon');
    return t('welcome.evening');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-sidebar p-5 md:p-8 text-white shadow-xl">
      {/* Gradient accent elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary rounded-full mix-blend-overlay filter blur-3xl opacity-15"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-primary text-sm font-medium">OpsBrain AI</span>
        </div>
        
        <h1 className="text-2xl md:text-4xl font-bold mb-2 text-white">
          {getGreeting()}, {userName || 'User'}
        </h1>
        
        {businessName && (
          <p className="text-sidebar-foreground text-lg mb-6">
            {businessName}
          </p>
        )}
        
        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-sm text-sidebar-foreground">{t('welcome.systemActive')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground/60">
            <TrendingUp className="w-4 h-4" />
            <span>{t('welcome.dataUpdated')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
