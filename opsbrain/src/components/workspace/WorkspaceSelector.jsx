import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useLanguage } from '../LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Check, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WorkspaceSelector() {
  const { activeWorkspace, workspaces, switchWorkspace, createWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error(language === 'he' ? 'נא להזין שם' : 'Please enter a name');
      return;
    }

    try {
      await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsCreating(false);
      toast.success(language === 'he' ? 'מרחב עבודה נוצר' : 'Workspace created');
    } catch (error) {
      if (error.message.includes('Maximum')) {
        toast.error(language === 'he' ? 'מקסימום 3 מרחבי עבודה' : 'Maximum 3 workspaces');
      } else {
        toast.error(language === 'he' ? 'שגיאה ביצירת מרחב' : 'Error creating workspace');
      }
    }
  };

  if (!activeWorkspace) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors border border-border bg-card hover:bg-accent"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-right min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {language === 'he' ? 'בחר חברה' : 'Select workspace'}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'he' ? 'אין מרחב עבודה פעיל' : 'No active workspace'}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors border border-border bg-card hover:bg-accent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="text-right min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{activeWorkspace.name}</p>
              <p className="text-xs text-muted-foreground">
                {language === 'he' ? 'מרחב עבודה פעיל' : 'Active workspace'}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'he' ? 'מרחבי עבודה' : 'Workspaces'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                switchWorkspace(ws.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                ws.id === activeWorkspace.id
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  ws.id === activeWorkspace.id ? "bg-gray-900" : "bg-gray-200"
                )}>
                  <Building2 className={cn(
                    "w-4 h-4",
                    ws.id === activeWorkspace.id ? "text-white" : "text-gray-600"
                  )} />
                </div>
                <span className="font-medium text-gray-900">{ws.name}</span>
              </div>
              {ws.id === activeWorkspace.id && (
                <Check className="w-5 h-5 text-gray-900" />
              )}
            </button>
          ))}

          {!isCreating && workspaces.length < 3 && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-medium text-gray-600">
                {language === 'he' ? 'צור מרחב עבודה חדש' : 'Create new workspace'}
              </span>
            </button>
          )}

          {isCreating && (
            <div className="space-y-3 p-3 border-2 border-gray-900 rounded-lg">
              <Label>{language === 'he' ? 'שם מרחב העבודה' : 'Workspace name'}</Label>
              <Input
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder={language === 'he' ? 'הזן שם...' : 'Enter name...'}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateWorkspace} className="flex-1">
                  {language === 'he' ? 'צור' : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreating(false);
                  setNewWorkspaceName('');
                }} className="flex-1">
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}

          {workspaces.length >= 3 && !isCreating && (
            <p className="text-xs text-gray-500 text-center py-2">
              {language === 'he' 
                ? 'הגעת למקסימום של 3 מרחבי עבודה'
                : 'Maximum 3 workspaces reached'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}