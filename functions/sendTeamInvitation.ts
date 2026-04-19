import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role, workspaceName, inviterName, workspaceId } = await req.json();

    if (!email || !role || !workspaceName || !workspaceId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // יצירת קישור הזמנה
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com';
    const inviteLink = `${appUrl}?workspace=${workspaceId}&invite=true`;

    // תיאור הרשאות לפי תפקיד
    const roleDescriptions = {
      owner: 'בעלים - גישה מלאה לכל האפשרויות והגדרות',
      admin: 'מנהל - יכולת לנהל חברים, פרויקטים ולקוחות',
      member: 'חבר - יכולת לצפות ולערוך תוכן',
      viewer: 'צופה - גישה לקריאה בלבד'
    };

    const roleDescription = roleDescriptions[role] || roleDescriptions.member;

    // שליחת מייל
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `הוזמנת להצטרף למרחב העבודה ${workspaceName} ב-OpsBrain`,
      body: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 הוזמנת ל-OpsBrain</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; line-height: 1.6;">שלום,</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>${inviterName || user.full_name || user.email}</strong> הזמין/ה אותך להצטרף למרחב העבודה 
              <strong>${workspaceName}</strong> ב-OpsBrain.
            </p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">התפקיד שלך:</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1f2937;">${role}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">${roleDescription}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;">
                קבל הזמנה והתחבר
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>💡 טיפ:</strong> אם אין לך עדיין חשבון ב-OpsBrain, הקישור יוביל אותך ליצירת חשבון חדש.
              </p>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-top: 30px;">
              OpsBrain היא פלטפורמת AI לניהול עסקי חכם - ניהול פרויקטים, לקוחות, פיננסים ועוד.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              קיבלת מייל זה כי הוזמנת למרחב עבודה ב-OpsBrain<br>
              © 2026 OpsBrain - AI Business Management
            </p>
          </div>
        </div>
      `
    });

    return Response.json({ 
      success: true,
      message: 'Invitation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return Response.json({ 
      error: error.message || 'Failed to send invitation'
    }, { status: 500 });
  }
});