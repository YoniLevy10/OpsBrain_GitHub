import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const COLORS = [
  { value: 'blue', label: 'כחול', bg: 'bg-blue-500' },
  { value: 'green', label: 'ירוק', bg: 'bg-green-500' },
  { value: 'purple', label: 'סגול', bg: 'bg-purple-500' },
  { value: 'orange', label: 'כתום', bg: 'bg-orange-500' },
  { value: 'red', label: 'אדום', bg: 'bg-red-500' },
  { value: 'pink', label: 'ורוד', bg: 'bg-pink-500' },
  { value: 'yellow', label: 'צהוב', bg: 'bg-yellow-500' },
  { value: 'gray', label: 'אפור', bg: 'bg-gray-500' },
];

export default function AddFolderDialog({ open, onClose, onSubmit, isLoading, parentFolderId }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, color, description, parent_folder_id: parentFolderId || undefined });
    setName('');
    setDescription('');
    setColor('blue');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{parentFolderId ? 'תיקיית משנה חדשה' : 'תיקייה חדשה'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>שם התיקייה *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: לקוחות 2024, בניין הרצל 5..."
              autoFocus
              required
            />
          </div>
          <div>
            <Label>תיאור (אופציונלי)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מה יש בתיקייה הזאת?"
            />
          </div>
          <div>
            <Label className="mb-2 block">צבע</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    c.bg,
                    color === c.value ? "ring-2 ring-offset-2 ring-gray-900 scale-110" : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
            <Button type="submit" disabled={isLoading || !name.trim()} className="flex-1">
              {isLoading ? 'שומר...' : 'צור תיקייה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}