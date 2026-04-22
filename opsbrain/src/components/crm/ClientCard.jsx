import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import LeadScoring from './LeadScoring';
import ClientHealthScore from '../ai/ClientHealthScore';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';

export default function ClientCard({ client, onDelete }) {
  const statusColors = {
    lead: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    lead: 'ליד',
    active: 'פעיל',
    inactive: 'לא פעיל',
    archived: 'בארכיון'
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`למחוק את ${client.name}?`)) return;
    
    try {
      await opsbrain.entities.Client.delete(client.id);
      toast.success('לקוח נמחק');
      onDelete?.();
    } catch (error) {
      toast.error('שגיאה במחיקת לקוח');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow group relative">
      <CardContent className="p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{client.name}</h3>
            {client.company && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {client.company}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusColors[client.status]}>
              {statusLabels[client.status]}
            </Badge>
            <LeadScoring client={client} />
            <ClientHealthScore client={client} />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {client.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.last_contact && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Calendar className="w-3 h-3" />
              <span>
                קשר אחרון: {format(new Date(client.last_contact), 'dd MMM', { locale: he })}
              </span>
            </div>
          )}
        </div>

        {client.total_revenue > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">סה״כ הכנסות</p>
            <p className="text-lg font-bold text-green-600">₪{client.total_revenue.toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}