import React from 'react';
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white shadow-xl">
      {/* Subtle animated background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gray-700 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-600 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400 text-sm font-medium">OpsBrain AI</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">
          {getGreeting()}, {userName || 'שם'}
        </h1>
        
        {businessName && (
          <p className="text-gray-300 text-lg mb-6">
            {businessName}
          </p>
        )}
        
        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">{t('welcome.systemActive')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>{t('welcome.dataUpdated')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}