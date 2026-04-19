import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 tap-target"
          aria-label={language === 'he' ? 'בחר שפה' : 'Select language'}
        >
          <Globe className="w-4 h-4" />
          <span className="font-medium hidden sm:inline">{language === 'he' ? 'עברית' : 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => setLanguage('he')}
          className={language === 'he' ? 'bg-gray-100 font-semibold' : ''}
        >
          <span className="text-lg mr-2">🇮🇱</span>
          עברית
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-gray-100 font-semibold' : ''}
        >
          <span className="text-lg mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}