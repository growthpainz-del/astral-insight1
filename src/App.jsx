import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'

import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import ReadingRoom from './pages/ReadingRoom'
import SpiritWheel from './pages/SpiritWheel'
import SigilForge from './pages/SigilForge'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Pendulum from './pages/Pendulum'
import CardMaker from './pages/CardMaker'
import CardLibrary from './pages/CardLibrary'
import Studio from './pages/Studio'
import SpreadManager from './pages/SpreadManager'
import DashboardHub from './pages/DashboardHub'
import ReadingSetup from './pages/ReadingSetup'
import ReadingSimple from './pages/ReadingSimple'

const { Pages, Layout, mainPage } = pagesConfig

const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : null

// Pages that require admin role — guarded at route level
const ADMIN_ONLY_PAGES = new Set([
  'AdminUsers',
  'AdminDeckReview',
  'AdminTokenGrant',
])

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout
    ? <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>

/**
 * Wraps a page in an admin guard.
 * Redirects non-admins to Dashboard instead of silently showing an empty page.
 */
const AdminRoute = ({ Page, pageName, user }) => {
  if (!user) return <Navigate to="/DashboardHub" replace />
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-red-900/20 border border-red-500/40 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-red-200 mb-4">
            You need admin privileges to view this page.
          </p>
          <a href="/DashboardHub" className="text-purple-300 underline">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }
  return (
    <LayoutWrapper currentPageName={pageName}>
      <Page />
    </LayoutWrapper>
  )
}

const HomeRedirect = () => {
  const location = useLocation();
  return <Navigate to={{ pathname: '/', search: location.search }} replace />;
};

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    user,
    navigateToLogin,
  } = useAuth()

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />
    } else if (authError.type === 'auth_required') {
      navigateToLogin()
      return null
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            {MainPage && <MainPage />}
          </LayoutWrapper>
        }
      />
      <Route path="/Home" element={<HomeRedirect />} />
      <Route path="/Home/*" element={<HomeRedirect />} />
      <Route path="/home" element={<HomeRedirect />} />
      <Route path="/home/*" element={<HomeRedirect />} />

      <Route
        path="/DashboardHub"
        element={
          <LayoutWrapper currentPageName="DashboardHub">
            <DashboardHub />
          </LayoutWrapper>
        }
      />

      <Route
        path="/ReadingRoom"
        element={
          <LayoutWrapper currentPageName="ReadingRoom">
            <ReadingRoom />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SpiritWheel"
        element={
          <LayoutWrapper currentPageName="SpiritWheel">
            <SpiritWheel />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SigilForge"
        element={
          <LayoutWrapper currentPageName="SigilForge">
            <SigilForge />
          </LayoutWrapper>
        }
      />
      <Route
        path="/PrivacyPolicy"
        element={
          <LayoutWrapper currentPageName="PrivacyPolicy">
            <PrivacyPolicy />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Pendulum"
        element={
          <LayoutWrapper currentPageName="Pendulum">
            <Pendulum />
          </LayoutWrapper>
        }
      />
      <Route
        path="/CardMaker"
        element={
          <LayoutWrapper currentPageName="CardMaker">
            <CardMaker />
          </LayoutWrapper>
        }
      />
      <Route
        path="/CardLibrary"
        element={
          <LayoutWrapper currentPageName="CardLibrary">
            <CardLibrary />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Studio"
        element={
          <LayoutWrapper currentPageName="Studio">
            <Studio />
          </LayoutWrapper>
        }
      />

      <Route
        path="/SpreadManager"
        element={
          <LayoutWrapper currentPageName="SpreadManager">
            <SpreadManager />
          </LayoutWrapper>
        }
      />
      <Route
        path="/ReadingSetup"
        element={
          <LayoutWrapper currentPageName="ReadingSetup">
            <ReadingSetup />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Reading"
        element={
          <LayoutWrapper currentPageName="Reading">
            <ReadingSimple />
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages)
        .filter(([path]) => !['ReadingSimple', 'SpreadDesigner', 'SpreadTester'].includes(path))
        .map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            ADMIN_ONLY_PAGES.has(path)
              ? <AdminRoute Page={Page} pageName={path} user={user} />
              : (
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              )
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
// Triggering another GitHub sync