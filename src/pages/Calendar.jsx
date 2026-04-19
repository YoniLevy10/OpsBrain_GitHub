import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

const FullCalendar = React.lazy(() => import('../components/calendar/FullCalendar'));

export default function Calendar() {
  const { language } = useLanguage();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'he' ? 'היומן שלי' : 'My Calendar'}
        </h1>
        <p className="text-gray-500">
          {language === 'he' ? 'מסונכרן עם Google Calendar' : 'Synced with Google Calendar'}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <FullCalendar />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}