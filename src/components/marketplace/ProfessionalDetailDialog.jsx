import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Briefcase, Award, MessageSquare, Mail, Phone, CheckCircle, Send } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';

export default function ProfessionalDetailDialog({ professional, open, onClose }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', professional?.id],
    queryFn: async () => {
      if (!professional) return [];
      return await base44.entities.Review.filter({ professional_id: professional.id }, '-created_date');
    },
    enabled: !!professional
  });

  const startChatMutation = useMutation({
    mutationFn: async () => {
      // בדוק אם כבר קיים צ'אט
      const existingChats = await base44.entities.ProfessionalChat.filter({
        workspace_id: activeWorkspace.id,
        professional_id: professional.id
      });

      if (existingChats.length > 0) {
        return existingChats[0];
      }

      // צור צ'אט חדש
      const chat = await base44.entities.ProfessionalChat.create({
        workspace_id: activeWorkspace.id,
        professional_id: professional.id,
        status: 'active',
        last_message_at: new Date().toISOString()
      });

      // שלח הודעה ראשונה
      if (message) {
        await base44.entities.ChatMessage.create({
          chat_id: chat.id,
          sender_type: 'workspace',
          sender_name: activeWorkspace.name,
          message,
          is_read: false
        });
      }

      return chat;
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries(['professional-chats']);
      toast.success(language === 'he' ? 'שיחה נפתחה בהצלחה' : 'Chat opened successfully');
      window.location.href = `/ProfessionalChat?chatId=${chat.id}`;
    }
  });

  const handleContactClick = () => {
    if (!message) {
      toast.error(language === 'he' ? 'נא לכתוב הודעה' : 'Please write a message');
      return;
    }
    startChatMutation.mutate();
  };

  if (!professional) return null;

  const averageAspects = reviews.length > 0 ? {
    professionalism: reviews.reduce((sum, r) => sum + (r.aspects?.professionalism || 0), 0) / reviews.length,
    communication: reviews.reduce((sum, r) => sum + (r.aspects?.communication || 0), 0) / reviews.length,
    quality: reviews.reduce((sum, r) => sum + (r.aspects?.quality || 0), 0) / reviews.length,
    timeliness: reviews.reduce((sum, r) => sum + (r.aspects?.timeliness || 0), 0) / reviews.length,
  } : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
              {professional.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <DialogTitle className="text-2xl">{professional.name}</DialogTitle>
                {professional.is_verified && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-600 mb-2">{professional.specialty}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{professional.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-sm text-gray-500">({professional.reviews_count || 0} {language === 'he' ? 'ביקורות' : 'reviews'})</span>
                </div>
                <Badge className={
                  professional.availability === 'available' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }>
                  {professional.availability === 'available' && (language === 'he' ? 'זמין' : 'Available')}
                  {professional.availability === 'busy' && (language === 'he' ? 'עסוק' : 'Busy')}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{language === 'he' ? 'סקירה' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="reviews">{language === 'he' ? 'ביקורות' : 'Reviews'}</TabsTrigger>
            <TabsTrigger value="contact">{language === 'he' ? 'צור קשר' : 'Contact'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {professional.bio && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{language === 'he' ? 'אודות' : 'About'}</h3>
                  <p className="text-gray-600">{professional.bio}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{language === 'he' ? 'פרטים' : 'Details'}</h3>
                <div className="space-y-2">
                  {professional.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{professional.location}</span>
                    </div>
                  )}
                  {professional.years_experience && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{professional.years_experience} {language === 'he' ? 'שנות ניסיון' : 'years experience'}</span>
                    </div>
                  )}
                  {professional.completed_projects > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>{professional.completed_projects} {language === 'he' ? 'פרויקטים הושלמו' : 'projects completed'}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {professional.skills && professional.skills.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">{language === 'he' ? 'מיומנויות' : 'Skills'}</h3>
                  <div className="flex flex-wrap gap-2">
                    {professional.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {professional.certifications && professional.certifications.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">{language === 'he' ? 'הסמכות' : 'Certifications'}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {professional.certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {averageAspects && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">{language === 'he' ? 'דירוג לפי קטגוריות' : 'Rating Breakdown'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{language === 'he' ? 'מקצועיות' : 'Professionalism'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{averageAspects.professionalism.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{language === 'he' ? 'תקשורת' : 'Communication'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{averageAspects.communication.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{language === 'he' ? 'איכות' : 'Quality'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{averageAspects.quality.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{language === 'he' ? 'עמידה בזמנים' : 'Timeliness'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{averageAspects.timeliness.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.reviewer_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                    </p>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold mb-1">{review.title}</h4>
                  )}
                  <p className="text-gray-600">{review.comment}</p>
                  {review.would_recommend && (
                    <Badge className="mt-2 bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      {language === 'he' ? 'ממליץ' : 'Recommends'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}

            {reviews.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <p>{language === 'he' ? 'אין ביקורות עדיין' : 'No reviews yet'}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{language === 'he' ? 'פרטי קשר' : 'Contact Information'}</h3>
                <div className="space-y-2">
                  {professional.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{professional.email}</span>
                    </div>
                  )}
                  {professional.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{professional.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{language === 'he' ? 'שלח הודעה' : 'Send Message'}</h3>
                <Textarea
                  placeholder={language === 'he' ? 'כתוב את ההודעה שלך כאן...' : 'Write your message here...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="mb-3"
                />
                <Button 
                  onClick={handleContactClick}
                  disabled={startChatMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4 ml-2" />
                  {language === 'he' ? 'שלח הודעה ופתח שיחה' : 'Send Message & Open Chat'}
                </Button>
              </CardContent>
            </Card>

            {professional.hourly_rate && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{language === 'he' ? 'תמחור' : 'Pricing'}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ₪{professional.hourly_rate}
                    <span className="text-base text-gray-600">/{language === 'he' ? 'שעה' : 'hour'}</span>
                  </p>
                  {professional.min_rate && professional.max_rate && (
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'he' ? 'טווח:' : 'Range:'} ₪{professional.min_rate} - ₪{professional.max_rate}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}