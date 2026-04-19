import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Store } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import MarketplaceGrid from '@/components/marketplace/MarketplaceGrid';

export default function Marketplace() {
  const { language } = useLanguage();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['marketplace-professionals'],
    queryFn: async () => {
      return await opsbrain.entities.Professional.filter({ is_public: true });
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'he' ? 'Marketplace - אנשי מקצוע' : 'Professional Marketplace'}
            </h1>
            <p className="text-gray-500">
              {language === 'he' 
                ? 'מצא ושכור אנשי מקצוע מובילים לעסק שלך' 
                : 'Find and hire top professionals for your business'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{language === 'he' ? 'טוען...' : 'Loading...'}</p>
        </div>
      ) : (
        <MarketplaceGrid professionals={professionals} />
      )}
    </div>
  );
}