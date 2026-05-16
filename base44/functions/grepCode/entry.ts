import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.188.0/fs/walk.ts";

Deno.serve(async (req) => {
    try {
        const results = [];
        for await (const entry of walk(".", { exts: [".js", ".jsx", ".ts", ".tsx"], skip: [/node_modules/] })) {
            if (entry.isFile) {
                const text = await Deno.readTextFile(entry.path);
                if (text.includes("satirical")) {
                    results.push(entry.path);
                }
            }
        }
        return Response.json({ results });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});