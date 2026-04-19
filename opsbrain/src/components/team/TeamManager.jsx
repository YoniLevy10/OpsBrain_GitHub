import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, Mail, Trash2, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';

export default function TeamManager() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.WorkspaceMember.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      return opsbrain.entities.WorkspaceMember.create({
        workspace_id: activeWorkspace.id,
        invited_email: data.email,
        role: data.role,
        status: 'invited',
        invited_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members']);
      setShowInviteDialog(false);
      setInviteEmail('');
      toast.success(language === 'he' ? 'הזמנה נשלחה בהצלחה' : 'Invitation sent successfully');
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה בשליחת הזמנה' : 'Error sending invitation');
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId) => {
      return opsbrain.entities.WorkspaceMember.update(memberId, {
        status: 'removed',
        removed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members']);
      toast.success(language === 'he' ? 'חבר צוות הוסר' : 'Team member removed');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }) => {
      return opsbrain.entities.WorkspaceMember.update(memberId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-members']);
      toast.success(language === 'he' ? 'תפקיד עודכן' : 'Role updated');
    }
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error(language === 'he' ? 'נא להזין אימייל' : 'Please enter email');
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const invitedMembers = members.filter(m => m.status === 'invited');
  const removedMembers = members.filter(m => m.status === 'removed');

  const getRoleBadge = (role) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-700 border-purple-200',
      admin: 'bg-blue-100 text-blue-700 border-blue-200',
      member: 'bg-green-100 text-green-700 border-green-200',
      viewer: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    const labels = {
      owner: language === 'he' ? 'בעלים' : 'Owner',
      admin: language === 'he' ? 'מנהל' : 'Admin',
      member: language === 'he' ? 'חבר' : 'Member',
      viewer: language === 'he' ? 'צופה' : 'Viewer'
    };
    return (
      <Badge className={colors[role]}>
        <Shield className="w-3 h-3 ml-1" />
        {labels[role]}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 ml-1" />
          {language === 'he' ? 'פעיל' : 'Active'}
        </Badge>
      );
    }
    if (status === 'invited') {
      return (
        <Badge className="bg-orange-100 text-orange-700">
          <Clock className="w-3 h-3 ml-1" />
          {language === 'he' ? 'ממתין' : 'Pending'}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700">
        <XCircle className="w-3 h-3 ml-1" />
        {language === 'he' ? 'הוסר' : 'Removed'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle>{language === 'he' ? 'ניהול צוות' : 'Team Management'}</CardTitle>
            </div>
            <Button onClick={() => setShowInviteDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 ml-2" />
              {language === 'he' ? 'הזמן חבר צוות' : 'Invite Team Member'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* סטטיסטיקה */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{activeMembers.length}</p>
                <p className="text-sm text-green-600">{language === 'he' ? 'חברים פעילים' : 'Active Members'}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-100">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">{invitedMembers.length}</p>
                <p className="text-sm text-orange-600">{language === 'he' ? 'הזמנות ממתינות' : 'Pending Invites'}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{members.length}</p>
                <p className="text-sm text-blue-600">{language === 'he' ? 'סה"כ' : 'Total'}</p>
              </CardContent>
            </Card>
          </div>

          {/* רשימת חברים */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'he' ? 'חברי צוות' : 'Team Members'}
            </h3>
            {members.filter(m => m.status !== 'removed').map(member => (
              <Card key={member.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.invited_email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.invited_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(member.role)}
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role !== 'owner' && (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{language === 'he' ? 'מנהל' : 'Admin'}</SelectItem>
                              <SelectItem value="member">{language === 'he' ? 'חבר' : 'Member'}</SelectItem>
                              <SelectItem value="viewer">{language === 'he' ? 'צופה' : 'Viewer'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMutation.mutate(member.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* דיאלוג הזמנה */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'he' ? 'הזמן חבר צוות חדש' : 'Invite New Team Member'}</DialogTitle>
            <DialogDescription>
              {language === 'he' 
                ? 'הזן את כתובת האימייל של האדם שברצונך להזמין למרחב העבודה' 
                : 'Enter the email address of the person you want to invite to the workspace'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{language === 'he' ? 'כתובת אימייל' : 'Email Address'}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{language === 'he' ? 'תפקיד' : 'Role'}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{language === 'he' ? 'מנהל' : 'Admin'}</SelectItem>
                  <SelectItem value="member">{language === 'he' ? 'חבר צוות' : 'Member'}</SelectItem>
                  <SelectItem value="viewer">{language === 'he' ? 'צופה' : 'Viewer'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleInvite} 
                disabled={inviteMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 ml-2" />
                {language === 'he' ? 'שלח הזמנה' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}