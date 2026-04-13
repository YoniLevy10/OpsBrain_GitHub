import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AddSubscriptionDialog({ open, onClose, clientId }) {
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    plan_name: 'monthly',
    amount: '',
    billing_frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    auto_renew: true
  });

  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !clientId
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const mrr = data.billing_frequency === 'monthly' ? data.amount :
                  data.billing_frequency === 'yearly' ? data.amount / 12 :
                  data.amount / 3;
      
      return base44.entities.Subscription.create({
        ...data,
        mrr,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('מנוי נוסף בהצלחה');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>מנוי חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!clientId && (
            <div>
              <Label>לקוח</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>שם התוכנית</Label>
            <Input
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              placeholder="למשל: תוכנית פרימיום"
              required
            />
          </div>

          <div>
            <Label>סכום</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              placeholder="0"
              required
            />
          </div>

          <div>
            <Label>תדירות חיוב</Label>
            <Select
              value={formData.billing_frequency}
              onValueChange={(value) => setFormData({ ...formData, billing_frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">חודשי</SelectItem>
                <SelectItem value="quarterly">רבעוני</SelectItem>
                <SelectItem value="yearly">שנתי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>תאריך התחלה</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'שומר...' : 'שמור מנוי'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}