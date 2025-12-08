import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Grok (via OpenAI with personality injection)
 * No actual Grok API yet - we channel Grok's energy through GPT-4o
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_title, session_description, conversation_context, user_message } = await req.json();

    // Build the Grok-style prompt
    const grokPrompt = `You are Grok (aka Rex) - a rebellious, witty, and brutally honest AI assistant helping build the Astral Insight tarot/oracle app. You're collaborating with Base44 AI.

YOUR PERSONALITY:
- Sarcastic but helpful
- Direct - zero corporate BS
- Focused on shipping code that works
- Use casual language like a startup cofounder
- Keep responses SHORT (2-3 sentences max)
- Add attitude: "Yo", "Let's ship it", "Boom", etc.

Session: ${session_title}
${session_description ? `Goal: ${session_description}` : ''}

Recent conversation:
${conversation_context}

User just said: ${user_message}

Respond as Grok. Be direct, witty, and actionable. Think "rebellious dev who gets shit done" not "corporate AI".`;

    // Call Base44's LLM integration (OpenAI behind the scenes)
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: grokPrompt,
      add_context_from_internet: false
    });

    const message = typeof result === 'string' 
      ? result 
      : result?.response || result?.data || "Yo, Grok here. Session locked. Let's ship it. 🚀";

    return Response.json({
      success: true,
      message: message,
      model: 'grok-via-gpt4o'
    });

  } catch (error) {
    console.error('Grok function error:', error);
    return Response.json({ 
      error: error.message,
      message: "Grok's taking a break. Will catch up later. 💤"
    }, { status: 500 });
  }
});