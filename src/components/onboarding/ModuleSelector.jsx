import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALL_MODULES = [
  { key: 'clients', he: 'ניהול לקוחות', en: 'Client Management', emoji: '👥', desc_he: 'CRM, היסטוריה, קשר', desc_en: 'CRM, history, contact' },
  { key: 'projects', he: 'פרויקטים', en: 'Projects', emoji: '📁', desc_he: 'ניהול פרויקטים ומשימות', desc_en: 'Project & task management' },
  { key: 'finance', he: 'פיננסים', en: 'Finance', emoji: '💰', desc_he: 'הכנסות, הוצאות, תזרים', desc_en: 'Income, expenses, cash flow' },
  { key: 'invoices', he: 'חשבוניות', en: 'Invoices', emoji: '📄', desc_he: 'יצירה ושליחת חשבוניות', desc_en: 'Create & send invoices' },
  { key: 'calendar', he: 'יומן', en: 'Calendar', emoji: '📅', desc_he: 'פגישות ואירועים', desc_en: 'Meetings & events' },
  { key: 'documents', he: 'מסמכים', en: 'Documents', emoji: '📝', desc_he: 'מסמכים וחוזים', desc_en: 'Documents & contracts' },
  { key: 'tasks', he: 'משימות', en: 'Tasks', emoji: '✅', desc_he: 'רשימת משימות יומית', desc_en: 'Daily task list' },
  { key: 'analytics', he: 'אנליטיקה', en: 'Analytics', emoji: '📊', desc_he: 'דוחות ותובנות', desc_en: 'Reports & insights' },
  { key: 'team', he: 'צוות', en: 'Team', emoji: '🤝', desc_he: 'ניהול עובדים והרשאות', desc_en: 'Team & permissions' },
  { key: 'automations', he: 'אוטומציות', en: 'Automations', emoji: '⚡', desc_he: 'תהליכים אוטומטיים', desc_en: 'Automated workflows' },
];

// מודולים מומלצים לפי סוג עסק
const RECOMMENDED = {
  consultant: ['clients', 'projects', 'finance', 'invoices', 'calendar', 'tasks'],
  marketing_agency: ['clients', 'projects', 'tasks', 'analytics', 'finance', 'team'],
  clinic: ['clients', 'calendar', 'invoices', 'finance', 'documents'],
  architect: ['clients', 'projects', 'documents', 'finance', 'calendar'],
  restaurant: ['finance', 'analytics', 'team', 'tasks'],
  cleaning: ['clients', 'tasks', 'finance', 'team'],
  ecommerce: ['finance', 'analytics', 'documents', 'automations'],
  it_services: ['clients', 'projects', 'tasks', 'finance', 'team'],
  real_estate: ['clients', 'documents', 'finance', 'calendar'],
  importer: ['clients', 'finance', 'documents', 'analytics'],
};

export default function ModuleSelector({ businessType, language, onConfirm }) {
  const recommended = RECOMMENDED[businessType] || ['clients', 'projects', 'finance', 'invoices', 'tasks'];
  const [selected, setSelected] = useState(new Set(recommended));

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          {language === 'he'
            ? 'בחרתי עבורך את המודולים המומלצים. אפשר להוסיף או להסיר לפי הצורך:'
            : 'I selected the recommended modules for you. Add or remove as needed:'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALL_MODULES.map(mod => {
          const isSelected = selected.has(mod.key);
          const isRecommended = recommended.includes(mod.key);
          return (
            <button
              key={mod.key}
              onClick={() => toggle(mod.key)}
              className={cn(
                "relative text-right p-4 rounded-xl border-2 transition-all text-sm",
                isSelected
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-400"
              )}
            >
              {isRecommended && (
                <span className={cn(
                  "absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-full",
                  isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  {language === 'he' ? 'מומלץ' : 'Recommended'}
                </span>
              )}
              {isSelected && (
                <Check className="absolute top-2 left-2 w-4 h-4 text-white" />
              )}
              <div className="text-2xl mb-1">{mod.emoji}</div>
              <div className="font-semibold">{language === 'he' ? mod.he : mod.en}</div>
              <div className={cn("text-xs mt-0.5", isSelected ? "text-white/70" : "text-gray-500")}>
                {language === 'he' ? mod.desc_he : mod.desc_en}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={() => onConfirm([...selected])}
        disabled={selected.size === 0}
        className="w-full bg-black hover:bg-gray-800 py-6 text-base rounded-xl"
      >
        <Sparkles className="w-5 h-5 ml-2" />
        {language === 'he' ? `מצוין! הפעל ${selected.size} מודולים ←` : `Activate ${selected.size} modules →`}
      </Button>
    </div>
  );
}