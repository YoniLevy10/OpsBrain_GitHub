import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, FileText, Briefcase, MessageSquare, DollarSign, Target, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import LeadScoring from '@/components/crm/LeadScoring';
import ClientHealthScore from '@/components/ai/ClientHealthScore';

export default function ClientDetailView({ client, open, onClose }) {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', client?.id],
    queryFn: () => opsbrain.entities.Project.filter({ client_id: client.id }),
    enabled: !!client
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', client?.id],
    queryFn: () => opsbrain.entities.Invoice.filter({ client_id: client.id }),
    enabled: !!client
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', client?.id],
    queryFn: () => opsbrain.entities.Interaction.filter({ client_id: client.id }),
    enabled: !!client
  });

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{client.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {client.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{client.company}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{client.phone}</span>
                    </div>
                  )}
                  {client.industry && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{client.industry}</span>
                    </div>
                  )}
                </div>
                {client.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">פרויקטים</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">חשבוניות</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">הכנסות</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">₪{client.total_revenue?.toLocaleString() || 0}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="projects">פרויקטים</TabsTrigger>
                <TabsTrigger value="invoices">חשבוניות</TabsTrigger>
                <TabsTrigger value="interactions">אינטראקציות</TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-3 mt-4">
                {projects.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">אין פרויקטים</p>
                ) : (
                  projects.map(project => (
                    <Card key={project.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{project.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-700">{project.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="invoices" className="space-y-3 mt-4">
                {invoices.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">אין חשבוניות</p>
                ) : (
                  invoices.map(invoice => (
                    <Card key={invoice.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">#{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(invoice.issue_date).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">₪{invoice.total_amount?.toLocaleString()}</p>
                            <Badge className="mt-1">{invoice.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="interactions" className="space-y-3 mt-4">
                {interactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">אין אינטראקציות</p>
                ) : (
                  interactions.map(interaction => (
                    <Card key={interaction.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <Badge className="bg-gray-100 text-gray-700">{interaction.type}</Badge>
                              <span className="text-sm text-gray-500">
                                {format(new Date(interaction.date), 'dd MMM yyyy', { locale: he })}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">{interaction.summary}</p>
                            {interaction.notes && (
                              <p className="text-sm text-gray-600 mt-2">{interaction.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="scoring" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scoring" className="text-xs">
                  <Target className="w-3 h-3 ml-1" />
                  ניקוד
                </TabsTrigger>
                <TabsTrigger value="health" className="text-xs">
                  <Activity className="w-3 h-3 ml-1" />
                  בריאות
                </TabsTrigger>
              </TabsList>
              <TabsContent value="scoring" className="mt-4">
                <LeadScoring 
                  client={client} 
                  interactions={interactions}
                  projects={projects}
                />
              </TabsContent>
              <TabsContent value="health" className="mt-4">
                <ClientHealthScore client={client} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}