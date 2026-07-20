import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

// ---------------------------------------------------------------
// LAYER 1: Deterministic moon phase math — no LLM, no API needed.
// Synodic month approximation, accurate to well within a phase window.
// ---------------------------------------------------------------
const SYNODIC_MONTH = 29.53058867; // days
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // Jan 6 2000 18:14 UTC

const PHASES = [
  "new_moon",
  "waxing_crescent",
  "first_quarter",
  "waxing_gibbous",
  "full_moon",
  "waning_gibbous",
  "last_quarter",
  "waning_crescent",
];

function getCurrentMoonPhase(date = new Date()) {
  const daysSince = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const cyclePosition = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phaseIndex = Math.floor((cyclePosition / SYNODIC_MONTH) * 8) % 8;
  return PHASES[phaseIndex];
}

function getPhaseEndDate(date = new Date()) {
  // When does the current 1/8th phase window end? Content is valid until then.
  const daysSince = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const cyclePosition = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phaseLength = SYNODIC_MONTH / 8;
  const daysIntoPhase = cyclePosition % phaseLength;
  const daysRemaining = phaseLength - daysIntoPhase;
  return new Date(date.getTime() + daysRemaining * 86400000);
}

// ---------------------------------------------------------------
// Handler
// ---------------------------------------------------------------
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { zodiacSign, theme } = await req.json();

  if (!zodiacSign || !theme) {
    return Response.json(
      { error: "zodiacSign and theme are required" },
      { status: 400 }
    );
  }

  const now = new Date();
  const moonPhase = getCurrentMoonPhase(now);
  const lookupKey = `${moonPhase}:${zodiacSign.toLowerCase()}:${theme.toLowerCase()}`;

  // ------------------------------------------------------------
  // LAYER 3: Deterministic lookup — the fast path, no LLM.
  // ------------------------------------------------------------
  const cached = await base44.asServiceRole.entities.CosmicContent.filter({
    lookup_key: lookupKey,
  });

  if (cached.length > 0) {
    const row = cached[0];
    const stillValid =
      row.valid_until && new Date(row.valid_until) > now && row.content;
    if (stillValid) {
      return Response.json({
        content: row.content,
        moonPhase,
        fromCache: true,
      });
    }
  }

  // ------------------------------------------------------------
  // LAYER 2: Cache miss or expired — regenerate via one LLM call,
  // store it, and serve it. Next visitor with the same combination
  // hits the cache until the moon phase changes.
  // ------------------------------------------------------------
  const prompt = `You are the interpretive voice of Astral Insight, a tarot and astrology app.
Write a short daily cosmic insight (3-4 sentences, warm and grounded, no emojis, no headers) for:
- Current moon phase: ${moonPhase.replace(/_/g, " ")}
- Zodiac sun sign: ${zodiacSign}
- Life theme: ${theme}
Speak directly to the reader ("you"). Do not mention that this is generated or reference these parameters mechanically — weave them in naturally.`;

  const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
  });

  const content =
    typeof llmResult === "string" ? llmResult : llmResult?.response || "";

  const validUntil = getPhaseEndDate(now).toISOString();

  if (cached.length > 0) {
    // Refresh the expired row in place
    await base44.asServiceRole.entities.CosmicContent.update(cached[0].id, {
      content,
      moon_phase: moonPhase,
      generated_at: now.toISOString(),
      valid_until: validUntil,
    });
  } else {
    await base44.asServiceRole.entities.CosmicContent.create({
      lookup_key: lookupKey,
      moon_phase: moonPhase,
      zodiac_sign: zodiacSign.toLowerCase(),
      theme: theme.toLowerCase(),
      content,
      generated_at: now.toISOString(),
      valid_until: validUntil,
    });
  }

  return Response.json({
    content,
    moonPhase,
    fromCache: false,
  });
});