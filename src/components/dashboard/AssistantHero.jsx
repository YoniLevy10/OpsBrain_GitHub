import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Brain, Mic, MicOff, Send, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MessageBubble from '@/components/chat/MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = {
  he: [
    "מה מצב הכסף שלי החודש?",
    "אילו לקוחות לא שילמו?",
    "מה המשימות הדחופות שלי?",
    "צור חשבונית חדשה"
  ],
  en: [
    "How's my cash flow this month?",
    "Which clients haven't paid?",
    "What are my urgent tasks?",
    "Create a new invoice"
  ]
};

export default function AssistantHero() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [transcript, setTranscript] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const isRTL = language === 'he';

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded]);

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    // activeWorkspace מגיע מה-context ותמיד אמור להיות קיים בדשבורד
    const workspaceId = activeWorkspace?.id;
    const conv = await base44.agents.createConversation({
      agent_name: 'opsbrain',
      metadata: { 
        name: `Dashboard - ${new Date().toLocaleDateString()}`, 
        workspace_id: workspaceId,
        source: 'dashboard'
      }
    });
    setConversationId(conv.id);
    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
      const stillLoading = data.messages?.some(m =>
        m.role === 'assistant' && m.tool_calls?.some(tc =>
          tc.status === 'running' || tc.status === 'in_progress'
        )
      );
      setIsLoading(!!stillLoading);
    });
    return conv.id;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setInput('');
    setExpanded(true);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    // שלח workspace_id כחלק מההודעה כדי שה-agent תמיד יקבל אותו
    const messageContent = activeWorkspace?.id
      ? `[workspace_id: ${activeWorkspace.id}]\n${text}`
      : text;
    const cId = await ensureConversation();
    const conv = await base44.agents.getConversation(cId);
    await base44.agents.addMessage(conv, { role: 'user', content: messageContent });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isRTL ? 'הדפדפן שלך לא תומך בזיהוי קול' : 'Your browser does not support voice recognition');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = isRTL ? 'he-IL' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setTranscript('');
        sendMessage(t);
        setIsListening(false);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript('');
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            {isListening && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">
              {isRTL ? 'העוזר האישי שלך' : 'Your AI Assistant'}
            </h2>
            <p className="text-white/60 text-xs">
              {isRTL ? 'שאל בקול או בכתב - אני כאן בשבילך' : 'Ask by voice or text - I\'m here for you'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/40" />
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl('Chat'))}
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs gap-1"
            >
              {isRTL ? 'לצ\'אט המלא' : 'Full Chat'}
              <ArrowLeft className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <AnimatePresence>
        {expanded && messages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-h-72 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2 items-center text-gray-400 text-sm">
                <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-white">
        {transcript && (
          <div className="mb-3 px-4 py-2 bg-blue-50 rounded-xl text-sm text-blue-700 flex items-center gap-2">
            <Mic className="w-4 h-4 animate-pulse" />
            {transcript}
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2 focus-within:border-gray-400 focus-within:shadow-sm transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRTL ? 'שאל אותי כל דבר...' : 'Ask me anything...'}
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
            dir={isRTL ? 'rtl' : 'ltr'}
            disabled={isLoading}
          />
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-all ${
              isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {!expanded && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTIONS[language]?.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}