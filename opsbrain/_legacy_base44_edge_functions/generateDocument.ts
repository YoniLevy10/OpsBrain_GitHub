import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, template_id, entity_type, entity_id } = await req.json();

    // שליפת הנתונים לפי סוג הישות
    let entityData;
    switch (entity_type) {
      case 'client':
        entityData = await base44.asServiceRole.entities.Client.get(entity_id);
        break;
      case 'project':
        entityData = await base44.asServiceRole.entities.Project.get(entity_id);
        // שליפת גם נתוני הלקוח
        if (entityData?.client_id) {
          entityData.client = await base44.asServiceRole.entities.Client.get(entityData.client_id);
        }
        break;
      default:
        return Response.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    if (!entityData) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    // הכנת תבנית המסמך לפי הסוג
    let documentContent = '';
    switch (template_id) {
      case 'contract':
        documentContent = generateContract(entityData, workspace_id);
        break;
      case 'proposal':
        documentContent = generateProposal(entityData, workspace_id);
        break;
      case 'report':
        documentContent = await generateReport(base44, workspace_id, entityData);
        break;
      default:
        return Response.json({ error: 'Invalid template' }, { status: 400 });
    }

    // יצירת המסמך במערכת
    const document = await base44.asServiceRole.entities.Document.create({
      workspace_id,
      name: `${template_id}_${entityData.name}_${Date.now()}`,
      type: 'contract',
      content: documentContent,
      status: 'final',
      tags: [template_id, entity_type]
    });

    return Response.json({
      success: true,
      document,
      message: 'המסמך נוצר בהצלחה'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateContract(data, workspaceId) {
  const today = new Date().toLocaleDateString('he-IL');
  const client = data.client || data;
  
  return `
חוזה התקשרות
==================

תאריך: ${today}

בין:
${workspaceId} (להלן: "הספק")

לבין:
${client.name}
כתובת: ${client.address || '___________'}
טלפון: ${client.phone || '___________'}
(להלן: "הלקוח")

תיאור השירותים:
${data.description || data.name}

תנאי תשלום:
סכום: ₪${data.budget || '___________'}
תנאי תשלום: ${data.payment_terms || 'תשלום 30 יום'}

התחייבויות הצדדים:
1. הספק מתחייב לספק את השירותים המפורטים לעיל באיכות גבוהה
2. הלקוח מתחייב לשלם את התמורה במועד
3. כל שינוי בהסכם יעשה בכתב ובהסכמת שני הצדדים

תוקף ההסכם:
מיום: ${data.start_date || today}
עד יום: ${data.end_date || '___________'}

חתימות:
_________________                    _________________
       הספק                                הלקוח
  `;
}

function generateProposal(data, workspaceId) {
  const today = new Date().toLocaleDateString('he-IL');
  const client = data.client || data;
  
  return `
הצעת מחיר
==================

תאריך: ${today}

לכבוד:
${client.name}
${client.email}

הנדון: הצעת מחיר עבור ${data.name}

שלום רב,

תודה על פנייתך. להלן הצעת המחיר שלנו:

תיאור הפרויקט:
${data.description || ''}

פירוט עלויות:
- עלות בסיסית: ₪${data.budget || 0}
- מע"מ (17%): ₪${(data.budget || 0) * 0.17}
===================================
סה"כ: ₪${(data.budget || 0) * 1.17}

לוח זמנים משוער:
התחלה: ${data.start_date || 'לתיאום'}
סיום: ${data.end_date || 'לתיאום'}

תנאי תשלום:
${data.payment_terms || 'תשלום 30 יום מיום הוצאת חשבונית'}

תוקף ההצעה: 30 יום

נשמח לעמוד לרשותך לכל שאלה.

בברכה,
${workspaceId}
  `;
}

async function generateReport(base44, workspaceId, data) {
  const today = new Date().toLocaleDateString('he-IL');
  
  // שליפת נתונים לדוח
  const [projects, invoices, transactions] = await Promise.all([
    base44.asServiceRole.entities.Project.filter({ workspace_id: workspaceId }),
    base44.asServiceRole.entities.Invoice.filter({ workspace_id: workspaceId }),
    base44.asServiceRole.entities.Transaction.filter({ workspace_id: workspaceId })
  ]);

  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return `
דוח פעילות חודשי
==================

תאריך: ${today}

סיכום פיננסי:
- סה"כ הכנסות: ₪${totalRevenue.toLocaleString()}
- סה"כ הוצאות: ₪${totalExpenses.toLocaleString()}
- רווח: ₪${(totalRevenue - totalExpenses).toLocaleString()}

פרויקטים:
- פרויקטים פעילים: ${projects.filter(p => p.status === 'in_progress').length}
- פרויקטים שהושלמו: ${projects.filter(p => p.status === 'completed').length}

חשבוניות:
- חשבוניות ששולמו: ${invoices.filter(i => i.status === 'paid').length}
- חשבוניות ממתינות: ${invoices.filter(i => i.status === 'sent').length}
- חשבוניות באיחור: ${invoices.filter(i => i.status === 'overdue').length}

המלצות:
${totalExpenses > totalRevenue * 0.8 ? '⚠️ הוצאות גבוהות - מומלץ לבדוק אופטימיזציה' : '✅ מצב פיננסי תקין'}
${invoices.filter(i => i.status === 'overdue').length > 0 ? '⚠️ יש חשבוניות באיחור - מומלץ לשלוח תזכורות' : '✅ אין חשבוניות באיחור'}

דוח זה נוצר אוטומטית על ידי OpsBrain AI
  `;
}