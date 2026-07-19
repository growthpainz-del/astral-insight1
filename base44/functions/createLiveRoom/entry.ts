Deno.serve(async (req: Request) => {
  const apiKey = Deno.env.get("WHEREBY_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Whereby API key not configured. Please add WHEREBY_API_KEY to your secrets." }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  // Create a meeting room that expires in 2 hours
  const endDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  try {
    const response = await fetch("https://api.whereby.dev/v1/meetings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        endDate: endDate,
        fields: ["hostRoomUrl", "roomUrl"]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: "Failed to create live room", details: err }), { 
        status: response.status, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});