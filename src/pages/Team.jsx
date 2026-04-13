import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import TeamManager from '@/components/team/TeamManager';
import PermissionsManager from '@/components/team/PermissionsManager';

export default function Team() {
  const { language } = useLanguage();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">


      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {language === 'he' ? 'חברי צוות' : 'Team Members'}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {language === 'he' ? 'הרשאות' : 'Permissions'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <TeamManager />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}