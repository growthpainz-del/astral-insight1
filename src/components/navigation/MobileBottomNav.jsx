import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HelpCircle, Coins, Star } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: "Home", root: "/", label: "Hub", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/191ca6b2e_F4082EFB-2830-4175-A49F-A7A110359B6D.png" },
    { key: "Read", root: createPageUrl("ReadingRoom"), label: "Read", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9ff29b78d_9F83D3B4-B2C9-4CC6-91C3-2463FAF5CB23.png" },
    { key: "Studio", root: createPageUrl("Studio"), label: "Studio", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4c1624134_3790AA04-E486-40D3-B922-C73E810A4B0E.png" },
    { key: "Journal", root: createPageUrl("Journal"), label: "Journal", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/813bc1daf_95CC2125-D656-406E-BF7A-11B463053039.png" },
    { key: "Agent", root: createPageUrl("AgentChat"), label: "CosMosis", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/59708a87f_9DD7135A-99D4-46D9-877B-4CE7401C7235.png" },
    { key: "Help", root: createPageUrl("Help"), label: "Help", icon: <HelpCircle size={18} /> },
    { key: "Tokens", root: createPageUrl("Account"), label: "Tokens", icon: <Coins size={18} /> },
    { key: "Membership", root: createPageUrl("SubscriptionManagement"), label: "Pro", icon: <Star size={18} /> },
  ];

  const getTabFromPath = (pathname) => {
    if (pathname.startsWith("/Reading") || pathname.startsWith("/History") || pathname.startsWith("/ZodiacReading") || pathname.startsWith("/FusionReading") || pathname.startsWith("/DeckGallery")) return "Read";
    if (pathname.startsWith("/Studio") || pathname.startsWith("/CreateDeck") || pathname.startsWith("/DeckView") || pathname.startsWith("/PhotoUploader") || pathname.startsWith("/SpreadManager")) return "Studio";
    if (pathname.startsWith("/Journal")) return "Journal";
    if (pathname.startsWith("/LiveAgent") || pathname.startsWith("/AgentChat")) return "Agent";
    if (pathname.startsWith("/Help")) return "Help";
    if (pathname.startsWith("/Account")) return "Tokens";
    if (pathname.startsWith("/SubscriptionManagement")) return "Membership";
    return "Home";
  };

  const [lastUrls, setLastUrls] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("tab_last_urls") || "{}");
      return tabs.reduce((acc, t) => ({ ...acc, [t.key]: saved[t.key] || t.root }), {});
    } catch {
      return tabs.reduce((acc, t) => ({ ...acc, [t.key]: t.root }), {});
    }
  });

  const activeTab = getTabFromPath(location.pathname);

  useEffect(() => {
    sessionStorage.setItem("tab_last_urls", JSON.stringify(lastUrls));
  }, [lastUrls]);

  useEffect(() => {
    const full = location.pathname + (location.search || "");
    setLastUrls(prev => ({ ...prev, [activeTab]: full }));
  }, [location.pathname, location.search]);

  const handleTabClick = (tab) => {
    if (activeTab === tab.key) {
      setLastUrls(prev => ({ ...prev, [tab.key]: tab.root }));
      navigate(tab.root);
      return;
    }
    setLastUrls(prev => ({ ...prev, [activeTab]: location.pathname + (location.search || "") }));
    navigate(lastUrls[tab.key] || tab.root);
  };

  // Hide completely on Reading page
  if (location.pathname.startsWith("/Reading")) return null;

  return (
    <>
      {/* Spacer so page content doesn't hide behind nav */}
      <div style={{ height: "calc(72px + env(safe-area-inset-bottom, 0px))" }} />

      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(7,5,15,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(160,120,255,0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <div style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "10px 12px",
          gap: 8,
          alignItems: "center",
        }}>
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: tab.img ? "row" : "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: tab.img ? 0 : 4,
                  padding: tab.img ? 0 : "8px 16px",
                  borderRadius: 999,
                  border: tab.img
                    ? "none"
                    : `1px solid ${active ? "rgba(167,139,250,0.5)" : "rgba(167,139,250,0.2)"}`,
                  background: tab.img
                    ? "transparent"
                    : active
                      ? "rgba(124,58,237,0.2)"
                      : "rgba(124,58,237,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: active && !tab.img ? "0 0 14px rgba(124,58,237,0.35)" : "none",
                  height: tab.img ? 42 : "auto",
                  outline: active && tab.img ? "2px solid rgba(167,139,250,0.5)" : "none",
                  outlineOffset: 2,
                  opacity: !active && tab.img ? 0.7 : 1,
                }}
              >
                {tab.img ? (
                  <img
                    src={tab.img}
                    alt={tab.label}
                    style={{ height: 42, width: "auto", objectFit: "contain", borderRadius: 999 }}
                  />
                ) : (
                  <>
                    <span style={{ color: active ? "#c084fc" : "rgba(192,132,252,0.5)", display: "flex" }}>{tab.icon}</span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: active ? "#c084fc" : "rgba(192,132,252,0.5)",
                      fontFamily: "Cinzel, serif",
                      whiteSpace: "nowrap",
                    }}>{tab.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <style>{`.fixed-nav-scroll::-webkit-scrollbar { display: none; }`}</style>
      </nav>
    </>
  );
}