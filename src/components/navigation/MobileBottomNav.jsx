import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, Palette, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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
    <nav 
      className="md:hidden fixed left-0 w-full bg-[#07050f]/95 border-b border-[#a078ff]/15 backdrop-blur-[16px] z-[100]" 
      style={{ top: "calc(4rem + env(safe-area-inset-top, 0px))" }}
    >
      <Carousel opts={{ align: "start", dragFree: true, loop: true }} className="w-full max-w-[100vw] overflow-hidden relative touch-pan-y">
        <CarouselContent className="m-0 py-3 px-2">
          {[
            { key: "Home", icon: "⌂", label: "Hub" },
            { key: "Read", icon: "◎", label: "Read" },
            { key: "Studio", icon: "⬡", label: "Studio" },
            { key: "Journal", icon: "◈", label: "Journal" },
            { key: "Agent", icon: "✦", label: "Agent" },
          ].map(tab => {
            const active = activeTab === tab.key;
            return (
              <CarouselItem key={tab.key} className="basis-auto shrink-0 pl-3">
                <button
                  onClick={() => handleTabClick(tabs.find(t => t.key === tab.key))}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 border transition-all ${
                    active 
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(124,58,237,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  <span className="text-xl leading-none mb-0.5 font-['Cinzel']">{tab.icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider font-['Cinzel']">{tab.label}</span>
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </nav>
  );
}