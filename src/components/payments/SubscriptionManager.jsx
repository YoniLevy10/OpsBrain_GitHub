import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Pause, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import AddSubscriptionDialog from './AddSubscriptionDialog';

export default function SubscriptionManager({ clientId }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', clientId],
    queryFn: () => clientId 
      ? base44.entities.Subscription.filter({ client_id: clientId })
      : base44.entities.Subscription.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('המנוי עודכן בהצלחה');
    }
  });

  const statusConfig = {
    active: { label: 'פעיל', color: 'bg-green-100 text-green-800', icon: Play },
    paused: { label: 'מושהה', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
    cancelled: { label: 'בוטל', color: 'bg-gray-100 text-gray-800', icon: X },
    past_due: { label: 'באיחור', color: 'bg-red-100 text-red-800', icon: RefreshCw }
  };

  const toggleStatus = (subscription) => {
    const newStatus = subscription.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({
      id: subscription.id,
      data: { ...subscription, status: newStatus }
    });
  };

  if (isLoading) {
    return <div className="text-center p-8">טוען מנויים...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">מנויים חוזרים</h2>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          מנוי חדש
        </Button>
      </div>

      <div className="grid gap-4">
        {subscriptions.map(sub => {
          const config = statusConfig[sub.status];
          const Icon = config.icon;
          
          return (
            <Card key={sub.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{sub.plan_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      ₪{sub.amount} / {sub.billing_frequency === 'monthly' ? 'חודש' : sub.billing_frequency === 'yearly' ? 'שנה' : 'רבעון'}
                    </p>
                  </div>
                  <Badge className={config.color}>
                    <Icon className="w-3 h-3 ml-1" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-600">חיוב הבא: {sub.next_billing_date || 'לא הוגדר'}</p>
                    <p className="text-gray-600">MRR: ₪{sub.mrr || sub.amount}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(sub)}
                      disabled={updateMutation.isPending}
                    >
                      {sub.status === 'active' ? 'השהה' : 'הפעל'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {subscriptions.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין מנויים פעילים</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddSubscriptionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        clientId={clientId}
      />
    </div>
  );
}