import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id } = await req.json();
    
    if (!workspace_id) {
      return Response.json({ error: 'workspace_id required' }, { status: 400 });
    }

    console.log('🧪 Starting comprehensive tests...');

    const results = {
      timestamp: new Date().toISOString(),
      workspace_id,
      tests: []
    };

    // Test 1: Entity reads
    console.log('\n📚 Testing entity reads...');
    const entityTests = [
      { name: 'Task', entity: 'Task' },
      { name: 'Client', entity: 'Client' },
      { name: 'Project', entity: 'Project' },
      { name: 'Document', entity: 'Document' },
      { name: 'Invoice', entity: 'Invoice' }
    ];

    for (const test of entityTests) {
      try {
        const data = await base44.asServiceRole.entities[test.entity].filter({ workspace_id }, '-created_date', 5);
        results.tests.push({
          category: 'Entity Read',
          name: test.name,
          status: 'success',
          count: data.length,
          message: `Successfully read ${data.length} ${test.name} records`
        });
        console.log(`✅ ${test.name}: ${data.length} records`);
      } catch (error) {
        results.tests.push({
          category: 'Entity Read',
          name: test.name,
          status: 'failed',
          error: error.message
        });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    // Test 2: Agent conversation
    console.log('\n🤖 Testing OpsBrain agent...');
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: 'opsbrain',
        metadata: { 
          name: 'System Test',
          workspace_id: workspace_id
        }
      });

      results.tests.push({
        category: 'Agent',
        name: 'OpsBrain Conversation Creation',
        status: 'success',
        conversation_id: conversation.id,
        message: 'Successfully created conversation'
      });
      console.log(`✅ Created conversation: ${conversation.id}`);

      // Test agent response
      await new Promise(resolve => setTimeout(resolve, 500));
      const loadedConversation = await base44.agents.getConversation(conversation.id);
      
      console.log('📤 Sending test message to agent...');
      await base44.agents.addMessage(loadedConversation, {
        role: 'user',
        content: 'בדיקה'
      });
      console.log('✅ Message sent, waiting for response...');

      // Wait for response
      let agentResponded = false;
      let unsubscribe = null;
      
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (!agentResponded) {
            console.log('⏱️ Agent response timeout');
            results.tests.push({
              category: 'Agent',
              name: 'OpsBrain Response',
              status: 'timeout',
              message: 'Agent did not respond within 10 seconds'
            });
            if (unsubscribe) unsubscribe();
            resolve();
          }
        }, 10000);

        unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
          const msgs = data.messages || [];
          const lastMsg = msgs[msgs.length - 1];
          
          if (lastMsg?.role === 'assistant' && lastMsg.content && !agentResponded) {
            agentResponded = true;
            clearTimeout(timeout);
            unsubscribe();
            
            results.tests.push({
              category: 'Agent',
              name: 'OpsBrain Response',
              status: 'success',
              response: lastMsg.content.substring(0, 100),
              message: 'Agent responded successfully'
            });
            console.log(`✅ Agent responded: ${lastMsg.content.substring(0, 50)}...`);
            resolve();
          }
        });
      });

    } catch (error) {
      results.tests.push({
        category: 'Agent',
        name: 'OpsBrain',
        status: 'failed',
        error: error.message
      });
      console.log(`❌ Agent test failed: ${error.message}`);
    }

    // Test 3: Calendar function
    console.log('\n📅 Testing Calendar integration...');
    try {
      const calendarResult = await base44.asServiceRole.functions.invoke('manageCalendarEvent', {
        workspace_id,
        action: 'list'
      });

      if (calendarResult.data?.success) {
        results.tests.push({
          category: 'Integration',
          name: 'Google Calendar',
          status: 'success',
          events_count: calendarResult.data.events?.length || 0,
          message: 'Calendar integration working'
        });
        console.log(`✅ Calendar: ${calendarResult.data.events?.length || 0} events`);
      } else {
        throw new Error(calendarResult.data?.error || 'Unknown error');
      }
    } catch (error) {
      results.tests.push({
        category: 'Integration',
        name: 'Google Calendar',
        status: 'failed',
        error: error.message
      });
      console.log(`❌ Calendar: ${error.message}`);
    }

    // Test 4: Create entities
    console.log('\n✍️ Testing entity creation...');
    try {
      const testTask = await base44.asServiceRole.entities.Task.create({
        workspace_id,
        title: 'System Test Task',
        description: 'Auto-generated test task',
        status: 'open',
        priority: 'low',
        due_date: '2026-03-01',
        tags: ['test', 'auto-generated']
      });

      results.tests.push({
        category: 'Entity Write',
        name: 'Task Creation',
        status: 'success',
        task_id: testTask.id,
        message: 'Successfully created test task'
      });
      console.log(`✅ Created test task: ${testTask.id}`);

      // Clean up test task
      await base44.asServiceRole.entities.Task.delete(testTask.id);
      console.log(`🗑️ Cleaned up test task`);

    } catch (error) {
      results.tests.push({
        category: 'Entity Write',
        name: 'Task Creation',
        status: 'failed',
        error: error.message
      });
      console.log(`❌ Task creation: ${error.message}`);
    }

    // Summary
    const summary = {
      total: results.tests.length,
      passed: results.tests.filter(t => t.status === 'success').length,
      failed: results.tests.filter(t => t.status === 'failed').length,
      timeout: results.tests.filter(t => t.status === 'timeout').length
    };

    results.summary = summary;

    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏱️ Timeout: ${summary.timeout}`);
    console.log(`📋 Total: ${summary.total}`);

    return Response.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Comprehensive test error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});