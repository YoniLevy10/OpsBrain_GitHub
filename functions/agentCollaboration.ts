import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      from_agent, 
      to_agent, 
      task_description, 
      context_data,
      conversation_id,
      workspace_id 
    } = await req.json();

    // יצירת שיחה חדשה עם הסוכן המקבל
    const targetConversation = await base44.agents.createConversation({
      agent_name: to_agent,
      metadata: {
        delegated_from: from_agent,
        parent_conversation_id: conversation_id,
        workspace_id,
        task_description
      }
    });

    // העברת המשימה לסוכן היעד
    await base44.agents.addMessage(targetConversation, {
      role: "user",
      content: `העברה מ-${from_agent}:\n\n${task_description}\n\nקונטקסט: ${JSON.stringify(context_data)}`
    });

    // רישום בפיד הפעילות
    await base44.asServiceRole.entities.ActivityFeed.create({
      workspace_id,
      user_email: user.email,
      user_name: "מערכת AI",
      action_type: "shared",
      entity_type: "AgentCollaboration",
      entity_id: targetConversation.id,
      description: `${from_agent} העביר משימה ל-${to_agent}: ${task_description.substring(0, 50)}...`,
      icon: "🔄",
      color: "purple"
    });

    // שליחת התראה למשתמש
    await base44.asServiceRole.entities.Notification.create({
      workspace_id,
      user_email: user.email,
      type: "system",
      title: `תיאום בין סוכנים`,
      message: `${from_agent} העביר משימה ל-${to_agent}`,
      priority: "medium",
      action_url: `/chat?conversation=${targetConversation.id}`,
      action_label: "צפה בשיחה"
    });

    return Response.json({
      success: true,
      target_conversation_id: targetConversation.id,
      from: from_agent,
      to: to_agent,
      message: "Task successfully delegated"
    });

  } catch (error) {
    console.error('Collaboration error:', error);
    return Response.json({ 
      error: 'Failed to collaborate between agents',
      details: error.message 
    }, { status: 500 });
  }
});