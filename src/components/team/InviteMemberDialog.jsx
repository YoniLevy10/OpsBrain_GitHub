import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Mail, Loader2, UserPlus } from 'lucide-react';

export default function InviteMemberDialog({ open, onOpenChange }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // שליחת הזמנה לפלטפורמה
      await base44.users.inviteUser(email, 'user');

      // יצירת רשומת WorkspaceMember עם status: 'invited'
      return await base44.entities.WorkspaceMember.create({
        workspace_id: activeWorkspace.id,
        invited_email: email,
        role: role,
        status: 'invited',
        invited_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members']);
      toast.success(language === 'he' ? `הזמנה נשלחה ל-${email}` : `Invitation sent to ${email}`);
      setEmail('');
      setRole('member');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Invite error:', error);
      toast.error(language === 'he' ? 'שגיאה בשליחת ההזמנה' : 'Error sending invitation');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error(language === 'he' ? 'אנא הזן כתובת מייל תקינה' : 'Please enter a valid email');
      return;
    }
    inviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {language === 'he' ? 'הזמן חבר צוות' : 'Invite Team Member'}
          </DialogTitle>
          <DialogDescription>
            {language === 'he' 
              ? 'שלח הזמנה למייל והוסף חבר צוות למרחב העבודה' 
              : 'Send an email invitation to add a team member to your workspace'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {language === 'he' ? 'כתובת מייל' : 'Email Address'}
            </Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder={language === 'he' ? 'example@email.com' : 'example@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              {language === 'he' ? 'תפקיד' : 'Role'}
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  {language === 'he' ? 'חבר צוות' : 'Member'}
                </SelectItem>
                <SelectItem value="admin">
                  {language === 'he' ? 'מנהל' : 'Admin'}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {language === 'he' 
                ? 'מנהל יכול לנהל את כל ההגדרות, חבר צוות יכול לצפות ולערוך' 
                : 'Admin can manage all settings, Member can view and edit'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={inviteMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 ml-2" />
                  {language === 'he' ? 'שלח הזמנה' : 'Send Invitation'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}