import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SmartAssistant } from './pages/SmartAssistant';
import { Tools } from './pages/Tools';
import { SystemDesign } from './pages/SystemDesign';
import { Sales } from './pages/Sales';
import { Trade } from './pages/Trade';
import { Finance } from './pages/Finance';
import { Compliance } from './pages/Compliance';
import { AppRoute } from './types';
import { ReceiptScanner } from './pages/Tools/ReceiptScanner';
import { InventoryVideo } from './pages/Tools/InventoryVideo';
import { BusinessStrategy } from './pages/Tools/BusinessStrategy';
import { ImageGenerator } from './pages/Tools/ImageGenerator';
import { AfriTranslate } from './pages/Tools/AfriTranslate';
import { Login } from './pages/Auth/Login';
import { Onboarding } from './pages/Auth/Onboarding';
import { OpeningScreen } from './components/OpeningScreen';
import { Profile } from './pages/Profile';
import { Capital } from './pages/Capital';
import { Help } from './pages/Help';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { syncEngine } from './services/sync';

const AppContent: React.FC = () => {
  const { session, loading, isBypassed, bypassAuth } = useAuth();
  
  // Opening Screen state: Starts active with 6-second Coins zoom-in animation
  const [showOpeningScreen, setShowOpeningScreen] = useState<boolean>(true);

  // Auth State: Defaults to 'LOGIN' when the opening animation completes
  const [authView, setAuthView] = useState<'LOGIN' | 'ONBOARDING' | 'APP'>('LOGIN');
  
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    syncEngine.start();
    if (session && !session.user.id.startsWith('guest-')) {
      syncEngine.restoreFromCloud(session.user.id);
    }
    return () => syncEngine.stop();
  }, [session]);

  const handleAuthComplete = () => {
    bypassAuth();
    setAuthView('APP');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  }

  // 1. Opening Screen with 6-second Coins Logo Zoom In
  if (showOpeningScreen) {
    return (
      <OpeningScreen 
        durationSeconds={6}
        onComplete={() => {
          setShowOpeningScreen(false);
          setAuthView('LOGIN');
        }}
      />
    );
  }

  // 2. Sign In Panel appears after Opening Screen
  if ((!session && !isBypassed) || authView === 'LOGIN') {
    return (
      <Login 
        onLogin={handleAuthComplete} 
        onGoToSignup={() => setAuthView('ONBOARDING')}
        onReplayIntro={() => setShowOpeningScreen(true)}
      />
    );
  }

  if (authView === 'ONBOARDING') {
    return <Onboarding onComplete={handleAuthComplete} onLogin={() => setAuthView('LOGIN')} />;
  }

  const renderContent = () => {
    // Legacy Tool Routing Logic
    if (activeTool) {
      return (
        <div className="space-y-4">
           <button 
             onClick={() => setActiveTool(null)} 
             className="flex items-center text-sm text-gray-500 hover:text-gray-800"
           >
             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             Back to Tools
           </button>
           {activeTool === 'receipt_scanner' && <ReceiptScanner />}
           {activeTool === 'afri_translate' && <AfriTranslate />}
           {activeTool === 'inventory_video' && <InventoryVideo />}
           {activeTool === 'business_strategy' && <BusinessStrategy />}
           {activeTool === 'image_generator' && <ImageGenerator />}
           {activeTool === 'quick_calc' && <div className="p-4 bg-yellow-50 rounded text-center text-yellow-800">Use the Smart Assistant for Quick Calculations!</div>}
        </div>
      );
    }

    // Main Route Switch
    switch (route) {
      case AppRoute.DASHBOARD:
        return <Dashboard onNavigate={setRoute} />;
      case AppRoute.SALES:
        return <Sales />;
      case AppRoute.TRADE:
        return <Trade onNavigate={setRoute} />;
      case AppRoute.FINANCE:
        return <Finance onNavigate={setRoute} />;
      case AppRoute.COMPLIANCE:
        return <Compliance onNavigate={setRoute} />;
      case AppRoute.ASSISTANT:
        return <SmartAssistant />;
      case AppRoute.TOOLS:
        return <Tools onSelectTool={setActiveTool} onNavigate={setRoute} />;
      case AppRoute.DESIGN_DOC:
        return <SystemDesign />;
      case AppRoute.PROFILE:
        return <Profile />;
      case AppRoute.CAPITAL:
        return <Capital onNavigate={setRoute} />;
      case AppRoute.HELP:
        return <Help onNavigate={setRoute} />;
      default:
        return <Dashboard onNavigate={setRoute} />;
    }
  };

  const handleNavigate = (newRoute: AppRoute) => {
    setActiveTool(null);
    setRoute(newRoute);
  };

  return (
    <Layout currentRoute={route} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;