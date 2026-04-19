import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';

export default function VoiceAssistantHero() {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'he-IL';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        await getAIResponse(text);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          toast.error('לא זיהיתי דיבור, נסה שוב');
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const getAIResponse = async (userText) => {
    try {
      setIsSpeaking(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const [user, businesses, clients, projects, tasks, transactions] = await Promise.all([
        opsbrain.auth.me().catch(() => null),
        opsbrain.entities.Business.list().catch(() => []),
        opsbrain.entities.Client.list().catch(() => []),
        opsbrain.entities.Project.list().catch(() => []),
        opsbrain.entities.Task.filter({ status: 'open' }).catch(() => []),
        opsbrain.entities.Transaction.list('-date', 10).catch(() => [])
      ]);

      const business = businesses[0];
      const contextInfo = `
      עסק: ${business?.business_name || 'לא הוגדר'}
      תחום: ${business?.industry || 'לא ידוע'}
      לקוחות: ${clients.length}
      פרויקטים: ${projects.filter(p => p.status === 'active').length}
      משימות פתוחות: ${tasks.length}
      `;
      
      const result = await opsbrain.integrations.Core.InvokeLLM({
        prompt: `אתה מזכירה AI בשם OpsBrain. המשתמש אמר: "${userText}". 
        נתוני העסק: ${contextInfo}
        תני תשובה קצרה ומדויקת (2-3 משפטים), דברי בגוף ראשון וטבעי.`,
        add_context_from_internet: false
      });

      const aiResponse = result.response || result;
      setResponse(aiResponse);
      speakText(aiResponse);
      
    } catch (error) {
      toast.error('שגיאה בקבלת תשובה');
      setIsSpeaking(false);
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) {
      setIsSpeaking(false);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('דפדפן זה לא תומך בזיהוי קול');
      return;
    }

    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    
    setTranscript('');
    setResponse('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur rounded-full mb-6 shadow-xl">
            {isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="font-bold text-4xl mb-3">
            {language === 'he' ? 'העוזר החכם שלך 🎯' : 'Your Smart Assistant 🎯'}
          </h2>
          <p className="text-white/90 text-xl max-w-2xl mx-auto">
            {language === 'he' 
              ? 'דבר איתי על הכל - משימות, לקוחות, פיננסים. אני כאן בשבילך תמיד'
              : 'Talk to me about everything - tasks, clients, finances. I\'m always here for you'
            }
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl relative ${
              isListening
                ? 'bg-white/30 backdrop-blur animate-pulse scale-110'
                : isSpeaking
                ? 'bg-white/20 backdrop-blur cursor-not-allowed'
                : 'bg-white/30 backdrop-blur hover:bg-white/40 hover:scale-110'
            }`}
          >
            {isListening && (
              <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" />
            )}
            {isListening ? (
              <Volume2 className="w-16 h-16 text-white relative z-10" />
            ) : isSpeaking ? (
              <Loader2 className="w-16 h-16 text-white animate-spin relative z-10" />
            ) : (
              <Mic className="w-16 h-16 text-white relative z-10" />
            )}
          </button>

          <div className="space-y-2 text-center">
            {isListening && (
              <p className="text-xl font-semibold text-white animate-pulse">
                {language === 'he' ? '🎤 מאזין לך...' : '🎤 Listening...'}
              </p>
            )}
            {isSpeaking && (
              <p className="text-xl font-semibold text-white animate-pulse">
                {language === 'he' ? '🔊 עונה לך...' : '🔊 Speaking...'}
              </p>
            )}
            {!isListening && !isSpeaking && (
              <p className="text-lg text-white/80">
                {language === 'he' ? 'לחץ על המיקרופון ודבר איתי' : 'Click the microphone and talk to me'}
              </p>
            )}
          </div>

          {transcript && (
            <div className="w-full max-w-2xl p-6 bg-white/95 backdrop-blur rounded-2xl shadow-xl">
              <p className="text-sm text-gray-500 mb-2 font-medium">
                {language === 'he' ? 'אתה שאלת:' : 'You asked:'}
              </p>
              <p className="font-semibold text-gray-900 text-lg">{transcript}</p>
            </div>
          )}

          {response && (
            <div className="w-full max-w-2xl p-6 bg-white/95 backdrop-blur rounded-2xl shadow-xl">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-purple-600 font-medium">
                  {language === 'he' ? 'התשובה שלי:' : 'My answer:'}
                </p>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <VolumeX className="w-4 h-4" />
                    {language === 'he' ? 'עצור' : 'Stop'}
                  </button>
                )}
              </div>
              <p className="text-gray-900 leading-relaxed text-lg chat-message">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}