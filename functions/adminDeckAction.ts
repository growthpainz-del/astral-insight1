import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Admin Deck Action Handler
 * Approves or rejects decks with email notifications to creators
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { deckId, action, reason } = await req.json();
    
    if (!deckId || !action) {
      return Response.json({ error: 'deckId and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    // Get the deck using service role
    const deck = await base44.asServiceRole.entities.Deck.get(deckId);
    
    if (!deck) {
      return Response.json({ error: 'Deck not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    
    if (action === 'approve') {
      // Approve the deck
      await base44.asServiceRole.entities.Deck.update(deckId, {
        publish_status: 'published',
        is_public: true,
        reviewed_by: user.email,
        reviewed_date: now,
        review_notes: 'Deck approved for publication'
      });

      // Send approval email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: deck.created_by,
          from_name: 'Astral Insight',
          subject: `🎉 Your deck "${deck.name}" has been approved!`,
          body: `Congratulations! Your deck "${deck.name}" has been approved and is now published in the public gallery.

Your deck is now visible to all users and can be discovered on the Explore page.

Deck Details:
- Name: ${deck.name}
- Category: ${deck.category || "Not specified"}
- Approved by: ${user.email}
- Approved on: ${new Date().toLocaleString()}

Thank you for contributing to our community!

Best regards,
The Astral Insight Team`
        });
        
        console.log(`✅ Approval email sent to ${deck.created_by}`);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the entire operation if email fails
      }

      return Response.json({
        success: true,
        action: 'approved',
        deck_id: deckId,
        message: `Deck "${deck.name}" approved and published`
      });
      
    } else if (action === 'reject') {
      if (!reason) {
        return Response.json({ error: 'reason is required for rejection' }, { status: 400 });
      }

      // Reject the deck
      await base44.asServiceRole.entities.Deck.update(deckId, {
        publish_status: 'rejected',
        reviewed_by: user.email,
        reviewed_date: now,
        review_notes: reason
      });

      // Send rejection email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: deck.created_by,
          from_name: 'Astral Insight',
          subject: `❌ Your deck "${deck.name}" needs revision`,
          body: `Thank you for submitting "${deck.name}" for review.

Unfortunately, we're unable to publish your deck at this time for the following reason:

${reason}

What happens next:
- Your deck is still saved in your account
- You can make the requested changes
- Resubmit when ready using the Publishing tab in your deck editor

If you have questions about this decision, please reply to this email.

Best regards,
The Astral Insight Team`
        });
        
        console.log(`✅ Rejection email sent to ${deck.created_by}`);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Don't fail the entire operation if email fails
      }

      return Response.json({
        success: true,
        action: 'rejected',
        deck_id: deckId,
        message: `Deck "${deck.name}" rejected with feedback`
      });
    }

  } catch (error) {
    console.error('Error in adminDeckAction:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});