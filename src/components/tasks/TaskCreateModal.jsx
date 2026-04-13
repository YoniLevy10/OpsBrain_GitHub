import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function TaskCreateModal({
  open,
  onOpenChange,
  onSubmit,
  editingTask,
  projects,
  teamMembers,
  isLoading,
  language
}) {
  const isRTL = language === 'he';
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    project_id: '',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        status: editingTask.status || 'open',
        project_id: editingTask.project_id || '',
        assigned_to: editingTask.assigned_to || '',
        due_date: editingTask.due_date ? editingTask.due_date.split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'open',
        project_id: '',
        assigned_to: '',
        due_date: ''
      });
    }
  }, [editingTask, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert(language === 'he' ? 'כותרת נדרשת' : 'Title is required');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {editingTask
              ? (language === 'he' ? 'עדכן משימה' : 'Edit Task')
              : (language === 'he' ? 'משימה חדשה' : 'New Task')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {language === 'he' ? 'כותרת' : 'Title'} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={language === 'he' ? 'כותרת המשימה' : 'Task title'}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {language === 'he' ? 'תיאור' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={language === 'he' ? 'פרטים נוספים...' : 'Additional details...'}
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              {language === 'he' ? 'סטטוס' : 'Status'}
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{language === 'he' ? 'פתוח' : 'Open'}</SelectItem>
                <SelectItem value="in_progress">{language === 'he' ? 'בעבודה' : 'In Progress'}</SelectItem>
                <SelectItem value="completed">{language === 'he' ? 'הושלם' : 'Completed'}</SelectItem>
                <SelectItem value="on_hold">{language === 'he' ? 'עצור' : 'On Hold'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project">
              {language === 'he' ? 'פרויקט (אופציונלי)' : 'Project (Optional)'}
            </Label>
            <Select value={formData.project_id} onValueChange={(value) => handleChange('project_id', value)}>
              <SelectTrigger id="project">
                <SelectValue placeholder={language === 'he' ? 'בחר פרויקט' : 'Select project'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{language === 'he' ? 'ללא פרויקט' : 'No project'}</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned">
              {language === 'he' ? 'הוקצה ל (אופציונלי)' : 'Assigned To (Optional)'}
            </Label>
            <Select value={formData.assigned_to} onValueChange={(value) => handleChange('assigned_to', value)}>
              <SelectTrigger id="assigned">
                <SelectValue placeholder={language === 'he' ? 'בחר אדם' : 'Select person'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{language === 'he' ? 'לא הוקצה' : 'Unassigned'}</SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.user?.full_name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="duedate">
              {language === 'he' ? 'תאריך יעד (אופציונלי)' : 'Due Date (Optional)'}
            </Label>
            <Input
              id="duedate"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? (language === 'he' ? 'שומר...' : 'Saving...')
                : (editingTask
                  ? (language === 'he' ? 'עדכן' : 'Update')
                  : (language === 'he' ? 'צור' : 'Create')
                )
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
