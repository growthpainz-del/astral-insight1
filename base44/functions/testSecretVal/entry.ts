import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  return Response.json({ key: Deno.env.get('D_ID_API_KEY') });
});