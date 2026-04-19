import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task, context, workspace_id } = await req.json();

    // ניתוח המשימה וקביעת איזה סוכנים נדרשים + זיהוי צווארי בקבוק
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה מתאם מערכת סוכני AI מתקדמת שמתמקדת ב-ROI וייעול תהליכים.

🎯 **הסוכנים המומחים הזמינים:**
1. **opsbrain** - המזכירה הראשית - ניהול משימות, תיאום כללי, תזכורות
2. **financial_assistant** - מומחה פיננסי - תזרים מזומנים, תחזיות, אופטימיזציה
3. **client_manager** - מנהל לקוחות - CRM, אינטראקציות, שימור לקוחות
4. **project_manager** - מנהל פרויקטים - משימות, דדליינים, משאבים
5. **document_manager** - מנהל מסמכים - ארגון, חיפוש, אוטומציה
6. **invoice_specialist** - מומחה חשבוניות - חיוב, תשלומים, גבייה
7. **analytics_specialist** - מנתח נתונים - דוחות, תובנות, מגמות
8. **automation_manager** - מומחה אוטומציה - זרימות עבודה, אינטגרציות
9. **calendar_assistant** - מנהל יומן - תזמון, אופטימיזציית זמן
10. **notification_manager** - מנהל התראות - אלרטים, תזכורות פרואקטיביות

📊 **משימה מהמשתמש:** ${task}
📋 **קונטקסט עסקי:** ${JSON.stringify(context)}

💡 **עקרונות לניתוח:**
1. **זיהוי צווארי בקבוק** - איפה יש חסימות או חוסר יעילות?
2. **פוטנציאל אוטומציה** - אילו תהליכים חוזרים אפשר לאוטומט?
3. **תיאום בין-מחלקתי** - אילו תחומים צריכים לעבוד ביחד?
4. **ROI מוכח** - איך זה יחסוך זמן/כסף או יגדיל הכנסות?

החזר JSON בפורמט:
{
  "primary_agent": "הסוכן הראשי - בדרך כלל opsbrain אלא אם המשימה ממוקדת מאוד",
  "supporting_agents": ["רשימת סוכנים מומחים שיתמכו"],
  "workflow": [
    {
      "step": 1,
      "agent": "שם הסוכן",
      "action": "מה הוא יעשה",
      "expected_outcome": "מה התוצאה המצופה",
      "roi_impact": "איך זה משפיע על ROI"
    }
  ],
  "bottlenecks_identified": ["רשימת צווארי בקבוק שזוהו"],
  "automation_opportunities": ["הזדמנויות לאוטומציה"],
  "estimated_time_saved": "כמה זמן זה יחסוך לעומת ידני",
  "estimated_roi": "תיאור קצר של ההשפעה העסקית",
  "reasoning": "הסבר למה בחרת את הסוכנים האלה"
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
                expected_outcome: { type: "string" },
                roi_impact: { type: "string" }
              }
            }
          },
          bottlenecks_identified: {
            type: "array",
            items: { type: "string" }
          },
          automation_opportunities: {
            type: "array",
            items: { type: "string" }
          },
          estimated_time_saved: { type: "string" },
          estimated_roi: { type: "string" },
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

    // שליחת המשימה לסוכן הראשי עם מידע על ROI
    await base44.agents.addMessage(conversation, {
      role: "user",
      content: `${task}

📊 **ניתוח ראשוני:**
• סוכנים תומכים: ${analysisResult.supporting_agents.join(', ')}
• צווארי בקבוק: ${analysisResult.bottlenecks_identified?.join(', ') || 'לא זוהו'}
• הזדמנויות אוטומציה: ${analysisResult.automation_opportunities?.join(', ') || 'לא זוהו'}
• חיסכון צפוי בזמן: ${analysisResult.estimated_time_saved || 'טרם הוערך'}
• ROI צפוי: ${analysisResult.estimated_roi || 'טרם הוערך'}

קונטקסט עסקי: ${JSON.stringify(context)}`
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
      primary_agent: analysisResult.primary_agent,
      supporting_agents: analysisResult.supporting_agents,
      workflow: analysisResult.workflow,
      bottlenecks_identified: analysisResult.bottlenecks_identified,
      automation_opportunities: analysisResult.automation_opportunities,
      estimated_time_saved: analysisResult.estimated_time_saved,
      estimated_roi: analysisResult.estimated_roi,
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