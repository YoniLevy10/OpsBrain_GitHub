import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, Clock } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import moment from 'moment';

export default function WhatsAppWidget() {
  const { language } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // טוען את השיחות מה-agent
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const allConvs = await base44.agents.listConversations({ agent_name: 'opsbrain' });
      // מסנן רק שיחות WhatsApp
      return allConvs.filter(conv => conv.metadata?.channel === 'whatsapp').slice(0, 5);
    },
    enabled: !!user,
    refetchInterval: 30000 // רענון כל 30 שניות
  });

  const handleWhatsAppClick = () => {
    const whatsappURL = base44.agents.getWhatsAppConnectURL('opsbrain');
    window.open(whatsappURL, '_blank');
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-600 to-emerald-700 text-white h-[320px] flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            WhatsApp
          </CardTitle>
          <Button 
            size="sm"
            onClick={handleWhatsAppClick}
            className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-7 px-3"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            {language === 'he' ? 'פתח' : 'Open'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col justify-between px-4 pb-4">
        {conversations.length > 0 ? (
          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.map((conv) => {
              const lastMessage = conv.messages?.[conv.messages.length - 1];
              const preview = lastMessage?.content?.substring(0, 55) || '';
              return (
                <div 
                  key={conv.id}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
                  onClick={handleWhatsAppClick}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-medium line-clamp-1">
                      {conv.metadata?.name || (language === 'he' ? 'שיחה' : 'Chat')}
                    </p>
                    <span className="text-xs text-white/60 whitespace-nowrap">
                      {moment(conv.updated_date).fromNow()}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-1">{preview || '...'}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">
                {language === 'he' ? 'עוזר AI בWhatsApp' : 'AI Assistant on WhatsApp'}
              </p>
              <p className="text-xs text-white/70">
                {language === 'he' ? 'נהל משימות, לקוחות ועוד ישירות מהנייד' : 'Manage tasks, clients and more from your phone'}
              </p>
            </div>
            <Button 
              onClick={handleWhatsAppClick}
              className="bg-white text-green-700 hover:bg-white/90 font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'he' ? 'התחבר עכשיו' : 'Connect Now'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}