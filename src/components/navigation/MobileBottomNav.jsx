import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, Palette, Sparkles } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: "Home", root: "/", label: "Hub", icon: Home },
    { key: "Read", root: createPageUrl("Dashboard"), label: "Read", icon: BookOpen },
    { key: "Studio", root: createPageUrl("Studio"), label: "Studio", icon: Palette },
    { key: "Journal", root: createPageUrl("Journal"), label: "Journal", icon: BookOpen },
    { key: "Agent", root: createPageUrl("AgentChat"), label: "Agent", icon: Sparkles },
  ];

  const getTabFromPath = (pathname) => {
    if (pathname.startsWith("/Reading") || pathname.startsWith("/History") || pathname.startsWith("/ZodiacReading") || pathname.startsWith("/FusionReading") || pathname.startsWith("/DeckGallery")) return "Read";
    if (pathname.startsWith("/Studio") || pathname.startsWith("/CreateDeck") || pathname.startsWith("/DeckView") || pathname.startsWith("/PhotoUploader") || pathname.startsWith("/SpreadManager")) return "Studio";
    if (pathname.startsWith("/Journal")) return "Journal";
    if (pathname.startsWith("/LiveAgent")) return "Agent";
    return "Home";
  };

  const [lastUrls, setLastUrls] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("tab_last_urls") || "{}");
      return {
        Home: saved.Home || tabs[0].root,
        Read: saved.Read || tabs[1].root,
        Studio: saved.Studio || tabs[2].root,
        Journal: saved.Journal || tabs[3].root,
        Agent: saved.Agent || tabs[4].root,
      };
    } catch {
      return { Home: tabs[0].root, Read: tabs[1].root, Studio: tabs[2].root, Journal: tabs[3].root, Agent: tabs[4].root };
    }
  });

  const activeTab = getTabFromPath(location.pathname);

  // Persist lastUrls
  useEffect(() => {
    sessionStorage.setItem("tab_last_urls", JSON.stringify(lastUrls));
  }, [lastUrls]);

  // Update current tab's last url on route changes
  useEffect(() => {
    const full = location.pathname + (location.search || "");
    setLastUrls((prev) => ({ ...prev, [activeTab]: full }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const handleTabClick = (tab) => {
    if (activeTab === tab.key) {
      // Re-tap active tab: reset to root
      setLastUrls((prev) => ({ ...prev, [tab.key]: tab.root }));
      navigate(tab.root);
      return;
    }
    // Save current url for current tab and go to target tab's last url
    setLastUrls((prev) => ({ ...prev, [activeTab]: location.pathname + (location.search || "") }));
    navigate(lastUrls[tab.key] || tab.root);
  };
  // replaced by tabs above

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#07050f]/95 border-t border-[#a078ff]/15 backdrop-blur-[16px] flex justify-around p-[8px_0_12px] z-[100] pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        {[
          { key: "Home", icon: "⌂" },
          { key: "Read", icon: "◎" },
          { key: "Studio", icon: "⬡" },
          { key: "Journal", icon: "◈" },
          { key: "Agent", icon: "✦" },
        ].map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tabs.find(t => t.key === tab.key))}
              className={`flex flex-col items-center gap-[3px] cursor-pointer transition-colors font-['Cinzel'] text-[8px] tracking-[0.1em] uppercase bg-transparent border-none p-[4px_8px] ${active ? 'text-[#a78bfa]' : 'text-[#b4a0dc]/45 hover:text-[#c8b4ff]/80'}`}
            >
              <span className="text-[18px] leading-[1]">{tab.icon}</span>
              {tab.key}
            </button>
          )
        })}
      </nav>
      {/* FAB - Global for mobile */}
      <button 
        onClick={() => handleTabClick(tabs.find(t => t.key === "Read"))}
        className="md:hidden fixed bottom-[72px] right-[20px] z-[99] w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] border-none cursor-pointer flex items-center justify-center text-[20px] text-white shadow-[0_4px_18px_rgba(124,58,237,0.5)] transition-all hover:scale-[1.08] hover:shadow-[0_6px_24px_rgba(124,58,237,0.65)] animate-[pulse_3s_ease_infinite]"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        ✦
      </button>
    </>
  );
}