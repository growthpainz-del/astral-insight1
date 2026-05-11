import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function searchDir(dirPath, query) {
  let matches = [];
  try {
    for await (const dirEntry of Deno.readDir(dirPath)) {
      const entryPath = `${dirPath}/${dirEntry.name}`;
      if (dirEntry.isDirectory) {
        if (!entryPath.includes('node_modules') && !entryPath.includes('.git') && !entryPath.includes('dist')) {
          matches = matches.concat(await searchDir(entryPath, query));
        }
      } else if (dirEntry.isFile && (entryPath.endsWith('.js') || entryPath.endsWith('.jsx') || entryPath.endsWith('.ts') || entryPath.endsWith('.tsx'))) {
        const text = await Deno.readTextFile(entryPath);
        if (text.includes(query)) {
          const lines = text.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(query)) {
              matches.push(`${entryPath}:${i + 1}: ${lines[i].trim()}`);
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return matches;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const matches = await searchDir('.', payload.query || 'getThumbnailUrl');
    return Response.json({ matches });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});