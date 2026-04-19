import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function RecentSummary({ summary }) {
  const { t } = useLanguage();
  if (!summary) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">{t('recentSummary.title')}</h3>
        </div>
        <p className="text-gray-500 text-sm">{t('recentSummary.noSummaries')}</p>
        <Link 
          to={createPageUrl('Chat')}
          className="inline-flex items-center gap-2 text-sm text-black font-medium mt-4 hover:underline"
        >
          {t('recentSummary.createFirst')}
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('recentSummary.title')}</h3>
            <p className="text-xs text-gray-500">
              {format(new Date(summary.date), 'EEEE, d בMMMM', { locale: he })}
            </p>
          </div>
        </div>
        <Link 
          to={createPageUrl('History')}
          className="text-sm text-gray-500 hover:text-black"
        >
          {t('recentSummary.viewAll')}
        </Link>
      </div>

      <p className="text-gray-600 text-sm line-clamp-3">{summary.summary}</p>

      {summary.tomorrow_focus?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">{t('recentSummary.todayFocus')}</p>
          <ul className="space-y-1">
            {summary.tomorrow_focus.slice(0, 2).map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}