import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, recipient_email, workspace_id } = await req.json();

    // קבלת access token ל-Gmail
    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');
    } catch (error) {
      return Response.json({ 
        error: 'Gmail לא מחובר',
        message: 'נא לחבר את Gmail דרך העוזר האישי בצ\'אט',
        action: 'connect_gmail'
      }, { status: 400 });
    }

    // בניית הדוח לפי הסוג
    let reportData = {};
    let subject = '';
    let htmlContent = '';

    if (report_type === 'daily') {
      // דוח יומי - סיכום של היום
      const today = new Date().toISOString().split('T')[0];
      
      // שלוף נתונים ליום
      const [transactions, tasks, clients] = await Promise.all([
        base44.asServiceRole.entities.Transaction.filter({ 
          workspace_id,
          date: today 
        }),
        base44.asServiceRole.entities.Task.filter({ 
          workspace_id,
          created_date: { $gte: new Date(today).toISOString() }
        }),
        base44.asServiceRole.entities.Interaction.filter({ 
          workspace_id,
          created_date: { $gte: new Date(today).toISOString() }
        })
      ]);

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      subject = `📊 דוח יומי - ${new Date().toLocaleDateString('he-IL')}`;
      htmlContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
    .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
    .metric:last-child { border-bottom: none; }
    .label { font-weight: bold; }
    .value { color: #667eea; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 דוח יומי - OpsBrain</h1>
      <p>${new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="section">
      <h2>💰 פיננסים</h2>
      <div class="metric">
        <span class="label">הכנסות:</span>
        <span class="value positive">₪${totalIncome.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="label">הוצאות:</span>
        <span class="value negative">₪${totalExpense.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="label">רווח נקי:</span>
        <span class="value ${totalIncome - totalExpense >= 0 ? 'positive' : 'negative'}">₪${(totalIncome - totalExpense).toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="label">טרנזקציות:</span>
        <span class="value">${transactions.length}</span>
      </div>
    </div>

    <div class="section">
      <h2>✅ משימות</h2>
      <div class="metric">
        <span class="label">משימות חדשות:</span>
        <span class="value">${tasks.length}</span>
      </div>
      <div class="metric">
        <span class="label">הושלמו:</span>
        <span class="value">${tasks.filter(t => t.status === 'done').length}</span>
      </div>
    </div>

    <div class="section">
      <h2>👥 לקוחות</h2>
      <div class="metric">
        <span class="label">אינטראקציות:</span>
        <span class="value">${clients.length}</span>
      </div>
    </div>

    <div class="footer">
      <p>דוח זה נוצר אוטומטית על ידי OpsBrain AI 🤖</p>
      <p>לשינוי הגדרות הדוח, היכנס למערכת</p>
    </div>
  </div>
</body>
</html>`;
    } else if (report_type === 'weekly') {
      // דוח שבועי
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const [transactions, projects, clients] = await Promise.all([
        base44.asServiceRole.entities.Transaction.filter({ 
          workspace_id,
          date: { $gte: weekAgo.toISOString().split('T')[0] }
        }),
        base44.asServiceRole.entities.Project.filter({ 
          workspace_id,
          updated_date: { $gte: weekAgo.toISOString() }
        }),
        base44.asServiceRole.entities.Client.filter({ 
          workspace_id,
          created_date: { $gte: weekAgo.toISOString() }
        })
      ]);

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      subject = `📈 דוח שבועי - OpsBrain`;
      htmlContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
    .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
    .metric:last-child { border-bottom: none; }
    .label { font-weight: bold; }
    .value { color: #f5576c; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 סיכום שבועי</h1>
      <p>7 הימים האחרונים</p>
    </div>

    <div class="section">
      <h2>💼 ביצועים</h2>
      <div class="metric">
        <span class="label">הכנסות שבועיות:</span>
        <span class="value">₪${totalIncome.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="label">פרויקטים פעילים:</span>
        <span class="value">${projects.length}</span>
      </div>
      <div class="metric">
        <span class="label">לקוחות חדשים:</span>
        <span class="value">${clients.length}</span>
      </div>
    </div>

    <div class="footer">
      <p>דוח זה נוצר אוטומטית על ידי OpsBrain AI 🤖</p>
    </div>
  </div>
</body>
</html>`;
    } else if (report_type === 'monthly') {
      // דוח חודשי
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const transactions = await base44.asServiceRole.entities.Transaction.filter({ 
        workspace_id,
        date: { $gte: monthAgo.toISOString().split('T')[0] }
      });

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      subject = `📊 דוח חודשי - ${new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`;
      htmlContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
    .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
    .metric:last-child { border-bottom: none; }
    .label { font-weight: bold; }
    .value { color: #667eea; font-size: 20px; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 דוח חודשי מלא</h1>
      <p>${new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="section">
      <h2>💰 סיכום פיננסי</h2>
      <div class="metric">
        <span class="label">סה"כ הכנסות:</span>
        <span class="value positive">₪${totalIncome.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="label">סה"כ הוצאות:</span>
        <span class="value negative">₪${totalExpense.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="label">רווח נקי:</span>
        <span class="value ${totalIncome - totalExpense >= 0 ? 'positive' : 'negative'}">₪${(totalIncome - totalExpense).toLocaleString()}</span>
      </div>
    </div>

    <div class="footer">
      <p>דוח זה נוצר אוטומטית על ידי OpsBrain AI 🤖</p>
    </div>
  </div>
</body>
</html>`;
    }

    // שליחת המייל דרך Gmail API
    const message = [
      `To: ${recipient_email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\n');

    const encodedMessage = btoa(unescape(encodeURIComponent(message)));

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();

    // שמירת לוג
    await base44.asServiceRole.entities.ActivityFeed.create({
      workspace_id,
      user_email: user.email,
      user_name: user.full_name,
      action_type: 'created',
      entity_type: 'EmailReport',
      entity_id: result.id,
      entity_name: subject,
      description: `נשלח דוח ${report_type} ל-${recipient_email}`,
      icon: '📧',
      color: 'blue'
    });

    return Response.json({
      success: true,
      message_id: result.id,
      report_type,
      recipient: recipient_email,
      subject
    });

  } catch (error) {
    console.error('Error sending email report:', error);
    return Response.json({ 
      error: 'Failed to send report',
      details: error.message 
    }, { status: 500 });
  }
});