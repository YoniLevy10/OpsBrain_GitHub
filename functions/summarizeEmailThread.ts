import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { workspace_id, thread_id, emails } = await req.json();

    if (!emails || emails.length === 0) {
      return Response.json({ error: 'No emails provided' }, { status: 400 });
    }

    // בניית הטקסט לסיכום
    const threadText = emails.map((email, idx) => `
      מייל #${idx + 1}
      מאת: ${email.from}
      תאריך: ${email.date}
      נושא: ${email.subject}
      תוכן: ${email.body}
    `).join('\n\n---\n\n');

    // יצירת סיכום באמצעות AI
    const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `
        סכם את שרשור המיילים הבא בצורה תמציתית ומקצועית:
        
        ${threadText}
        
        ספק:
        1. סיכום קצר (2-3 משפטים)
        2. נקודות מפתח (bullet points)
        3. החלטות שהתקבלו
        4. פעולות שנדרשות (action items)
        5. אנשים מעורבים
        6. מצב הנושא (פתוח/סגור/ממתין)
      `,
      response_json_schema: {
        type: "object",
        properties: {
          brief_summary: { type: "string" },
          key_points: { 
            type: "array",
            items: { type: "string" }
          },
          decisions: {
            type: "array",
            items: { type: "string" }
          },
          action_items: {
            type: "array",
            items: { type: "string" }
          },
          participants: {
            type: "array",
            items: { type: "string" }
          },
          status: {
            type: "string",
            enum: ["open", "closed", "pending"]
          }
        }
      }
    });

    // שמירת הסיכום כ-insight
    const insight = await base44.asServiceRole.entities.Insight.create({
      workspace_id: workspace_id,
      type: 'email_summary',
      title: `סיכום: ${emails[0].subject}`,
      description: summary.brief_summary,
      category: 'communication',
      priority: summary.action_items.length > 0 ? 'high' : 'medium',
      data: {
        thread_id: thread_id,
        email_count: emails.length,
        participants: summary.participants,
        key_points: summary.key_points,
        decisions: summary.decisions,
        action_items: summary.action_items,
        status: summary.status
      }
    });

    // אם יש action items - צור משימות
    if (summary.action_items.length > 0) {
      for (const action of summary.action_items) {
        await base44.asServiceRole.entities.Task.create({
          workspace_id: workspace_id,
          title: action,
          description: `מתוך שרשור מיילים: ${emails[0].subject}`,
          status: 'pending',
          priority: 'medium'
        });
      }
    }

    return Response.json({
      success: true,
      summary: summary,
      insight_id: insight.id,
      tasks_created: summary.action_items.length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});