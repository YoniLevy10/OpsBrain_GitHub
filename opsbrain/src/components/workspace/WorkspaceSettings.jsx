import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { useLanguage } from '../LanguageContext';
import { useWorkspace } from './WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Mail, Crown, Shield, Eye, MoreVertical, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function WorkspaceSettings() {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.WorkspaceMember.filter({
        workspace_id: activeWorkspace.id
      });
    },
    enabled: !!activeWorkspace
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => opsbrain.auth.me()
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      // יצירת הרשומה
      const member = await opsbrain.entities.WorkspaceMember.create({
        workspace_id: activeWorkspace.id,
        invited_email: email,
        role: role,
        status: 'invited',
        invited_at: new Date().toISOString()
      });

      // שליחת מייל הזמנה
      try {
        await opsbrain.functions.invoke('sendTeamInvitation', {
          email,
          role,
          workspaceName: activeWorkspace.name,
          inviterName: currentUser?.full_name,
          workspaceId: activeWorkspace.id
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // ממשיכים גם אם המייל נכשל
      }

      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteOpen(false);
      toast.success(language === 'he' ? 'הזמנה נשלחה בהצלחה' : 'Invitation sent successfully');
    },
    onError: (error) => {
      console.error('Invitation error:', error);
      toast.error(language === 'he' ? 'שגיאה בשליחת הזמנה' : 'Error sending invitation');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }) => {
      return await opsbrain.entities.WorkspaceMember.update(memberId, {
        role: newRole
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      toast.success(language === 'he' ? 'התפקיד עודכן בהצלחה' : 'Role updated successfully');
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה בעדכון התפקיד' : 'Error updating role');
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId) => {
      return await opsbrain.entities.WorkspaceMember.update(memberId, {
        status: 'removed',
        removed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      toast.success(language === 'he' ? 'חבר הוסר' : 'Member removed');
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (member) => {
      await opsbrain.functions.invoke('sendTeamInvitation', {
        email: member.invited_email,
        role: member.role,
        workspaceName: activeWorkspace.name,
        inviterName: currentUser?.full_name,
        workspaceId: activeWorkspace.id
      });
    },
    onSuccess: () => {
      toast.success(language === 'he' ? 'הזמנה נשלחה מחדש' : 'Invitation resent');
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה בשליחת הזמנה' : 'Error sending invitation');
    }
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error(language === 'he' ? 'נא להזין כתובת מייל' : 'Please enter email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error(language === 'he' ? 'כתובת מייל לא תקינה' : 'Invalid email');
      return;
    }

    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'member': return <UserPlus className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
      default: return <UserPlus className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentMember = members.find(m => m.user_id === currentUser?.id);
  const canManageMembers = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  if (!activeWorkspace) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {language === 'he' ? 'חברי מרחב העבודה' : 'Workspace Members'}
          </CardTitle>
          {canManageMembers && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {language === 'he' ? 'הזמן חבר' : 'Invite Member'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'he' ? 'הזמן חבר חדש' : 'Invite New Member'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === 'he' ? 'כתובת מייל' : 'Email Address'}</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                   <Label>{language === 'he' ? 'תפקיד' : 'Role'}</Label>
                   <Select value={inviteRole} onValueChange={setInviteRole}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="viewer">
                         <div className="flex items-center gap-2">
                           <Eye className="w-4 h-4" />
                           <div>
                             <p className="font-medium">{language === 'he' ? 'צופה' : 'Viewer'}</p>
                             <p className="text-xs text-gray-500">{language === 'he' ? 'גישה לקריאה בלבד' : 'Read-only access'}</p>
                           </div>
                         </div>
                       </SelectItem>
                       <SelectItem value="member">
                         <div className="flex items-center gap-2">
                           <UserPlus className="w-4 h-4" />
                           <div>
                             <p className="font-medium">{language === 'he' ? 'חבר' : 'Member'}</p>
                             <p className="text-xs text-gray-500">{language === 'he' ? 'יכולת לצפות ולערוך' : 'View and edit'}</p>
                           </div>
                         </div>
                       </SelectItem>
                       <SelectItem value="admin">
                         <div className="flex items-center gap-2">
                           <Shield className="w-4 h-4" />
                           <div>
                             <p className="font-medium">{language === 'he' ? 'מנהל' : 'Admin'}</p>
                             <p className="text-xs text-gray-500">{language === 'he' ? 'ניהול חברים ותוכן' : 'Manage members & content'}</p>
                           </div>
                         </div>
                       </SelectItem>
                     </SelectContent>
                   </Select>
                  </div>
                  <Button onClick={handleInvite} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    {language === 'he' ? 'שלח הזמנה' : 'Send Invitation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500 text-center py-4">
            {language === 'he' ? 'טוען...' : 'Loading...'}
          </p>
        ) : (
          <div className="space-y-3">
            {members.filter(m => m.status !== 'removed').map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {member.invited_email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.invited_email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(member.role)}>
                        <span className="mr-1">{getRoleIcon(member.role)}</span>
                        {member.role}
                      </Badge>
                      {member.status === 'invited' && (
                        <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
                          {language === 'he' ? 'ממתין לאישור' : 'Pending'}
                        </Badge>
                      )}
                      {member.status === 'active' && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                          {language === 'he' ? 'פעיל' : 'Active'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canManageMembers && member.role !== 'owner' && member.user_id !== currentUser?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.status === 'invited' && (
                        <>
                          <DropdownMenuItem onClick={() => resendInviteMutation.mutate(member)}>
                            <RefreshCw className="w-4 h-4 ml-2" />
                            {language === 'he' ? 'שלח הזמנה מחדש' : 'Resend Invitation'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ memberId: member.id, newRole: 'viewer' })}>
                        <Eye className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'שנה לצופה' : 'Change to Viewer'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ memberId: member.id, newRole: 'member' })}>
                        <UserPlus className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'שנה לחבר' : 'Change to Member'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ memberId: member.id, newRole: 'admin' })}>
                        <Shield className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'שנה למנהל' : 'Change to Admin'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => removeMutation.mutate(member.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'הסר מהצוות' : 'Remove from Team'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}