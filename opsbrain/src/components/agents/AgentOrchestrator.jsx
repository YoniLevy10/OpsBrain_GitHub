import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { opsbrain } from '@/api/client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Zap, Users, ArrowRight, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AgentOrchestrator() {
  const { activeWorkspace } = useWorkspace();
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleExecute = async () => {
    if (!task.trim()) {
      toast.error('אנא כתוב משימה');
      return;
    }

    setLoading(true);
    try {
      const response = await opsbrain.functions.invoke('agentOrchestrator', {
        task,
        context: {
          workspace_id: activeWorkspace?.id,
          timestamp: new Date().toISOString()
        },
        workspace_id: activeWorkspace?.id
      });

      setResult(response);
      toast.success('המשימה הופעלה בהצלחה!');
    } catch (error) {
      console.error('Orchestration error:', error);
      toast.error('שגיאה בהפעלת המשימה');
    } finally {
      setLoading(false);
    }
  };

  const agentIcons = {
    opsbrain: '🧠',
    client_manager: '👥',
    project_manager: '📋',
    document_manager: '📁',
    invoice_specialist: '💰',
    financial_assistant: '💵',
    analytics_specialist: '📊',
    automation_manager: '🤖',
    calendar_assistant: '📅',
    marketing_assistant: '📈',
    notification_manager: '🔔'
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>מתאם סוכני AI</CardTitle>
            <p className="text-sm text-gray-500 mt-1">תאר משימה והמערכת תתאם את הסוכנים המתאימים</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          placeholder="לדוגמה: 'צור הצעת מחיר ללקוח חדש בתחום הנדל&quot;ן בסכום של 50,000 ₪, תזמן פגישת הכרות וצור פרויקט חדש'"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="min-h-[100px] text-base"
          disabled={loading}
        />

        <Button
          onClick={handleExecute}
          disabled={loading || !task.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              מעבד משימה...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 ml-2" />
              הפעל תיאום סוכנים
            </>
          )}
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mt-6 p-4 bg-white rounded-xl border-2 border-purple-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold">משימה הופעלה</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {result.estimated_time}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">{result.reasoning}</p>
              
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Badge className="bg-purple-600 text-white">
                  {agentIcons[result.agent]} {result.agent}
                </Badge>
                {result.workflow[0]?.supporting_agents?.length > 0 && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    {result.workflow[0].supporting_agents.map((agent, idx) => (
                      <Badge key={idx} variant="outline">
                        {agentIcons[agent]} {agent}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>

            {result.workflow && result.workflow.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-sm">זרימת עבודה:</h4>
                {result.workflow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{agentIcons[step.agent]} {step.agent}</p>
                      <p className="text-xs text-gray-600 mt-1">{step.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => window.location.href = createPageUrl('Chat')}
            >
              צפה בשיחה עם הסוכן
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}