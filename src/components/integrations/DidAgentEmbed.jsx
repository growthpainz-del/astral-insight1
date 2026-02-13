import React, { useEffect } from "react";

export default function DidAgentEmbed() {
  useEffect(() => {
    if (document.getElementById("did-agent-loader")) return;

    const script = document.createElement("script");
    script.id = "did-agent-loader";
    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";

    // Attributes from user-provided embed
    script.setAttribute("data-mode", "fabio");
    script.setAttribute("data-client-key", "Z29vZ2xlLW9hdXRoMnwxMTU4Mjg4NTQ2NzM5OTExMjUyOTQ6X1FLR2p1b0pjcUtOemJHX3NpM0py");
    script.setAttribute("data-agent-id", "v2_agt_MRSoZNL0");
    script.setAttribute("data-name", "did-agent");
    script.setAttribute("data-monitor", "true");
    script.setAttribute("data-orientation", "horizontal");
    script.setAttribute("data-position", "right");

    script.onload = () => console.log("[D-ID] Agent ready");
    script.onerror = () => console.error("[D-ID] Agent script failed to load");

    document.body.appendChild(script);
  }, []);

  return null;
}