import React, { useState } from 'react';
import { Bot, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';

/**
 * כפתור צף לפתיחת צ'אט עם סוכן ספציפי
 * @param {string} agentName - שם הסוכן (financial_assistant, client_manager וכו')
 * @param {string} agentTitle - כותרת הסוכן לתצוגה
 * @param {string} initialMessage - הודעה ראשונית אופציונלית
 */
export default function FloatingAgentButton({ agentName, agentTitle, initialMessage }) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleClick = () => {
    // ניתוב לצ'אט עם prefill של הסוכן
    const message = initialMessage || `שלח לסוכן ${agentTitle}`;
    navigate(createPageUrl('Chat') + '?agent=' + encodeURIComponent(agentName) + '&prefill=' + encodeURIComponent(message));
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-24 left-6 lg:bottom-6 z-40 rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-110 transition-transform"
      title={language === 'he' ? `דבר עם ${agentTitle}` : `Talk to ${agentTitle}`}
    >
      <Bot className="w-6 h-6 text-white" />
    </Button>
  );
}