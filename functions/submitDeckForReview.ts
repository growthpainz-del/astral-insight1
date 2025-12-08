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

    // Verify user owns this deck
    if (deck.created_by !== user.email) {
      return Response.json({ error: 'You do not own this deck' }, { status: 403 });
    }

    // Update deck status
    await base44.entities.Deck.update(deckId, {
      publish_status: "pending_review",
      submission_date: new Date().toISOString(),
      is_public: true
    });

    // Send confirmation email to creator
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `📬 Your deck "${deck.name}" has been submitted for review`,
        body: `Thank you for submitting your deck "${deck.name}" for publication!

Your submission details:
- Deck Name: ${deck.name}
- Category: ${deck.category || "Not specified"}
- Submitted: ${new Date().toLocaleString()}

What happens next:
1. Our team will review your deck (usually within 2-3 business days)
2. You'll receive an email when it's approved or if we need any changes
3. Once approved, your deck will appear in the public gallery

You can check the status anytime in your deck's Publishing tab.

Thank you for contributing to our community!

Best regards,
The Astral Insight Team`
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail submission if email fails
    }

    // Notify admins - USE SERVICE ROLE HERE (backend only)
    try {
      // Get all users with service role
      const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 100);
      const admins = allUsers.filter(u => u.role === "admin");

      console.log(`📧 Sending notifications to ${admins.length} admin(s)...`);

      // Get the origin from the request header
      const origin = req.headers.get('origin') || 'https://your-app.base44.com';
      
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `🔔 New deck submitted for review: "${deck.name}"`,
          body: `A new deck has been submitted for review.

Deck: ${deck.name}
Creator: ${deck.created_by}
Category: ${deck.category || "Not specified"}
Submitted: ${new Date().toLocaleString()}

Review it now: ${origin}/admin-deck-review

- The Astral Insight Team`
        });
      }
      
      console.log(`✅ Admin notifications sent to ${admins.length} admin(s)`);
    } catch (adminEmailError) {
      console.error("Failed to send admin notifications:", adminEmailError);
      // Don't fail submission if admin emails fail
    }

    return Response.json({
      status: 'success',
      message: 'Deck submitted for review successfully'
    });

  } catch (error) {
    console.error("Submit deck error:", error);
    return Response.json({
      status: 'error',
      error: error.message || 'Failed to submit deck for review'
    }, { status: 500 });
  }
});