import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Save, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';

const DEFAULT_PERMISSIONS = {
  owner: {
    finance: { view: true, create: true, edit: true, delete: true },
    clients: { view: true, create: true, edit: true, delete: true },
    projects: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true },
    team: { view: true, invite: true, manage: true }
  },
  admin: {
    finance: { view: true, create: true, edit: true, delete: true },
    clients: { view: true, create: true, edit: true, delete: true },
    projects: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: false },
    team: { view: true, invite: true, manage: false }
  },
  member: {
    finance: { view: true, create: true, edit: true, delete: false },
    clients: { view: true, create: true, edit: true, delete: false },
    projects: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    settings: { view: false, edit: false },
    team: { view: true, invite: false, manage: false }
  },
  viewer: {
    finance: { view: true, create: false, edit: false, delete: false },
    clients: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    documents: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    team: { view: false, invite: false, manage: false }
  }
};

export default function PermissionsManager() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('member');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS.member);

  const { data: permissionRecords = [] } = useQuery({
    queryKey: ['permissions', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Permission.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = permissionRecords.find(p => p.role === data.role);
      if (existing) {
        return opsbrain.entities.Permission.update(existing.id, data);
      }
      return opsbrain.entities.Permission.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
      toast.success(language === 'he' ? 'הרשאות נשמרו בהצלחה' : 'Permissions saved successfully');
    }
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    const existing = permissionRecords.find(p => p.role === role);
    setPermissions(existing?.permissions || DEFAULT_PERMISSIONS[role]);
  };

  const handlePermissionChange = (module, action, value) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value
      }
    }));
  };

  const handleSave = () => {
    saveMutation.mutate({
      workspace_id: activeWorkspace.id,
      role: selectedRole,
      permissions
    });
  };

  const handleReset = () => {
    setPermissions(DEFAULT_PERMISSIONS[selectedRole]);
  };

  const modules = [
    { 
      key: 'finance', 
      name: language === 'he' ? 'פיננסים' : 'Finance',
      actions: ['view', 'create', 'edit', 'delete']
    },
    { 
      key: 'clients', 
      name: language === 'he' ? 'לקוחות' : 'Clients',
      actions: ['view', 'create', 'edit', 'delete']
    },
    { 
      key: 'projects', 
      name: language === 'he' ? 'פרויקטים' : 'Projects',
      actions: ['view', 'create', 'edit', 'delete']
    },
    { 
      key: 'documents', 
      name: language === 'he' ? 'מסמכים' : 'Documents',
      actions: ['view', 'create', 'edit', 'delete']
    },
    { 
      key: 'settings', 
      name: language === 'he' ? 'הגדרות' : 'Settings',
      actions: ['view', 'edit']
    },
    { 
      key: 'team', 
      name: language === 'he' ? 'צוות' : 'Team',
      actions: ['view', 'invite', 'manage']
    }
  ];

  const actionLabels = {
    view: language === 'he' ? 'צפייה' : 'View',
    create: language === 'he' ? 'יצירה' : 'Create',
    edit: language === 'he' ? 'עריכה' : 'Edit',
    delete: language === 'he' ? 'מחיקה' : 'Delete',
    invite: language === 'he' ? 'הזמנה' : 'Invite',
    manage: language === 'he' ? 'ניהול' : 'Manage'
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          {language === 'he' ? 'ניהול הרשאות' : 'Permissions Management'}
        </CardTitle>
        <CardDescription>
          {language === 'he' 
            ? 'הגדר הרשאות מפורטות לכל תפקיד במרחב העבודה' 
            : 'Configure detailed permissions for each role in the workspace'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* בחירת תפקיד */}
        <div className="mb-6">
          <Label className="mb-3 block font-semibold">
            {language === 'he' ? 'בחר תפקיד לעריכה' : 'Select Role to Edit'}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['owner', 'admin', 'member', 'viewer'].map(role => (
              <Button
                key={role}
                variant={selectedRole === role ? 'default' : 'outline'}
                onClick={() => handleRoleChange(role)}
                className={selectedRole === role ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
              >
                {role === 'owner' && (language === 'he' ? 'בעלים' : 'Owner')}
                {role === 'admin' && (language === 'he' ? 'מנהל' : 'Admin')}
                {role === 'member' && (language === 'he' ? 'חבר צוות' : 'Member')}
                {role === 'viewer' && (language === 'he' ? 'צופה' : 'Viewer')}
              </Button>
            ))}
          </div>
        </div>

        {/* טבלת הרשאות */}
        <div className="space-y-4">
          {modules.map(module => (
            <Card key={module.key} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{module.name}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {module.actions.map(action => (
                    <div key={action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label htmlFor={`${module.key}-${action}`} className="text-sm">
                        {actionLabels[action]}
                      </Label>
                      <Switch
                        id={`${module.key}-${action}`}
                        checked={permissions[module.key]?.[action] || false}
                        onCheckedChange={(checked) => handlePermissionChange(module.key, action, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* פעולות */}
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 ml-2" />
            {language === 'he' ? 'איפוס לברירת מחדל' : 'Reset to Default'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 ml-2" />
            {language === 'he' ? 'שמור שינויים' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}