import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { workspace_id, email_text, sender, subject } = await req.json();

    // ניתוח סנטימנט באמצעות AI
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `
        נתח את הסנטימנט והטון של המייל הבא:
        
        נושא: ${subject}
        שולח: ${sender}
        תוכן: ${email_text}
        
        ספק ניתוח מפורט:
        1. סנטימנט כללי (חיובי/שלילי/ניטרלי)
        2. רמת דחיפות (גבוהה/בינונית/נמוכה)
        3. טון (פורמלי/ידידותי/כועס/מודאג)
        4. נושא עיקרי
        5. האם דרושה תגובה דחופה?
        6. המלצה לטיפול
      `,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { 
            type: "string", 
            enum: ["positive", "negative", "neutral"]
          },
          urgency: { 
            type: "string", 
            enum: ["high", "medium", "low"]
          },
          tone: { type: "string" },
          main_topic: { type: "string" },
          requires_urgent_response: { type: "boolean" },
          recommendation: { type: "string" },
          confidence_score: { type: "number" }
        }
      }
    });

    // שמירת הניתוח
    await base44.asServiceRole.entities.Insight.create({
      workspace_id: workspace_id,
      type: 'email_sentiment',
      title: `ניתוח: ${subject}`,
      description: analysis.recommendation,
      category: 'communication',
      priority: analysis.urgency === 'high' ? 'high' : 'medium',
      data: {
        sender: sender,
        subject: subject,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        tone: analysis.tone,
        main_topic: analysis.main_topic,
        requires_urgent_response: analysis.requires_urgent_response,
        confidence: analysis.confidence_score
      }
    });

    // אם דחוף - צור התראה
    if (analysis.requires_urgent_response) {
      const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
        workspace_id: workspace_id,
        status: 'active'
      });

      for (const member of members) {
        await base44.asServiceRole.entities.Notification.create({
          workspace_id: workspace_id,
          user_email: member.invited_email,
          type: 'system',
          priority: 'urgent',
          title: '🚨 מייל דחוף דורש תשומת לב',
          message: `${sender}: ${subject}`,
          metadata: {
            sentiment: analysis.sentiment,
            topic: analysis.main_topic
          }
        });
      }
    }

    return Response.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});