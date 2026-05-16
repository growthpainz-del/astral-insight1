import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, Palette, Sparkles, HelpCircle, Coins, Star } from "lucide-react";
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
    { key: "Help", root: createPageUrl("Help"), label: "Help", icon: HelpCircle },
    { key: "Tokens", root: createPageUrl("Account"), label: "Tokens", icon: Coins },
    { key: "Membership", root: createPageUrl("SubscriptionManagement"), label: "Membership", icon: Star },
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
      return {
        Home: saved.Home || tabs[0].root,
        Read: saved.Read || tabs[1].root,
        Studio: saved.Studio || tabs[2].root,
        Journal: saved.Journal || tabs[3].root,
        Agent: saved.Agent || tabs[4].root,
        Help: saved.Help || tabs[5].root,
        Tokens: saved.Tokens || tabs[6].root,
        Membership: saved.Membership || tabs[7].root,
      };
    } catch {
      return { 
        Home: tabs[0].root, Read: tabs[1].root, Studio: tabs[2].root, Journal: tabs[3].root, Agent: tabs[4].root,
        Help: tabs[5].root, Tokens: tabs[6].root, Membership: tabs[7].root
      };
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
            { key: "Home", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/191ca6b2e_F4082EFB-2830-4175-A49F-A7A110359B6D.png", label: "Hub" },
            { key: "Read", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9ff29b78d_9F83D3B4-B2C9-4CC6-91C3-2463FAF5CB23.png", label: "Read" },
            { key: "Studio", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4c1624134_3790AA04-E486-40D3-B922-C73E810A4B0E.png", label: "Studio" },
            { key: "Journal", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/813bc1daf_95CC2125-D656-406E-BF7A-11B463053039.png", label: "Journal" },
            { key: "Agent", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/59708a87f_9DD7135A-99D4-46D9-877B-4CE7401C7235.png", label: "Agent" },
            { key: "Help", icon: <HelpCircle className="w-4 h-4 mb-0.5" />, label: "Help" },
            { key: "Tokens", icon: <Coins className="w-4 h-4 mb-0.5" />, label: "Tokens" },
            { key: "Membership", icon: <Star className="w-4 h-4 mb-0.5" />, label: "Membership" },
          ].map(tab => {
            const active = activeTab === tab.key;
            return (
              <CarouselItem key={tab.key} className="basis-auto shrink-0 pl-3">
                <button
                  onClick={() => handleTabClick(tabs.find(t => t.key === tab.key))}
                  className={tab.img ? `flex items-center p-0 rounded-full transition-all ${active ? 'shadow-[0_0_12px_rgba(124,58,237,0.5)] ring-1 ring-purple-500/50' : 'opacity-80 hover:opacity-100'}` : `flex items-center gap-2 rounded-full px-5 py-2.5 border transition-all ${
                    active 
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(124,58,237,0.3)]' 
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-300/60 hover:bg-purple-500/20 hover:text-purple-200'
                  }`}
                  style={tab.img ? { height: "38px" } : {}}
                >
                  {tab.img ? (
                    <img src={tab.img} alt={tab.label} className="h-full w-auto object-contain rounded-full" />
                  ) : (
                    <>
                      <span className="flex items-center justify-center">{tab.icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider font-['Cinzel'] mt-0.5">{tab.label}</span>
                    </>
                  )}
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </nav>
  );
}