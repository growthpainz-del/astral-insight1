import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

        const urlParams = new URL(req.url).searchParams;
        const target = urlParams.get("target") || "ROOTED";
        const skip = parseInt(urlParams.get("skip") || "0");
        const limit = 20;

        const res = await fetch("https://media.base44.com/files/public/68d2a300021f94d0f312c039/730076266_all-wheel-configs.json");
        const data = await res.json();
        
        let rootedConfig = data.find(w => 
            w.outer_ring && w.outer_ring.some(r => r.label && r.label.toUpperCase().includes('ROOTED JOURNEY'))
        ) || data[0];

        if (target === "ROOTED") {
            const arr = rootedConfig.outer_ring.slice(skip, skip + limit).map(r => 
                `{ id: ${JSON.stringify(r.icon || r.id)}, name: ${JSON.stringify(r.label)}, meaning: ${JSON.stringify(r.meaning || '')} }`
            );
            return Response.json({ result: arr.join(',\n  ') });
        }
        
        if (target === "MIDDLE") {
            const arr = rootedConfig.middle_ring.slice(skip, skip + limit).map(r => 
                `{ id: ${JSON.stringify(r.icon || r.id)}, meaning: ${JSON.stringify(r.meaning || r.label || '')} }`
            );
            return Response.json({ result: arr.join(',\n  ') });
        }

        if (target === "INNER") {
            const arr = rootedConfig.inner_ring.slice(skip, skip + limit).map(r => 
                `{ id: ${JSON.stringify(r.icon || r.id)}, meaning: ${JSON.stringify(r.meaning || r.label || '')} }`
            );
            return Response.json({ result: arr.join(',\n  ') });
        }
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});