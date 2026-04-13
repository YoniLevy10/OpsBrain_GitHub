import React, { useState } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import TeamActivityMetrics from '@/components/analytics/TeamActivityMetrics';
import ProjectPerformance from '@/components/analytics/ProjectPerformance';
import ResourceUtilization from '@/components/analytics/ResourceUtilization';
import CustomReports from '@/components/analytics/CustomReports';

export default function WorkspaceAnalytics() {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const [dateRange, setDateRange] = useState('30d');

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">
          {language === 'he' ? 'אנא בחר מרחב עבודה' : 'Please select a workspace'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'he' ? 'אנליטיקה' : 'Analytics'}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeWorkspace.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              {dateRange === '7d' ? (language === 'he' ? '7 ימים' : '7 Days') :
               dateRange === '30d' ? (language === 'he' ? '30 ימים' : '30 Days') :
               language === 'he' ? '90 ימים' : '90 Days'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {language === 'he' ? 'ייצוא' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              {language === 'he' ? 'סקירה כללית' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="team">
              {language === 'he' ? 'פעילות צוות' : 'Team Activity'}
            </TabsTrigger>
            <TabsTrigger value="projects">
              {language === 'he' ? 'פרויקטים' : 'Projects'}
            </TabsTrigger>
            <TabsTrigger value="resources">
              {language === 'he' ? 'משאבים' : 'Resources'}
            </TabsTrigger>
            <TabsTrigger value="reports">
              {language === 'he' ? 'דוחות' : 'Reports'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <TeamActivityMetrics dateRange={dateRange} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectPerformance dateRange={dateRange} compact />
              <ResourceUtilization dateRange={dateRange} compact />
            </div>
          </TabsContent>

          <TabsContent value="team">
            <TeamActivityMetrics dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectPerformance dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="resources">
            <ResourceUtilization dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="reports">
            <CustomReports dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}