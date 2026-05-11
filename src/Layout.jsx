import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  History,
  HelpCircle,
  Users,
  LogOut,
  ChevronDown,
  ChevronLeft,
  LayoutGrid,
  Star,
  Sprout,
  Heart,
  GitMerge,
  X,
  Image as ImageIcon,
  Coins,
  CheckCircle2,
  Palette,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FloatingSave from "@/components/common/FloatingSave";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { isUserAdmin } from "@/components/utils/adminGuard";
import NetworkBanner from "@/components/common/NetworkBanner";
import TokenBalanceDisplay from "@/components/pricing/TokenBalanceDisplay";
import AppErrorBoundary from "@/components/common/AppErrorBoundary";
import InitializationError from "@/components/common/InitializationError";
import { queueApiCall } from "@/components/utils/apiQueue";

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "bg-purple-600/50 text-white"
          : "text-purple-200 hover:bg-purple-800/50 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
};

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [themePref, setThemePref] = useState("auto");
  const [theme, setTheme] = useState("dark");
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);

  // Mobile-safe: disable heavy background particles on iOS / reduced motion
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iP(ad|hone|od)/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") &&
        typeof document !== "undefined" &&
        "ontouchend" in document));
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disableBgParticles = isIOS || prefersReducedMotion;

  // Initialize app — only runs on mount / explicit retry
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const initializeApp = async () => {
      setIsLoading(true);
      setInitError(null);

      try {
        timeoutId = setTimeout(() => {
          if (mounted) {
            setInitError(
              new Error(
                "Request timeout — server is very slow. Please wait and try refreshing."
              )
            );
            setIsLoading(false);
          }
        }, 45000);

        const currentUser = await queueApiCall(
          () => base44.auth.me(),
          3,
          3000,
          30000
        );

        if (!mounted) return;
        clearTimeout(timeoutId);
        setUser(currentUser);
        setIsAdmin(isUserAdmin(currentUser));
        setInitError(null);
      } catch (error) {
        if (!mounted) return;
        clearTimeout(timeoutId);

        const isAuthError =
          error?.response?.status === 401 ||
          error?.message?.toLowerCase().includes("unauthorized") ||
          error?.message?.toLowerCase().includes("not authenticated");

        if (isAuthError) {
          setUser(null);
          setIsAdmin(false);
          setInitError(null);
        } else {
          setUser(null);
          setIsAdmin(false);
          const isCriticalError =
            error?.message?.toLowerCase().includes("timeout") ||
            error?.code === "ECONNABORTED" ||
            error?.message?.toLowerCase().includes("network error");

          if (isCriticalError && retryCount < 1) {
            setInitError(error);
          } else {
            setInitError(null);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeApp();
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [retryCount]);

  // Auth redirect — send unauthenticated users to login
  useEffect(() => {
    const inBuilderPreview = (() => {
      try {
        return window.top !== window.self;
      } catch (_) {
        return true;
      }
    })();

    const pathname = location.pathname.toLowerCase();
    const isLoginRoute =
      pathname === "/login" ||
      pathname.startsWith("/login") ||
      pathname.includes("/auth");

    if (
      !inBuilderPreview &&
      !isLoading &&
      !user &&
      !redirectingToLogin &&
      !isLoginRoute
    ) {
      setRedirectingToLogin(true);
      try {
        let next = window.location.href;
        if (/\/login/i.test(next)) {
          next = window.location.origin + createPageUrl("Dashboard");
        }
        base44.auth.redirectToLogin(next);
      } catch (_) {
        base44.auth.redirectToLogin();
      }
    }

    if (!inBuilderPreview && isLoginRoute && !redirectingToLogin) {
      setRedirectingToLogin(true);
      try {
        const next = window.location.origin + createPageUrl("Dashboard");
        base44.auth.redirectToLogin(next);
      } catch (_) {
        base44.auth.redirectToLogin();
      }
    }
  }, [isLoading, user, redirectingToLogin, location.pathname]);

  // Stop preview-close click bubbling
  useEffect(() => {
    const stopCloseBubbling = (e) => {
      const btn = e.target?.closest?.("[data-close-preview]");
      if (btn) {
        e.preventDefault?.();
        e.stopPropagation?.();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
          e.nativeEvent.stopImmediatePropagation();
        }
      }
    };
    document.addEventListener("mousedown", stopCloseBubbling, true);
    document.addEventListener("click", stopCloseBubbling, true);
    return () => {
      document.removeEventListener("mousedown", stopCloseBubbling, true);
      document.removeEventListener("click", stopCloseBubbling, true);
    };
  }, [currentPageName]);

  // Unlock scroll between page transitions (iOS touch)
  useEffect(() => {
    try {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    } catch (_) {}
  }, [currentPageName]);

  // Theme: auto / dark / light
  const applyTheme = (t) => {
    try {
      document.documentElement.setAttribute("data-theme", t);
    } catch (_) {}
  };

  useEffect(() => {
    const saved = localStorage.getItem("themePref") || "auto";
    setThemePref(saved);
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const compute = (pref) =>
      pref === "light"
        ? "light"
        : pref === "dark"
        ? "dark"
        : mql.matches
        ? "dark"
        : "light";
    const t = compute(saved);
    setTheme(t);
    applyTheme(t);
    const onChange = (e) => {
      if ((localStorage.getItem("themePref") || "auto") === "auto") {
        const nt = e.matches ? "dark" : "light";
        setTheme(nt);
        applyTheme(nt);
      }
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const changeThemePref = (pref) => {
    setThemePref(pref);
    try {
      localStorage.setItem("themePref", pref);
    } catch (_) {}
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const newT =
      pref === "light"
        ? "light"
        : pref === "dark"
        ? "dark"
        : mql.matches
        ? "dark"
        : "light";
    setTheme(newT);
    applyTheme(newT);
  };

  // Redirect "/" to Home
  useEffect(() => {
    try {
      if (
        window.location.pathname === "/" ||
        window.location.pathname === ""
      ) {
        navigate(createPageUrl("Home"), { replace: true });
      }
    } catch (_) {}
  }, []);

  // Redirect non-admins away from AIWorkspace
  useEffect(() => {
    if (currentPageName === "AIWorkspace" && !isAdmin) {
      navigate(createPageUrl("Dashboard"));
    }
  }, [currentPageName, isAdmin]);

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl("Home"));
  };

  // Mobile back button — uses React Router location instead of window.location
  const handleMobileBack = () => {
    const readingRelatedPages = new Set([
      "ReadingRoom",
      "ReadingSimple",
      "SharedReading",
      "History",
      "CardInfo",
      "CardGallery",
      "DeckView",
    ]);

    try {
      const params = new URLSearchParams(location.search);
      const deckId =
        params.get("deck_id") || params.get("deckId") || params.get("deck");
      const spread =
        params.get("spread") ||
        params.get("spread_id") ||
        params.get("spreadId");
      const question = params.get("question") || params.get("q");

      if (
        readingRelatedPages.has(currentPageName) &&
        currentPageName !== "Reading" &&
        deckId
      ) {
        const query = new URLSearchParams();
        query.set("deck_id", deckId);
        if (spread) query.set("spread", spread);
        if (question) query.set("question", question);
        navigate(createPageUrl(`Reading?${query.toString()}`));
        return;
      }
    } catch (_) {}

    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const readingLinks = [
    { href: "ReadingRoom", icon: BookOpen, label: "Reading Room" },
    { href: "Reading", icon: Sprout, label: "Start Reading" },
    { href: "History", icon: History, label: "Reading History" },
    { href: "Journal", icon: BookOpen, label: "Journal" },
    { href: "Explore", icon: Users, label: "Explore Creators" },
  ];

  const specialReadings = [
    { href: "FusionReading", icon: GitMerge, label: "Fusions" },
    { href: "ZodiacReading", icon: Star, label: "Zodiac" },
  ];

  const studioLinks = [
    { href: "Studio", icon: Palette, label: "My Decks" },
    { href: "CreateDeck", icon: Sprout, label: "Create Deck" },
    { href: "SpreadManager", icon: Layers, label: "Spreads" },
    { href: "PhotoUploader", icon: ImageIcon, label: "Photo Library" },
    { href: "Persona", icon: Sparkles, label: "Persona" },
  ];

  const moreLinks = [
    { href: "Help", icon: HelpCircle, label: "Help & Guides" },
    { href: "SubscriptionManagement", icon: Coins, label: "Subscription" },
    { href: "Account", icon: Users, label: "Account" },
    { href: "LiveAgent", icon: Sparkles, label: "Live Agent" },
    { href: "DIDDemo", icon: Sparkles, label: "D-ID Demo" },
    { href: "AIWorkspace", icon: Sparkles, label: "🤖 AI Workspace" },
  ];

  const adminLinks = [
    { href: "AdminUsers", icon: Users, label: "Manage Users" },
    { href: "AdminDeckReview", icon: CheckCircle2, label: "Review Decks" },
    { href: "AdminTokenGrant", icon: Coins, label: "Token Grant" },
    { href: "SpreadSeeder", icon: Sprout, label: "Seed Spreads" },
  ];

  const adminPages = new Set(adminLinks.map((l) => l.href));
  const canAccessCurrentPage = isAdmin;

  const hideFloatingSaveOn = new Set([
    "DeckView",
    "Reading",
    "DeckGallery",
    "CreateDeck",
  ]);

  if (initError && isLoading) {
    return (
      <InitializationError
        error={initError}
        onRetry={() => setRetryCount((prev) => prev + 1)}
      />
    );
  }

  if (redirectingToLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        Redirecting to login…
      </div>
    );
  }

  if (currentPageName === "Home") {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <NetworkBanner />
        {children}
        {!user && !redirectingToLogin ? (
          <div className="fixed z-[60] top-3 right-3">
            <Button
              size="sm"
              className="btn-dark-outline"
              onClick={() => {
                try {
                  base44.auth.redirectToLogin(window.location.href);
                } catch (_) {
                  base44.auth.redirectToLogin();
                }
              }}
            >
              Login
            </Button>
          </div>
        ) : (
          <div className="fixed z-[60] top-3 right-3 flex gap-2">
            <Link to={createPageUrl("Dashboard")}>
              <Button size="sm" className="btn-dark-outline">
                Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <NetworkBanner />

        {/* Fixed background */}
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-slate-900 to-blue-950/60" />
          {!disableBgParticles && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="particle" style={{ "--d": "25s", "--x": "10vw",  "--y": "15vh", "--s": "2px"   }} />
              <div className="particle" style={{ "--d": "45s", "--x": "90vw",  "--y": "80vh", "--s": "3px"   }} />
              <div className="particle" style={{ "--d": "35s", "--x": "50vw",  "--y": "30vh", "--s": "1px"   }} />
              <div className="particle" style={{ "--d": "55s", "--x": "25vw",  "--y": "90vh", "--s": "2.5px" }} />
              <div className="particle" style={{ "--d": "40s", "--x": "75vw",  "--y": "10vh", "--s": "1.5px" }} />
              <div className="particle" style={{ "--d": "60s", "--x": "5vw",   "--y": "60vh", "--s": "2px"   }} />
            </div>
          )}
        </div>

        <div className="flex flex-1 bg-transparent">
          {/* Sidebar */}
          <aside
            className={`bg-slate-900/80 backdrop-blur-lg border-r border-purple-800/40 w-64 flex flex-col overflow-hidden fixed inset-y-0 left-0 z-50 transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex`}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-purple-800/40 flex-shrink-0">
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg"
                  alt="Logo"
                  className="h-8 w-8"
                />
                <span className="font-bold text-lg text-white">Astral Insight</span>
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden text-purple-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              <p className="px-4 pt-2 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Main
              </p>
              <NavLink to={createPageUrl("Home")}>
                <Home className="w-5 h-5 mr-3" />
                Home
              </NavLink>

              <div className="pt-4">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Reading
                </p>
                {readingLinks.map((link) => (
                  <NavLink key={link.href} to={createPageUrl(link.href)}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-blue-400/60 uppercase tracking-wider">
                  Special
                </p>
                {specialReadings.map((link) => (
                  <NavLink key={link.href} to={createPageUrl(link.href)}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-4">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  🎨 Studio
                </p>
                {studioLinks.map((link) => (
                  <NavLink key={link.href} to={createPageUrl(link.href)}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-4">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  More
                </p>
                {moreLinks
                  .filter((link) => isAdmin || link.href !== "AIWorkspace")
                  .map((link) => (
                    <NavLink key={link.href} to={createPageUrl(link.href)}>
                      <link.icon className="w-5 h-5 mr-3" />
                      {link.label}
                    </NavLink>
                  ))}
              </div>

              {isAdmin && (
                <div className="pt-4">
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-red-400 uppercase tracking-wider">
                    Admin
                  </p>
                  {adminLinks.map((link) => (
                    <NavLink key={link.href} to={createPageUrl(link.href)}>
                      <link.icon className="w-5 h-5 mr-3" />
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </nav>

            <div className="px-4 py-4 mt-auto border-t border-purple-800/40 space-y-3">
              {/* Theme selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span>Theme</span>
                  <span className="inline-flex items-center gap-1">
                    {theme === "light" ? (
                      <Sun className="w-4 h-4" />
                    ) : theme === "dark" ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                    <span className="capitalize">
                      {themePref === "auto" ? "auto" : theme}
                    </span>
                  </span>
                </div>
                <Select value={themePref} onValueChange={changeThemePref}>
                  <SelectTrigger className="w-full bg-slate-800/50 border-purple-700 text-white">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-700 text-white">
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user && (
                <div className="flex justify-center">
                  <TokenBalanceDisplay balance={user.token_balance} />
                </div>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left items-center gap-2 text-white hover:bg-purple-800/50"
                    >
                      <img
                        src={
                          user.user_metadata?.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`
                        }
                        alt="User"
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="truncate flex-1">
                        {user.full_name || user.email}
                      </span>
                      <ChevronDown className="w-4 h-4 text-purple-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-800 border-purple-700 text-white">
                    <DropdownMenuItem
                      onSelect={handleLogout}
                      className="hover:bg-purple-700/50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => {
                    try {
                      base44.auth.redirectToLogin(window.location.href);
                    } catch (_) {
                      base44.auth.redirectToLogin();
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Login
                </Button>
              )}
            </div>
          </aside>

          <div className="flex-1 flex flex-col">
            {/* Mobile header */}
            <header className="md:hidden bg-slate-900/95 backdrop-blur-lg border-b border-purple-800/40 h-16 pt-[env(safe-area-inset-top)] flex items-center px-4 justify-between flex-shrink-0 sticky top-0 z-40">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-purple-300 hover:text-purple-100 active:scale-95 transition-all p-2 -ml-2 touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <LayoutGrid className="w-6 h-6" />
              </button>
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg"
                  alt="Logo"
                  className="h-8 w-8"
                />
              </Link>
              {["Home", "ReadingRoom", "Studio", "Journal"].includes(
                currentPageName
              ) ? (
                <Link
                  to={createPageUrl("Home")}
                  className="text-purple-300 hover:text-purple-100 active:scale-95 transition-all p-2 -mr-2 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg"
                    alt="Logo"
                    className="h-6 w-6 rounded"
                  />
                </Link>
              ) : (
                <button
                  onClick={handleMobileBack}
                  className="text-purple-300 hover:text-purple-100 active:scale-95 transition-all p-2 -mr-2 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
            </header>

            <main
              className="flex-1 w-full"
              style={{
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                minHeight: "100dvh",
                paddingBottom:
                  "calc(env(safe-area-inset-bottom, 0px) + 96px)",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {adminPages.has(currentPageName) && !canAccessCurrentPage ? (
                  <motion.div
                    key="denied"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-3xl mx-auto p-6 mt-8 bg-slate-900/70 border border-purple-800/40 rounded-xl text-white"
                  >
                    <h2 className="text-2xl font-bold mb-2">Access denied</h2>
                    <p className="text-white/80">
                      You don't have permission to view this area.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentPageName}
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    {children}
                  </motion.div>
                )}
              </AnimatePresence>

              {!hideFloatingSaveOn.has(currentPageName) && <FloatingSave />}
            </main>
          </div>
        </div>

        <MobileBottomNav />

        {/* Unauthenticated login button */}
        {!user && !redirectingToLogin && (
          <div className="fixed z-[60] top-3 right-3">
            <Button
              size="sm"
              className="btn-dark-outline"
              onClick={() => {
                try {
                  base44.auth.redirectToLogin(window.location.href);
                } catch (_) {
                  base44.auth.redirectToLogin();
                }
              }}
            >
              Login
            </Button>
          </div>
        )}

        {/* Sidebar backdrop on mobile */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </AppErrorBoundary>
  );
}