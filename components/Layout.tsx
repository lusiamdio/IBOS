import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { syncEngine } from '../services/sync';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/storage';
import { CoinsLogo } from './CoinsLogo';
import { LayoutGrid, ShoppingBag, Package, Landmark, HelpCircle, MoreHorizontal, Mic, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentRoute, onNavigate }) => {
  const { signOut, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<'IDLE' | 'SYNCING' | 'DONE'>('IDLE');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { t } = useLanguage();

  const profile = db.getProfile();
  const operatorCode = profile?.operatorCode || 'OP-782';

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    syncEngine.start();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const handleSyncStart = () => setSyncState('SYNCING');
    const handleSyncComplete = () => {
        setSyncState('DONE');
        setTimeout(() => setSyncState('IDLE'), 2000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ibos-sync-start', handleSyncStart);
    window.addEventListener('ibos-sync-complete', handleSyncComplete);
    
    return () => {
      syncEngine.stop();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ibos-sync-start', handleSyncStart);
      window.removeEventListener('ibos-sync-complete', handleSyncComplete);
    };
  }, []);

  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'Overview', icon: LayoutGrid },
    { id: AppRoute.SALES, label: 'Terminal', icon: ShoppingBag },
    { id: AppRoute.TRADE, label: 'Stock', icon: Package },
    { id: AppRoute.FINANCE, label: 'Ledger', icon: Landmark },
    { id: AppRoute.HELP, label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-neutral-50/60 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Bar: Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          
          {/* Zone 1: Single text element wordmark + subtle connectivity status */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onNavigate(AppRoute.DASHBOARD)} 
              className="text-base font-bold tracking-tight text-neutral-950 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-900 text-amber-400 flex items-center justify-center shadow-subtle shrink-0">
                <CoinsLogo className="w-4 h-4 fill-current" />
              </div>
              <span>IBOS</span>
            </button>
            <span className="text-neutral-300 select-none">/</span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-[11px] font-medium text-neutral-500 tracking-tight">
                {isOnline ? 'Connected' : 'Offline'}
              </span>
              {syncState === 'SYNCING' && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-[11px] text-neutral-400 animate-pulse">Syncing</span>
                </>
              )}
            </div>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-neutral-500">
            {navItems.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'text-neutral-950 font-semibold bg-neutral-100' 
                      : 'hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => onNavigate(AppRoute.TOOLS)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === AppRoute.TOOLS 
                  ? 'text-neutral-950 font-semibold bg-neutral-100' 
                  : 'hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Tools
            </button>
          </nav>

          {/* Zone 3: Primary Action & Profile & Sign Out */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => onNavigate(AppRoute.ASSISTANT)}
              title="Voice Terminal"
              className="w-8 h-8 rounded-lg border border-neutral-200/80 hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors"
            >
              <Mic size={15} />
            </button>
            <button 
              onClick={() => onNavigate(AppRoute.PROFILE)}
              title="Account & Settings"
              className="h-8 px-2.5 rounded-lg border border-neutral-200/80 bg-neutral-50 hover:bg-neutral-100 flex items-center gap-1.5 text-xs font-medium text-neutral-700 transition-colors"
            >
              <User size={14} className="text-neutral-500" />
              <span className="hidden sm:inline font-mono text-[11px]">{operatorCode}</span>
            </button>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign Out of Terminal"
              className="h-8 px-2.5 rounded-lg border border-neutral-200/80 bg-white hover:bg-neutral-100 hover:text-rose-600 hover:border-neutral-300 flex items-center gap-1.5 text-xs font-medium text-neutral-600 transition-colors group disabled:opacity-50"
            >
              <LogOut size={13} className="text-neutral-400 group-hover:text-rose-600 transition-colors" />
              <span className="hidden sm:inline">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation Dock (Discreet Minimalist Glass Bar) */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl py-1.5 px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'text-neutral-950 font-semibold' 
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <IconComponent size={18} strokeWidth={isActive ? 2.2 : 1.7} />
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-semibold text-neutral-900' : 'font-normal text-neutral-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => onNavigate(AppRoute.TOOLS)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors ${
              currentRoute === AppRoute.TOOLS 
                ? 'text-neutral-950 font-semibold' 
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <MoreHorizontal size={18} strokeWidth={currentRoute === AppRoute.TOOLS ? 2.2 : 1.7} />
            <span className={`text-[10px] mt-1 tracking-tight ${currentRoute === AppRoute.TOOLS ? 'font-semibold text-neutral-900' : 'font-normal text-neutral-500'}`}>
              Tools
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};