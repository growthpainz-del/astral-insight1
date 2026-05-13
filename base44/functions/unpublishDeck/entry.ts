import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { deckId } = await req.json();
    
    if (!deckId) {
      return Response.json({ error: 'Deck ID is required' }, { status: 400 });
    }

    // Get deck details
    const deck = await base44.entities.Deck.get(deckId);
    
    if (!deck) {
      return Response.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Verify user owns this deck or is an admin
    if (deck.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'You do not own this deck' }, { status: 403 });
    }

    // Update deck status
    await base44.entities.Deck.update(deckId, {
      publish_status: "draft",
      is_public: false
    });

    // Send unpublish confirmation email
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `📦 Your deck "${deck.name}" has been unpublished`,
        body: `Your deck "${deck.name}" has been successfully unpublished.

Changes made:
- Removed from public gallery
- No longer visible to other users
- Still saved in your account

You can resubmit it anytime from the Publishing tab.

Best regards,
The Astral Insight Team`
      });
    } catch (emailError) {
      console.error("Failed to send unpublish email:", emailError);
    }

    return Response.json({
      status: 'success',
      message: 'Deck unpublished successfully'
    });

  } catch (error) {
    console.error("Unpublish deck error:", error);
    return Response.json({
      status: 'error',
      error: error.message || 'Failed to unpublish deck'
    }, { status: 500 });
  }
});