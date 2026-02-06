import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, Palette } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();
  const items = [
    { to: createPageUrl("Home"), label: "Home", icon: Home },
    { to: createPageUrl("ReadingRoom"), label: "Read", icon: BookOpen },
    { to: createPageUrl("Studio"), label: "Studio", icon: Palette },
    { to: createPageUrl("Journal"), label: "Journal", icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-50">
      <div className="backdrop-blur-lg bg-black/70 border-t border-white/10 flex items-stretch justify-around pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === new URL(to, window.location.origin).pathname;
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-1 px-3 py-1 text-xs">
              <Icon className={`w-5 h-5 ${active ? 'text-purple-400' : 'text-white/70'}`} />
              <span className={`${active ? 'text-purple-300' : 'text-white/60'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}