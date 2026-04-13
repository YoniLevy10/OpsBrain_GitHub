import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddClientDialog({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    industry: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>לקוח חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client-name">שם *</Label>
            <Input
              id="client-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              aria-required="true"
            />
          </div>

          <div>
            <Label htmlFor="client-email">אימייל</Label>
            <Input
              id="client-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="client-phone">טלפון</Label>
            <Input
              id="client-phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="client-company">חברה</Label>
            <Input
              id="client-company"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="client-status">סטטוס</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
              <SelectTrigger id="client-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">ליד</SelectItem>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="inactive">לא פעיל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client-industry">תחום עיסוק</Label>
            <Input
              id="client-industry"
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="client-notes">הערות</Label>
            <Textarea
              id="client-notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1" aria-live="polite">
              {isLoading ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}