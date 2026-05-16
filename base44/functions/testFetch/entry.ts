Deno.serve(async (req) => {
  try {
    const { url } = await req.json();
    const res = await fetch(url);
    const text = await res.text();
    return Response.json({ status: res.status, text: text.substring(0, 500) });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});