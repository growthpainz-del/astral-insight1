import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, Palette } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: "Home", root: createPageUrl("Home"), label: "Home", icon: Home },
    { key: "Read", root: createPageUrl("ReadingRoom"), label: "Read", icon: BookOpen },
    { key: "Studio", root: createPageUrl("Studio"), label: "Studio", icon: Palette },
    { key: "Journal", root: createPageUrl("Journal"), label: "Journal", icon: BookOpen },
  ];

  const getTabFromPath = (pathname) => {
    if (pathname.startsWith("/ReadingRoom") || pathname.startsWith("/Reading") || pathname.startsWith("/History") || pathname.startsWith("/ZodiacReading") || pathname.startsWith("/FusionReading") || pathname.startsWith("/Rebel8Ball") || pathname.startsWith("/DeckGallery")) return "Read";
    if (pathname.startsWith("/Studio") || pathname.startsWith("/CreateDeck") || pathname.startsWith("/DeckView") || pathname.startsWith("/PhotoUploader") || pathname.startsWith("/SpreadManager")) return "Studio";
    if (pathname.startsWith("/Journal")) return "Journal";
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
      };
    } catch {
      return { Home: tabs[0].root, Read: tabs[1].root, Studio: tabs[2].root, Journal: tabs[3].root };
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
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-50">
      <div className="backdrop-blur-lg bg-black/70 border-t border-white/10 flex items-stretch justify-around pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === new URL(to, window.location.origin).pathname;
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-1 px-3 py-1 text-xs" preventScrollReset={true}>
              <Icon className={`w-5 h-5 ${active ? 'text-purple-400' : 'text-white/70'}`} />
              <span className={`${active ? 'text-purple-300' : 'text-white/60'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}