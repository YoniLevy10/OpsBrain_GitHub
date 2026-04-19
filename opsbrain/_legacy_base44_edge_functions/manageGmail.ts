import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, action, email_id } = await req.json();

    // קבלת access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    switch (action) {
      case 'mark_read': {
        // סימון כנקרא
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email_id}/modify`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              removeLabelIds: ['UNREAD']
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to mark as read');
        }

        return Response.json({
          success: true,
          message: 'Marked as read'
        });
      }

      case 'archive': {
        // העברה לארכיון
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email_id}/modify`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              removeLabelIds: ['INBOX']
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to archive');
        }

        return Response.json({
          success: true,
          message: 'Archived'
        });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});