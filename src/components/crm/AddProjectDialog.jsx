import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectTemplates from '@/components/projects/ProjectTemplates';

export default function AddProjectDialog({ open, onClose, onSubmit, isLoading, clients }) {
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    status: 'planning',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: '',
    description: '',
    priority: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>פרויקט חדש</DialogTitle>
            {formData.client_id && (
              <ProjectTemplates 
                clientId={formData.client_id}
                onSelectTemplate={() => onClose()}
              />
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>שם הפרויקט *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>לקוח *</Label>
            <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
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

          <div>
            <Label>סטטוס</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">בתכנון</SelectItem>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="on_hold">בהמתנה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תאריך התחלה</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <Label>תאריך יעד</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>תקציב</Label>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="₪"
            />
          </div>

          <div>
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading || !formData.client_id} className="flex-1">
              {isLoading ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}