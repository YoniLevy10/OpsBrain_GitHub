import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus, X, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Import all widget components
import QuickStats from './QuickStats';
import TasksList from './TasksList';
import RecentSummary from './RecentSummary';
import CashFlowForecast from '../ai/CashFlowForecast';
import ProactiveInsights from '../ai/ProactiveInsights';
import SmartReminders from '../tasks/SmartReminders';

const availableWidgets = [
  { id: 'quick-stats', name: 'סטטיסטיקות מהירות', component: QuickStats, category: 'overview' },
  { id: 'tasks', name: 'משימות', component: TasksList, category: 'productivity' },
  { id: 'recent-summary', name: 'סיכום יומי אחרון', component: RecentSummary, category: 'overview' },
  { id: 'cash-flow', name: 'תחזית תזרים', component: CashFlowForecast, category: 'finance' },
  { id: 'insights', name: 'תובנות AI', component: ProactiveInsights, category: 'ai' },
  { id: 'reminders', name: 'תזכורות חכמות', component: SmartReminders, category: 'productivity' }
];

export default function PersonalizedDashboard({ business, user }) {
  const [widgets, setWidgets] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  useEffect(() => {
    loadUserConfig();
  }, [user]);

  const loadUserConfig = async () => {
    try {
      const configs = await base44.entities.DashboardConfig.filter({
        user_email: user.email
      });

      if (configs.length > 0) {
        const config = configs[0];
        setWidgets(config.widgets || []);
        setSelectedWidgets(config.widgets?.map(w => w.id) || []);
      } else {
        // Default widgets
        const defaultWidgets = ['quick-stats', 'tasks', 'insights'];
        setWidgets(defaultWidgets.map((id, index) => ({ id, position: index })));
        setSelectedWidgets(defaultWidgets);
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error);
    }
  };

  const saveUserConfig = async (newWidgets) => {
    try {
      const configs = await base44.entities.DashboardConfig.filter({
        user_email: user.email
      });

      const configData = {
        user_email: user.email,
        widgets: newWidgets,
        layout: 'grid'
      };

      if (configs.length > 0) {
        await base44.entities.DashboardConfig.update(configs[0].id, configData);
      } else {
        await base44.entities.DashboardConfig.create(configData);
      }
    } catch (error) {
      console.error('Error saving dashboard config:', error);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedWidgets = items.map((item, index) => ({ ...item, position: index }));
    setWidgets(updatedWidgets);
    saveUserConfig(updatedWidgets);
  };

  const toggleWidget = (widgetId) => {
    const isSelected = selectedWidgets.includes(widgetId);
    
    if (isSelected) {
      const newSelected = selectedWidgets.filter(id => id !== widgetId);
      const newWidgets = widgets.filter(w => w.id !== widgetId);
      setSelectedWidgets(newSelected);
      setWidgets(newWidgets);
      saveUserConfig(newWidgets);
    } else {
      const newSelected = [...selectedWidgets, widgetId];
      const newWidgets = [...widgets, { id: widgetId, position: widgets.length }];
      setSelectedWidgets(newSelected);
      setWidgets(newWidgets);
      saveUserConfig(newWidgets);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">לוח הבקרה שלי</h2>
        <Button variant="outline" onClick={() => setConfigOpen(true)}>
          <Settings className="w-4 h-4 ml-2" />
          התאם אישית
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid md:grid-cols-2 gap-6"
            >
              {widgets.map((widget, index) => {
                const widgetDef = availableWidgets.find(w => w.id === widget.id);
                if (!widgetDef) return null;

                const WidgetComponent = widgetDef.component;

                return (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                      >
                        <Card className="relative group">
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                          >
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          <WidgetComponent business={business} />
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>התאמה אישית של לוח הבקרה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              בחר את הווידג'טים שתרצה להציג בלוח הבקרה שלך
            </p>
            {availableWidgets.map((widget) => (
              <div key={widget.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={widget.id}
                  checked={selectedWidgets.includes(widget.id)}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={widget.id} className="flex-1 cursor-pointer">
                  {widget.name}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}