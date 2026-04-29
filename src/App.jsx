import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SpiritWheel from '@/pages/SpiritWheel';
import SpiritWheelDesigner from '@/pages/SpiritWheelDesigner';
import Pendulum from '@/pages/Pendulum';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import CardMaker from '@/pages/CardMaker';
import CardLibrary from '@/pages/CardLibrary';
import SpiritWheelCanvasTest from '@/pages/SpiritWheelCanvasTest';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
      <Route path="/SpiritWheel" element={<LayoutWrapper currentPageName="SpiritWheel"><SpiritWheel /></LayoutWrapper>} />
      <Route path="/SpiritWheelDesigner" element={<LayoutWrapper currentPageName="SpiritWheelDesigner"><SpiritWheelDesigner /></LayoutWrapper>} />
      <Route path="/Pendulum" element={<LayoutWrapper currentPageName="Pendulum"><Pendulum /></LayoutWrapper>} />
      <Route path="/PrivacyPolicy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
      <Route path="/CardMaker" element={<LayoutWrapper currentPageName="CardMaker"><CardMaker /></LayoutWrapper>} />
      <Route path="/CardLibrary" element={<LayoutWrapper currentPageName="CardLibrary"><CardLibrary /></LayoutWrapper>} />
      <Route path="/SpiritWheelCanvasTest" element={<LayoutWrapper currentPageName="SpiritWheelCanvasTest"><SpiritWheelCanvasTest /></LayoutWrapper>} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App