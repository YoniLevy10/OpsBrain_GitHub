import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddWorkspaceDialog({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    members: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>מרחב עבודה חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>שם *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>סוג</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">כללי</SelectItem>
                <SelectItem value="project">פרויקט</SelectItem>
                <SelectItem value="client">לקוח</SelectItem>
                <SelectItem value="professional">בעל מקצוע</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="על מה מרחב העבודה הזה..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'יוצר...' : 'צור'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}