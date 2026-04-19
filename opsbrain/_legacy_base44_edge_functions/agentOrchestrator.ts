import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task, context, workspace_id } = await req.json();

    // ניתוח המשימה וקביעת איזה סוכנים נדרשים
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה מתאם מערכת סוכני AI. נתחלית משימה מהמשתמש וקבע איזה סוכנים צריכים להיות מעורבים.

סוכנים זמינים:
1. opsbrain - העוזר הראשי - לניהול כללי, משימות, ותיאום
2. client_manager - ניהול לקוחות ואינטראקציות
3. project_manager - ניהול פרויקטים ומשימות
4. document_manager - ארגון וניתוח מסמכים
5. invoice_specialist - חשבוניות ותשלומים
6. financial_assistant - ניתוח פיננסי ודוחות
7. analytics_specialist - ניתוח נתונים ותחזיות
8. automation_manager - אוטומציות וזרימות עבודה
9. calendar_assistant - יומן ותזמון
10. marketing_assistant - שיווק וצמיחה
11. notification_manager - התראות ותקשורת

משימה: ${task}
קונטקסט: ${JSON.stringify(context)}

החזר JSON בפורמט:
{
  "primary_agent": "שם הסוכן הראשי שיטפל במשימה",
  "supporting_agents": ["רשימת סוכנים תומכים אם נדרש"],
  "workflow": [
    {
      "step": 1,
      "agent": "שם הסוכן",
      "action": "תיאור הפעולה",
      "dependencies": ["סוכנים שצריכים להסתיים לפניו"]
    }
  ],
  "estimated_time": "זמן משוער בדקות",
  "reasoning": "הסבר קצר למה נבחרו הסוכנים האלה"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          primary_agent: { type: "string" },
          supporting_agents: { 
            type: "array",
            items: { type: "string" }
          },
          workflow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "number" },
                agent: { type: "string" },
                action: { type: "string" },
                dependencies: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          estimated_time: { type: "string" },
          reasoning: { type: "string" }
        }
      }
    });

    // יצירת שיחה עם הסוכן הראשי
    const conversation = await base44.agents.createConversation({
      agent_name: analysisResult.primary_agent,
      metadata: {
        task,
        workflow: analysisResult.workflow,
        workspace_id,
        created_by: user.email
      }
    });

    // שליחת המשימה לסוכן הראשי
    await base44.agents.addMessage(conversation, {
      role: "user",
      content: `${task}\n\nקונטקסט: ${JSON.stringify(context)}\n\nסוכנים תומכים זמינים: ${analysisResult.supporting_agents.join(', ')}`
    });

    // רישום הפעלת האוטומציה
    await base44.asServiceRole.entities.ActivityFeed.create({
      workspace_id,
      user_email: user.email,
      user_name: user.full_name,
      action_type: "created",
      entity_type: "AgentTask",
      entity_id: conversation.id,
      entity_name: task,
      description: `הופעל תהליך אוטומטי: ${analysisResult.primary_agent} + ${analysisResult.supporting_agents.length} סוכנים`,
      icon: "🤖",
      color: "blue"
    });

    return Response.json({
      success: true,
      conversation_id: conversation.id,
      agent: analysisResult.primary_agent,
      workflow: analysisResult.workflow,
      estimated_time: analysisResult.estimated_time,
      reasoning: analysisResult.reasoning
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    return Response.json({ 
      error: 'Failed to orchestrate agents',
      details: error.message 
    }, { status: 500 });
  }
});