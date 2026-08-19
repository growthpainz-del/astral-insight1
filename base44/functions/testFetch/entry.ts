import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const { url } = await req.json();
    
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return Response.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return Response.json({ error: 'Forbidden destination' }, { status: 403 });
    }

    const res = await fetch(parsedUrl.toString());
    const text = await res.text();
    return Response.json({ status: res.status, text: text.substring(0, 500) });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});