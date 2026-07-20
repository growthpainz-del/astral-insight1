import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getZodiacSign, getZodiacDisplayName } from "@/utils/zodiac";

const MOON_ICONS = {
  new_moon: "🌑",
  waxing_crescent: "🌒",
  first_quarter: "🌓",
  waxing_gibbous: "🌔",
  full_moon: "🌕",
  waning_gibbous: "🌖",
  last_quarter: "🌗",
  waning_crescent: "🌘",
};

export default function CosmicInsight({ theme = "general" }) {
  const [content, setContent] = useState(null);
  const [moonPhase, setMoonPhase] = useState(null);
  const [signName, setSignName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const birthdate = user.birthdate;

        if (!birthdate) {
          setError("Add your birthdate to your profile to unlock daily cosmic insights.");
          setLoading(false);
          return;
        }

        const zodiacSign = getZodiacSign(birthdate);
        setSignName(getZodiacDisplayName(birthdate));

        const { data } = await base44.functions.invoke("getCosmicContent", {
          zodiacSign,
          theme,
        });

        setContent(data.content);
        setMoonPhase(data.moonPhase);
        setLoading(false);
      } catch (e) {
        setError("The stars are quiet right now. Try again in a moment.");
        setLoading(false);
      }
    })();
  }, [theme]);

  if (loading) {
    return (
      <div style={styles.card}>
        <p style={styles.muted}>Reading the sky...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.card}>
        <p style={styles.muted}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.moonIcon}>{MOON_ICONS[moonPhase] || "✦"}</span>
        <span style={styles.headerText}>
          {moonPhase ? moonPhase.replace(/_/g, " ") : ""} · {signName}
        </span>
      </div>
      <p style={styles.content}>{content}</p>
    </div>
  );
}

const styles = {
  card: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #5B2A86",
    background:
      "radial-gradient(circle at top left, rgba(91,42,134,0.3), rgba(11,6,20,0.7))",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  moonIcon: { fontSize: "18px" },
  headerText: {
    color: "#FFD700",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
    letterSpacing: "0.5px",
  },
  content: {
    color: "#f0e6ff",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: 0,
  },
  muted: { color: "#a893c9", fontSize: "13px", margin: 0 },
};