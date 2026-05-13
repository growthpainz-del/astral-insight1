import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const targetEmail = payload.userEmail || user.email; // Can approve own decks or specify email

    console.log('[bulkApproveDecks] User:', user.email, 'Target:', targetEmail);

    // Only admins should be able to bulk approve decks to publish them
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required to approve decks' }, { status: 403 });
    }

    // Get all decks for the target user
    const allDecks = await base44.asServiceRole.entities.Deck.list('-created_date', 500);
    
    const userDecks = allDecks.filter(d => 
      d.created_by && 
      d.created_by.toLowerCase() === targetEmail.toLowerCase()
    );

    console.log('[bulkApproveDecks] Found', userDecks.length, 'decks for', targetEmail);

    // Filter decks that need approval (not already published)
    const decksToApprove = userDecks.filter(d => 
      d.publish_status !== 'published'
    );

    console.log('[bulkApproveDecks]', decksToApprove.length, 'decks need approval');

    // Approve all decks
    const results = [];
    for (const deck of decksToApprove) {
      try {
        await base44.asServiceRole.entities.Deck.update(deck.id, {
          publish_status: 'published',
          reviewed_by: user.email,
          reviewed_date: new Date().toISOString(),
          review_notes: 'Bulk approved by creator'
        });
        
        results.push({ 
          id: deck.id, 
          name: deck.name, 
          status: 'approved' 
        });
        
        console.log('[bulkApproveDecks] Approved:', deck.name);
      } catch (err) {
        console.error('[bulkApproveDecks] Failed to approve', deck.name, ':', err);
        results.push({ 
          id: deck.id, 
          name: deck.name, 
          status: 'error', 
          error: err.message 
        });
      }
    }

    return Response.json({
      success: true,
      total_decks: userDecks.length,
      approved: results.length,
      results: results
    });

  } catch (error) {
    console.error('[bulkApproveDecks] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to bulk approve decks' 
    }, { status: 500 });
  }
});