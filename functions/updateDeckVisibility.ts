import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    console.log("[updateDeckVisibility] User:", user?.email);
    
    if (!user) {
      console.log("[updateDeckVisibility] No user - unauthorized");
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const deckId = payload.deckId || payload.id;
    const isPublic = !!payload.isPublic;

    console.log("[updateDeckVisibility] Deck ID:", deckId, "Target public:", isPublic);

    if (!deckId) {
      return Response.json({ error: "Missing deckId" }, { status: 400 });
    }

    // Fetch deck as service role to verify ownership/admin
    const deck = await base44.asServiceRole.entities.Deck.get(deckId);
    if (!deck) {
      console.log("[updateDeckVisibility] Deck not found");
      return Response.json({ error: "Deck not found" }, { status: 404 });
    }

    console.log("[updateDeckVisibility] Deck found, created_by:", deck.created_by);

    const isOwner = (deck.created_by || "").toLowerCase() === (user.email || "").toLowerCase();
    const isAdmin = (user.role === 'admin');

    console.log("[updateDeckVisibility] isOwner:", isOwner, "isAdmin:", isAdmin);

    if (!isOwner && !isAdmin) {
      console.log("[updateDeckVisibility] Forbidden - not owner or admin");
      return Response.json({ error: "Forbidden: only the owner or an admin can change visibility" }, { status: 403 });
    }

    console.log("[updateDeckVisibility] Updating deck visibility...");
    const updated = await base44.asServiceRole.entities.Deck.update(deckId, { is_public: isPublic });
    console.log("[updateDeckVisibility] Success! New is_public:", updated.is_public);
    
    return Response.json({ ok: true, deck: updated });
  } catch (error) {
    console.error("[updateDeckVisibility] Error:", error);
    return Response.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
});