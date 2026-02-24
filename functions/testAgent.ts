import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Test creating a conversation
        const conversation = await base44.agents.createConversation({
            agent_name: "cosmic_oracle_chronicler",
            metadata: {
                name: "Test Conversation",
            }
        });
        
        // Test adding a message
        const response = await base44.agents.addMessage(conversation.id, {
            role: "user",
            content: "Hello, who are you?"
        });

        return Response.json({ conversation, response });
    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});