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
              Combine,
              X,
              Image as ImageIcon,
              Coins,
              CheckCircle2,
              Palette,
              Layers,
              Sparkles,
              Sun,
              Moon,
              Laptop
            } from "lucide-react";
import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
      } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [themePref, setThemePref] = useState('auto');
  const [theme, setTheme] = useState('dark');
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);

        // Mobile-safe: detect iOS and reduced motion to disable heavy background particles
        const isIOS = typeof navigator !== 'undefined' && (/iP(ad|hone|od)/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document));
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const disableBgParticles = isIOS || prefersReducedMotion;

  // FIXED: Only initialize once on mount, NOT on every page change
  useEffect(() => {
    let mounted = true;
    let timeoutId;
    
    const initializeApp = async () => {
      setIsLoading(true);
      setInitError(null);
      
      try {
        console.log('[Layout] Initializing app (attempt', retryCount + 1, ')...');
        
        // INCREASED timeout from 10s to 45s to handle slow servers
        timeoutId = setTimeout(() => {
          if (mounted) {
            const timeoutError = new Error('Request timeout - server is very slow. Please wait and try refreshing.');
            setInitError(timeoutError);
            setIsLoading(false);
            console.error('[Layout] User load timeout after 45s');
          }
        }, 45000); // 45 seconds
        
        // FIXED: Use queueApiCall with extended timeout for user loading
        const currentUser = await queueApiCall(
          () => base44.auth.me(),
          3, // 3 retries
          3000, // 3 second base delay
          30000 // 30 second timeout per attempt
        );
        
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        setUser(currentUser);
        setIsAdmin(isUserAdmin(currentUser));
        setInitError(null); // Clear any previous errors on success
        console.log('[Layout] User loaded successfully:', currentUser?.email);
        
      } catch (error) {
        if (!mounted) return;
        
        clearTimeout(timeoutId);
        console.error('[Layout] Initialization error:', error);
        
        // Check if it's authentication error (user not logged in) - this is OK
        const isAuthError = error?.response?.status === 401 || 
                           error?.message?.toLowerCase().includes('unauthorized') ||
                           error?.message?.toLowerCase().includes('not authenticated');
        
        if (isAuthError) {
          // User not logged in - this is fine, app can work without auth
          setUser(null);
          setIsAdmin(false);
          setInitError(null); // No error for unauthenticated state
          console.log('[Layout] User not authenticated (OK for public pages)');
        } else {
          // Real error - but DON'T block the whole app, just log it
          // Many pages can work without user data
          console.warn('[Layout] Failed to load user, but attempting to continue anyway:', error.message);
          setUser(null);
          setIsAdmin(false);
          
          // Only set init error for truly critical failures on first few attempts
          const isCriticalError = error?.message?.toLowerCase().includes('timeout') ||
                                 error?.code === 'ECONNABORTED' ||
                                 error?.message?.toLowerCase().includes('network error');
          
          if (isCriticalError && retryCount < 1) { // Only show error on first 2 attempts, then just continue
            setInitError(error);
          } else {
            // After retries or non-critical errors, just continue without user
            setInitError(null);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [retryCount]); // REMOVED currentPageName - only run on mount or retry

  // Enforce authentication globally: if unauthenticated, auto-redirect to login
  useEffect(() => {
    if (!isLoading && !user && !redirectingToLogin) {
      setRedirectingToLogin(true);
      try {
        const next = window.location.href;
        base44.auth.redirectToLogin(next);
      } catch (_) {
        base44.auth.redirectToLogin();
      }
    }
  }, [isLoading, user, redirectingToLogin]);

  useEffect(() => {
    const stopCloseBubbling = (e) => {
      // Limit interception strictly to our preview close elements, do not block generic dialog closes
      const btn = e.target?.closest?.('[data-close-preview]');
      if (btn) {
        e.preventDefault?.();
        e.stopPropagation?.();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
          e.nativeEvent.stopImmediatePropagation();
        }
      }
    };

    document.addEventListener('mousedown', stopCloseBubbling, true);
    document.addEventListener('click', stopCloseBubbling, true);

    return () => {
      document.removeEventListener('mousedown', stopCloseBubbling, true);
      document.removeEventListener('click', stopCloseBubbling, true);
    };
  }, [currentPageName]);

  // Safety: ensure global scroll is never left locked between pages (iOS touch)
          useEffect(() => {
            try {
              document.body.style.overflow = '';
              document.documentElement.style.overflow = '';
              document.body.style.touchAction = '';
            } catch (e) {
              // no-op
            }
          }, [currentPageName]);

          // Set favicon to the new logo
          useEffect(() => {
            const faviconUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg";
            let link = document.querySelector("link[rel='icon']");
            if (!link) {
              link = document.createElement("link");
              link.setAttribute("rel", "icon");
              document.head.appendChild(link);
            }
            link.setAttribute("href", faviconUrl);
          }, []);

          // Theme: auto/dark/light with in-app override
          const applyTheme = (t) => {
            try {
              document.documentElement.setAttribute('data-theme', t);
            } catch (_) {}
          };

          useEffect(() => {
            const saved = localStorage.getItem('themePref') || 'auto';
            setThemePref(saved);
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            const compute = (pref) => pref === 'light' ? 'light' : pref === 'dark' ? 'dark' : (mql.matches ? 'dark' : 'light');
            const t = compute(saved);
            setTheme(t);
            applyTheme(t);
            const onChange = (e) => {
              if ((localStorage.getItem('themePref') || 'auto') === 'auto') {
                const nt = e.matches ? 'dark' : 'light';
                setTheme(nt);
                applyTheme(nt);
              }
            };
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
          }, []);

          const changeThemePref = (pref) => {
                            setThemePref(pref);
                            try { localStorage.setItem('themePref', pref); } catch (_) {}
                            const mql = window.matchMedia('(prefers-color-scheme: dark)');
                            const newT = pref === 'light' ? 'light' : pref === 'dark' ? 'dark' : (mql.matches ? 'dark' : 'light');
                            setTheme(newT);
                            applyTheme(newT);
                          };

                          // Ensure root ("/") redirects to Home as the first page
                          useEffect(() => {
                            try {
                              if (window.location.pathname === '/' || window.location.pathname === '') {
                                navigate(createPageUrl('Home'), { replace: true });
                              }
                            } catch (_) {}
                          }, []);

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl('Home'));
  };

  const handleMobileBack = () => {
    const readingRelatedPages = new Set([
      'ReadingRoom', 'ReadingSimple', 'SharedReading', 'History', 'CardInfo', 'CardGallery', 'DeckView'
    ]);

    try {
      const params = new URLSearchParams(window.location.search);
      const deckId = params.get('deck_id') || params.get('deckId') || params.get('deck');
      const spread = params.get('spread') || params.get('spread_id') || params.get('spreadId');
      const question = params.get('question') || params.get('q');

      if (readingRelatedPages.has(currentPageName) && currentPageName !== 'Reading' && deckId) {
        const query = new URLSearchParams();
        query.set('deck_id', deckId);
        if (spread) query.set('spread', spread);
        if (question) query.set('question', question);
        navigate(createPageUrl(`Reading?${query.toString()}`));
        return;
      }
    } catch (_) {}

    if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate(createPageUrl('Dashboard'));
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
    { href: "FusionReading", icon: Combine, label: "Fusions" },
    { href: "ZodiacReading", icon: Star, label: "Zodiac" }
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
    // AI Workspace is admin-only; we'll filter it from non-admin view below
    { href: "AIWorkspace", icon: Sparkles, label: "🤖 AI Workspace" },
  ];

  const adminLinks = [
            { href: "AdminUsers", icon: Users, label: "Manage Users" },
            { href: "AdminDeckReview", icon: CheckCircle2, label: "Review Decks" },
            { href: "AdminTokenGrant", icon: Coins, label: "Token Grant" },
            { href: "SpreadSeeder", icon: Sprout, label: "Seed Spreads" },
            { href: "AvatarJobs", icon: Sparkles, label: "Avatar Jobs" },
          ];

  const adminPages = new Set(adminLinks.map(l => l.href));
      const isProTier = ['oracle_pro','creator'].includes(String(user?.subscription_tier || '').toLowerCase());
      const canAccessCurrentPage = isAdmin || (currentPageName === 'AvatarJobs' && isProTier);

  // Redirect non-admins from AIWorkspace to Dashboard
  React.useEffect(() => {
    if (currentPageName === 'AIWorkspace' && !isAdmin) {
                navigate(createPageUrl('Dashboard'));
    }
  }, [currentPageName, isAdmin]);
  const hideFloatingSaveOn = new Set(["DeckView", "Reading", "DeckGallery", "CreateDeck"]);

  // Show initialization error ONLY for critical failures and while still loading
  if (initError && isLoading) {
    return (
      <InitializationError 
        error={initError} 
        onRetry={() => setRetryCount(prev => prev + 1)}
      />
    );
  }

  if (redirectingToLogin) {
    return <div className="min-h-screen flex items-center justify-center text-white/80">Redirecting to login…</div>;
  }

  if (currentPageName === 'Home') {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <NetworkBanner />
        {children}
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <NetworkBanner />
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-slate-900 to-blue-950/60"></div>
          <div className="absolute inset-0 pointer-events-none" style={{ display: disableBgParticles ? 'none' : 'block' }}>
            <div className="particle" style={{'--d': '25s', '--x': '10vw', '--y': '15vh', '--s': '2px'}}></div>
            <div className="particle" style={{'--d': '45s', '--x': '90vw', '--y': '80vh', '--s': '3px'}}></div>
            <div className="particle" style={{'--d': '35s', '--x': '50vw', '--y': '30vh', '--s': '1px'}}></div>
            <div className="particle" style={{'--d': '55s', '--x': '25vw', '--y': '90vh', '--s': '2.5px'}}></div>
            <div className="particle" style={{'--d': '40s', '--x': '75vw', '--y': '10vh', '--s': '1.5px'}}></div>
            <div className="particle" style={{'--d': '60s', '--x': '5vw', '--y': '60vh', '--s': '2px'}}></div>
          </div>
        </div>
        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0); opacity: 1; }
              100% { transform: translateY(-100vh); opacity: 0; }
            }
            .particle {
              position: absolute;
              left: var(--x);
              top: 100vh;
              width: var(--s);
              height: var(--s);
              background-color: rgba(192, 132, 252, 0.6);
              border-radius: 50%;
              animation: float linear infinite;
              animation-duration: var(--d);
              box-shadow: 0 0 5px rgba(192, 132, 252, 0.8);
            }

            :root {
              --neon-bg: #000000;
              --neon-panel: #06070a;
              --neon-text: #c8fff9;
              --neon-text-90: rgba(200,255,249,0.90);
              --neon-text-80: rgba(200,255,249,0.80);
              --neon-text-70: rgba(200,255,249,0.70);
              --neon-text-60: rgba(200,255,249,0.60);
              --neon-text-50: rgba(200,255,249,0.50);
              --neon-text-40: rgba(200,255,249,0.40);
              --neon-text-30: rgba(200,255,249,0.30);
              --neon-text-20: rgba(200,255,249,0.20);
              --neon-text-10: rgba(200,255,249,0.10);
              --neon-accent: #00ffd1;
              --neon-accent-2: #a855f7;
              --neon-accent-3: #ff2bd6;
              --neon-edge-10: rgba(0,255,209,0.10);
              --neon-edge-20: rgba(0,255,209,0.20);
              --neon-edge-30: rgba(0,255,209,0.30);
              --neon-edge-40: rgba(0,255,209,0.40);
              --neon-panel-5: rgba(0, 0, 0, 0.5);
              --neon-panel-8: rgba(0, 0, 0, 0.8);
            }

            html, body, #root {
              background-color: var(--neon-bg) !important;
              color: var(--neon-text) !important;
              min-height: 100dvh;
            }

            .text-white { color: var(--neon-text) !important; }
            .text-white\\/90 { color: var(--neon-text-90) !important; }
            .text-white\\/80 { color: var(--neon-text-80) !important; }
            .text-white\\/70 { color: var(--neon-text-70) !important; }
            .text-white\\/60 { color: var(--neon-text-60) !important; }
            .text-white\\/50 { color: var(--neon-text-50) !important; }
            .text-white\\/40 { color: var(--neon-text-40) !important; }
            .text-white\\/30 { color: var(--neon-text-30) !important; }
            .text-white\\/20 { color: var(--neon-text-20) !important; }
            .text-white\\/10 { color: var(--neon-text-10) !important; }

            .bg-white { background-color: var(--neon-panel) !important; }
            .bg-white\\/5  { background-color: rgba(0,255,209,0.06) !important; }
            .bg-white\\/10 { background-color: rgba(0,255,209,0.10) !important; }
            .bg-white\\/20 { background-color: rgba(0,255,209,0.16) !important; }
            .bg-white\\/30 { background-color: rgba(0,255,209,0.22) !important; }
            .bg-white\\/40 { background-color: rgba(0,255,209,0.28) !important; }
            .bg-white\\/50 { background-color: rgba(0,255,209,0.34) !important; }

            .border-white\\/10 { border-color: var(--neon-edge-10) !important; }
            .border-white\\/20 { border-color: var(--neon-edge-20) !important; }
            .border-white\\/30 { border-color: var(--neon-edge-30) !important; }
            .border-white\\/40 { border-color: var(--neon-edge-40) !important; }

            .bg-slate-800, .bg-slate-800\\/30, .bg-slate-800\\/50,
            .bg-slate-900, .bg-slate-900\\/50, .bg-slate-900\\/80 {
              background-color: var(--neon-panel) !important;
            }
            .border-slate-700, .border-slate-600 { border-color: var(--neon-edge-20) !important; }
            .border-purple-800\\/40 { border-color: var(--neon-edge-40) !important; }
            .border-purple-700 { border-color: var(--neon-edge-30) !important; }

            button, .btn, .shadcn-button, .ui-button {
              color: var(--neon-text) !important;
            }

            a:hover, button:hover {
              text-shadow: 0 0 6px var(--neon-accent-2);
            }

            ::-webkit-scrollbar { width: 10px; height: 10px; }
            ::-webkit-scrollbar-track { background: #000; }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, var(--neon-accent), var(--neon-accent-2));
              border-radius: 10px;
            }

            .btn-dark-outline {
              background-color: rgba(0,0,0,0.6) !important;
              border: 2px solid rgba(255,255,255,0.7) !important;
              color: var(--neon-text) !important;
              font-weight: 800 !important;
              border-radius: 9999px !important;
              padding-left: 1rem !important;
              padding-right: 1rem !important;
              padding-top: 0.5rem !important;
              padding-bottom: 0.5rem !important;
              box-shadow: 0 0 10px rgba(168,85,247,0.25) inset, 0 2px 10px rgba(0,0,0,0.4);
              backdrop-filter: blur(6px);
            }
            .btn-dark-outline:hover {
              background-color: rgba(0,0,0,0.8) !important;
              box-shadow: 0 0 14px rgba(168,85,247,0.4) inset, 0 4px 16px rgba(0,0,0,0.6);
            }
            .btn-dark-outline .lucide {
              stroke-width: 2.5px;
            }

            .deck-read-button {
              background-color: rgba(0,0,0,0.6) !important;
              border: 2px solid rgba(255,255,255,0.7) !important;
              color: var(--neon-text) !important;
              font-weight: 800 !important;
              border-radius: 9999px !important;
            }
            .deck-read-button:hover {
              background-color: rgba(0,0,0,0.8) !important;
            }

            .reading-bottom-sheet {
              position: fixed;
              left: 0;
              right: 0;
              bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
              z-index: 100;
              pointer-events: auto;
            }
            @media (min-width: 768px) {
              .reading-bottom-sheet {
                bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
              }
            }
          `}
        </style>
        <style>
          {`
            .hover\\:bg-white:hover,
            .hover\\:bg-white\\/5:hover,
            .hover\\:bg-white\\/10:hover,
            .hover\\:bg-white\\/20:hover,
            .hover\\:bg-white\\/30:hover,
            .hover\\:bg-gray-50:hover,
            .hover\\:bg-gray-100:hover {
              background-color: rgba(0,255,209,0.12) !important;
            }

            .bg-gray-50, .bg-gray-100, .bg-zinc-50, .bg-neutral-50 {
              background-color: var(--neon-panel) !important;
            }

            .text-black, .text-gray-900, .text-zinc-900, .text-slate-900, .text-neutral-900 {
              color: var(--neon-text) !important;
            }

            .ring-white, .focus\\:ring-white:focus, .focus-visible\\:ring-white:focus-visible,
            .ring-gray-200, .focus\\:ring-gray-200:focus, .focus-visible\\:ring-gray-200:focus-visible {
              --tw-ring-color: var(--neon-accent) !important;
            }

            .border-white, .hover\\:border-white:hover {
              border-color: var(--neon-edge-30) !important;
            }

            /* Global mobile UX tweaks */
            body { overscroll-behavior-y: none; }
            button, [role="button"], .lucide, .shadcn-button, .ui-button, a { user-select: none; -webkit-user-select: none; -ms-user-select: none; }

            /* Touch gesture hardening */
            a, button, [role="button"] { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
            /* Ensure text inputs remain selectable */
            input, textarea, select { user-select: text; -webkit-user-select: text; }
            /* Prevent icon layers from stealing taps */
            .lucide { pointer-events: none; }
            /* Contain scroll chaining in bottom sheets */
            .reading-bottom-sheet { overscroll-behavior: contain; }

            /* Hide scrollbars on mobile but keep scroll */
            @media (max-width: 767px) {
              *::-webkit-scrollbar { display: none; width: 0; height: 0; }
              * { scrollbar-width: none; }
            }

            :root {
              --background: #000000;
              --foreground: var(--neon-text);
              --card: #06070a;
              --card-foreground: var(--neon-text);
              --popover: #06070a;
              --popover-foreground: var(--neon-text);
              --primary: #7c3aed;
              --primary-foreground: #e0e7ff;
              --secondary: #0b0c10;
              --secondary-foreground: var(--neon-text);
              --muted: #0b0c10;
              --muted-foreground: var(--neon-text-60);
              --accent: var(--neon-accent-2);
              --accent-foreground: var(--neon-text);
              --border: var(--neon-edge-20);
              --input: #12131a;
              --ring: var(--neon-accent);
            }
          `}
        </style>
        <style>
          {`
            /* Light theme overrides (brand-tinted) */
            [data-theme='light'] {
              --neon-bg: #f7f5ff;
              --neon-panel: #ffffff;
              --neon-text: #111827;
              --neon-text-90: rgba(17,24,39,0.90);
              --neon-text-80: rgba(17,24,39,0.80);
              --neon-text-70: rgba(17,24,39,0.70);
              --neon-text-60: rgba(17,24,39,0.60);
              --neon-text-50: rgba(17,24,39,0.50);
              --neon-text-40: rgba(17,24,39,0.40);
              --neon-text-30: rgba(17,24,39,0.30);
              --neon-text-20: rgba(17,24,39,0.20);
              --neon-text-10: rgba(17,24,39,0.10);
              --neon-accent: #7c3aed;
              --neon-accent-2: #7c3aed;
              --neon-accent-3: #a78bfa;
              --neon-edge-10: rgba(124,58,237,0.10);
              --neon-edge-20: rgba(124,58,237,0.20);
              --neon-edge-30: rgba(124,58,237,0.30);
              --neon-edge-40: rgba(124,58,237,0.40);
              --neon-panel-5: rgba(255,255,255,0.5);
              --neon-panel-8: rgba(255,255,255,0.8);
            }
            [data-theme='light'] html, [data-theme='light'] body, [data-theme='light'] #root {
              background-color: var(--neon-bg) !important;
              color: var(--neon-text) !important;
            }
            [data-theme='light'] .bg-white,
            [data-theme='light'] .bg-slate-800, 
            [data-theme='light'] .bg-slate-900,
            [data-theme='light'] .bg-slate-800\\/30, 
            [data-theme='light'] .bg-slate-800\\/50,
            [data-theme='light'] .bg-slate-900\\/50, 
            [data-theme='light'] .bg-slate-900\\/80 {
              background-color: var(--neon-panel) !important;
            }
            [data-theme='light'] .border-slate-700, 
            [data-theme='light'] .border-slate-600, 
            [data-theme='light'] .border-purple-800\\/40, 
            [data-theme='light'] .border-purple-700 {
              border-color: var(--neon-edge-20) !important;
            }
            [data-theme='light'] .text-white, 
            [data-theme='light'] .text-white\\/90, 
            [data-theme='light'] .text-white\\/80, 
            [data-theme='light'] .text-white\\/70, 
            [data-theme='light'] .text-white\\/60, 
            [data-theme='light'] .text-white\\/50, 
            [data-theme='light'] .text-white\\/40, 
            [data-theme='light'] .text-white\\/30 {
              color: var(--neon-text) !important;
            }
          `}
        </style>

        <div className="flex flex-1 bg-transparent">
          {/* Sidebar hidden on mobile; bottom nav used instead */}
          <aside
            className={`bg-slate-900/80 backdrop-blur-lg border-r border-purple-800/40 w-64 flex flex-col overflow-hidden fixed inset-y-0 left-0 z-50 transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex`}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-purple-800/40 flex-shrink-0">
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg" alt="Logo" className="h-8 w-8" />
                <span className="font-bold text-lg text-white">Astral Insight</span>
              </Link>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-purple-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              <p className="px-4 pt-2 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">Main</p>
              <NavLink to={createPageUrl("Home")}>
                <Home className="w-5 h-5 mr-3" />
                Home
              </NavLink>

              <div className="pt-4">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">Reading</p>
                {readingLinks.map(link => (
                  <NavLink key={link.href} to={createPageUrl(link.href)}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
                
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-blue-400/60 uppercase tracking-wider">Special</p>
                {specialReadings.map(link => (
                  <NavLink key={link.href} to={createPageUrl(link.href)}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-4">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">🎨 Studio</p>
                {studioLinks.map(link => (
                  <NavLink key={link.href} to={createPageUrl(link.href)}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-4">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">More</p>
                {moreLinks
                  .filter(link => isAdmin || link.href !== 'AIWorkspace')
                  .map(link => (
                    <NavLink key={link.href} to={createPageUrl(link.href)}>
                      <link.icon className="w-5 h-5 mr-3" />
                      {link.label}
                    </NavLink>
                  ))}
              </div>

              {isAdmin && (
                <div className="pt-4">
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-red-400 uppercase tracking-wider">Admin</p>
                  {adminLinks.map(link => (
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
                    {theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    <span className="capitalize">{themePref === 'auto' ? 'auto' : theme}</span>
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
                      <Button variant="ghost" className="w-full justify-start text-left items-center gap-2 text-white hover:bg-purple-800/50">
                        <img 
                          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`} 
                          alt="User" 
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="truncate flex-1">{user.full_name || user.email}</span>
                        <ChevronDown className="w-4 h-4 text-purple-300" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-purple-700 text-white">
                        <DropdownMenuItem onSelect={handleLogout} className="hover:bg-purple-700/50 cursor-pointer">
                            <LogOut className="w-4 h-4 mr-2" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => base44.auth.redirectToLogin()} className="w-full bg-purple-600 hover:bg-purple-700">Login</Button>
              )}
            </div>
          </aside>

          <div className="flex-1 flex flex-col">
            <header className="md:hidden bg-slate-900/95 backdrop-blur-lg border-b border-purple-800/40 h-16 pt-[env(safe-area-inset-top)] flex items-center px-4 justify-between flex-shrink-0 sticky top-0 z-40">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="text-purple-300 hover:text-purple-100 active:scale-95 transition-all p-2 -ml-2 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <LayoutGrid className="w-6 h-6" />
              </button>
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg" alt="Logo" className="h-8 w-8" />
              </Link>
              {['Home','ReadingRoom','Studio','Journal'].includes(currentPageName) ? (
                <Link to={createPageUrl('Home')} className="text-purple-300 hover:text-purple-100 active:scale-95 transition-all p-2 -mr-2 touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg" alt="Logo" className="h-6 w-6 rounded" />
                </Link>
              ) : (
                <button 
                  onClick={handleMobileBack} 
                  className="text-purple-300 hover:text-purple-100 active:scale-95 transition-all p-2 -mr-2 touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
            </header>

            <main className="flex-1 w-full" style={{ 
              overflowY: 'auto', 
              WebkitOverflowScrolling: 'touch',
              minHeight: '100dvh',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)'
            }}>
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
                    <p className="text-white/80">You don't have permission to view this area.</p>
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
              
              {!hideFloatingSaveOn.has(currentPageName) ? <FloatingSave /> : null}
            </main>
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
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