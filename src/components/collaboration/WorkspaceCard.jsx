import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Users, FileText, CheckSquare } from 'lucide-react';

export default function WorkspaceCard({ workspace }) {
  const typeIcons = {
    project: FolderKanban,
    client: Users,
    professional: Users,
    general: FileText
  };

  const typeLabels = {
    project: 'פרויקט',
    client: 'לקוח',
    professional: 'בעל מקצוע',
    general: 'כללי'
  };

  const Icon = typeIcons[workspace.type] || FolderKanban;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
              <Badge variant="outline" className="mt-1">
                {typeLabels[workspace.type]}
              </Badge>
            </div>
          </div>
        </div>

        {workspace.description && (
          <p className="text-sm text-gray-600 mb-4">{workspace.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {workspace.members?.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{workspace.members.length} חברים</span>
            </div>
          )}
          {workspace.shared_documents?.length > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{workspace.shared_documents.length}</span>
            </div>
          )}
          {workspace.shared_tasks?.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-4 h-4" />
              <span>{workspace.shared_tasks.length}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}