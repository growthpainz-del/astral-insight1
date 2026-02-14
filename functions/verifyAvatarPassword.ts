import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessPassword } = await req.json();
    const pw = Deno.env.get('AVATAR_JOBS_PASSWORD') || '';

    if (pw && accessPassword && String(accessPassword) === String(pw)) {
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});