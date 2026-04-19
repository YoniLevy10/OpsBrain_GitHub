import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_case, workspace_id } = await req.json();

    console.log(`\n🧪 Testing: ${test_case}`);
    console.log(`Workspace ID: ${workspace_id}`);

    // יצירת שיחה
    const conversation = await base44.agents.createConversation({
      agent_name: 'opsbrain',
      metadata: { 
        name: 'Test', 
        source: 'test',
        workspace_id: workspace_id
      }
    });

    console.log(`✅ Conversation created: ${conversation.id}`);

    // פקודות טסט
    const testCommands = {
      'create_task': 'צור משימה להתקשר ללקוח מחר',
      'create_client': 'צור לקוח בשם דני כהן',
      'create_project': 'צור פרויקט בניית אתר',
      'summary': 'תן לי סיכום של הפרויקטים שלי',
      'calendar': 'קבע פגישה מחר בשעה 10'
    };

    const command = testCommands[test_case];
    if (!command) {
      return Response.json({ error: 'Unknown test case' }, { status: 400 });
    }

    console.log(`📝 Command: ${command}`);

    // שליחת הודעה (צריך להשתמש רק ב-ID)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`📤 Sending message...`);
    
    // טעינת השיחה מחדש ושליחת ההודעה
    const loadedConversation = await base44.agents.getConversation(conversation.id);
    await base44.agents.addMessage(loadedConversation, {
      role: 'user',
      content: command
    });
    
    console.log(`✅ Message sent`);

    // המתנה לתשובה
    let isDone = false;
    let finalResponse = null;
    let toolsExecuted = [];
    let attempts = 0;
    const maxAttempts = 80; // 40 שניות

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      if (isDone) return;
      attempts++;

      const msgs = data.messages || [];
      const lastMsg = msgs[msgs.length - 1];

      console.log(`\n📊 Attempt ${attempts}/${maxAttempts}`);
      console.log(`Messages count: ${msgs.length}`);

      if (lastMsg?.role === 'assistant') {
        console.log(`Assistant message: ${lastMsg.content?.substring(0, 100)}...`);
        
        const tools = lastMsg.tool_calls || [];
        console.log(`Tool calls: ${tools.length}`);
        
        tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.status}`);
          if (tool.status === 'completed' && !toolsExecuted.includes(tool.id)) {
            toolsExecuted.push(tool.id);
            console.log(`    ✅ Completed: ${tool.results?.substring(0, 100)}`);
          }
        });

        const hasActive = tools.some(t => 
          t.status === 'running' || t.status === 'pending' || t.status === 'in_progress'
        );

        if (!hasActive && lastMsg.content) {
          isDone = true;
          finalResponse = {
            response: lastMsg.content,
            tools_executed: toolsExecuted.length,
            attempts: attempts,
            conversation_id: conversation.id
          };
          console.log(`\n✅ DONE! Response: ${lastMsg.content}`);
        }
      }

      if (attempts >= maxAttempts && !isDone) {
        isDone = true;
        finalResponse = {
          error: 'Timeout - agent did not complete in time',
          attempts: attempts,
          conversation_id: conversation.id
        };
        console.log(`\n❌ TIMEOUT after ${attempts} attempts`);
      }
    });

    // המתנה עד שנסיים או timeout
    while (!isDone && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    unsubscribe();

    if (!finalResponse) {
      finalResponse = {
        error: 'No response received',
        attempts: attempts,
        conversation_id: conversation.id
      };
    }

    console.log(`\n📋 Final result:`, JSON.stringify(finalResponse, null, 2));

    return Response.json({
      success: !finalResponse.error,
      test_case,
      command,
      ...finalResponse
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});