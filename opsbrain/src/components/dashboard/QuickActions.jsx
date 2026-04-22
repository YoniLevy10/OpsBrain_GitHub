import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useLanguage } from '@/components/LanguageContext';

export default function QuickActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const actions = [
    { 
      label: language === 'he' ? 'סגירת יום' : 'Day Close', 
      icon: MessageSquare, 
      onClick: () => navigate(createPageUrl('Chat'))
    },
    { 
      label: language === 'he' ? 'לקוח חדש' : 'New Client', 
      icon: Users, 
      onClick: () => navigate(createPageUrl('Clients'))
    },
    { 
      label: language === 'he' ? 'חשבונית' : 'Invoice', 
      icon: FileText, 
      onClick: () => navigate(createPageUrl('Invoices'))
    },
    { 
      label: language === 'he' ? 'דוח כספי' : 'Finance Report', 
      icon: TrendingUp, 
      onClick: () => navigate(createPageUrl('Finance'))
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card
            key={action.label}
            onClick={action.onClick}
            className="border border-gray-200 shadow-sm hover:shadow-lg active:shadow-md cursor-pointer transition-all duration-300 group overflow-hidden relative bg-white tap-target"
            style={{ animationDelay: `${index * 100}ms` }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                action.onClick();
              }
            }}
            aria-label={action.label}
          >
            <div className="absolute inset-0 bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-4 sm:p-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 group-hover:bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm flex-shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-gray-900 transition-colors duration-300" aria-hidden="true" />
                </div>
                <span className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-white transition-colors duration-300">
                  {action.label}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}