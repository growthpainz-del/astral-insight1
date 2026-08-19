import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Respond to Chat Access Request
 * Admin-only. Accepts or declines a ChatAccessRequest, and on acceptance
 * flips the requester's User.chat_approved flag so they can read/send
 * in the site-wide chat.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return Response.json({ error: 'requestId and action are required' }, { status: 400 });
    }
    if (!['accept', 'decline'].includes(action)) {
      return Response.json({ error: 'action must be "accept" or "decline"' }, { status: 400 });
    }

    const chatRequest = await base44.asServiceRole.entities.ChatAccessRequest.get(requestId);
    if (!chatRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    await base44.asServiceRole.entities.ChatAccessRequest.update(requestId, {
      status: newStatus,
      responded_at: now
    });

    if (action === 'accept' && chatRequest.requester_id) {
      await base44.asServiceRole.entities.User.update(chatRequest.requester_id, {
        chat_approved: true
      });
    }

    return Response.json({
      success: true,
      action: newStatus,
      request_id: requestId
    });
  } catch (error) {
    console.error('Error in respondToChatRequest:', error);
    return Response.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});
