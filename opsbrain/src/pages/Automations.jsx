import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Zap, Sparkles } from 'lucide-react';
import InvoiceAutomation from '@/components/automation/InvoiceAutomation';
import DocumentAutoFill from '@/components/automation/DocumentAutoFill';

export default function AutomationsPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* כותרת */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">
              {language === 'he' ? 'חסוך שעות עבודה בשבוע' : 'Save hours every week'}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {language === 'he' ? 'אוטומציות חכמות' : 'Smart Automations'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === 'he' 
              ? 'הפוך משימות יומיומיות לאוטומטיות והתמקד במה שחשוב באמת' 
              : 'Turn daily tasks into automation and focus on what really matters'}
          </p>
        </div>

        {/* Grid of automations */}
        <div className="grid md:grid-cols-2 gap-6">
          <InvoiceAutomation />
          <DocumentAutoFill />
        </div>

        {/* תועלת מצטברת */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">9+ שעות</h2>
          <p className="text-purple-100">
            {language === 'he' 
              ? 'חסכון ממוצע בשבוע עם אוטומציות מלאות' 
              : 'Average savings per week with full automation'}
          </p>
        </div>
      </div>
    </div>
  );
}