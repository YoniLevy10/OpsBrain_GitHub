import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // פונקציה זו תרוץ אוטומטית כל יום ב-8:00
    // היא תבדוק את תחזית התזרים לכל workspace
    
    const workspaces = await base44.asServiceRole.entities.Workspace.filter({});

    for (const workspace of workspaces) {
      try {
        // קריאה לפונקציית התחזית
        const forecastResponse = await base44.asServiceRole.functions.invoke('predictCashFlow', {
          workspace_id: workspace.id
        });

        const forecast = forecastResponse.data;

        // בדיקה אם יש התראות תוך 7 ימים
        const urgentAlerts = forecast.alerts.filter(alert => alert.days_until <= 7);

        if (urgentAlerts.length > 0) {
          // שליפת כל חברי ה-workspace
          const members = await base44.asServiceRole.entities.WorkspaceMember.filter({
            workspace_id: workspace.id,
            status: 'active'
          });

          // שליחת התראה לכל חבר
          for (const member of members) {
            for (const alert of urgentAlerts) {
              await base44.asServiceRole.entities.Notification.create({
                workspace_id: workspace.id,
                user_email: member.invited_email,
                type: 'system',
                priority: alert.severity === 'critical' ? 'urgent' : 'high',
                title: alert.severity === 'critical' 
                  ? '⚠️ אזהרת תזרים קריטית!'
                  : '⚡ אזהרת תזרים',
                message: `${alert.message} - צפוי בעוד ${alert.days_until} ימים`,
                action_url: '/Finance',
                action_label: 'צפה בתחזית מלאה',
                related_entity_type: 'forecast',
                metadata: {
                  alert_severity: alert.severity,
                  projected_balance: alert.projected_balance,
                  days_until: alert.days_until
                }
              });
            }
          }

          // שליחת מייל נוסף למנהלים (אופציונלי)
          const admins = members.filter(m => m.role === 'owner' || m.role === 'admin');
          for (const admin of admins) {
            if (urgentAlerts.some(a => a.severity === 'critical')) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: admin.invited_email,
                subject: '⚠️ אזהרת תזרים קריטית - פעולה נדרשת',
                body: `
                  <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #dc2626;">אזהרת תזרים מזומנים קריטית</h2>
                    <p>זוהה חוסר תזרים צפוי ב-${workspace.name}:</p>
                    <ul>
                      ${urgentAlerts.map(a => `
                        <li style="margin: 10px 0;">
                          <strong>${a.message}</strong><br>
                          צפוי בעוד ${a.days_until} ימים (${a.date})
                        </li>
                      `).join('')}
                    </ul>
                    <h3>המלצות פעולה:</h3>
                    <ul>
                      ${forecast.recommendations.slice(0, 3).map(r => `
                        <li>${r.action} - השפעה: ${r.impact}</li>
                      `).join('')}
                    </ul>
                    <p><a href="${Deno.env.get('APP_URL')}/Finance" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">צפה בתחזית המלאה</a></p>
                  </div>
                `
              });
            }
          }
        }

      } catch (error) {
        console.error(`Error checking workspace ${workspace.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      workspaces_checked: workspaces.length,
      message: 'Cash flow alerts checked'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});