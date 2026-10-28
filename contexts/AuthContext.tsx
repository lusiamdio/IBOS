import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { syncEngine } from '../services/sync';
import { db } from '../services/storage';

export const GUEST_USER: User = {
  id: 'guest-operator-001',
  app_metadata: { provider: 'bypass' },
  user_metadata: {
    fullName: 'Mama Dlamini',
    businessName: 'Mama Dlamini Spaza Store',
    phone: '071 234 5678',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@ibos.africa',
  phone: '0712345678',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
} as unknown as User;

export const GUEST_SESSION: Session = {
  access_token: 'bypass-access-token-demo',
  token_type: 'bearer',
  expires_in: 31536000,
  refresh_token: 'bypass-refresh-token-demo',
  user: GUEST_USER,
} as unknown as Session;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isBypassed: boolean;
  bypassAuth: () => void;
  resetToGuest: () => void;
  loginWithOperator: (profileData: { fullName: string; businessName: string; phone?: string; email?: string }) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: GUEST_SESSION,
  user: GUEST_USER,
  signOut: async () => {},
  loading: false,
  isBypassed: true,
  bypassAuth: () => {},
  resetToGuest: () => {},
  loginWithOperator: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if bypass mode is enabled (defaults to true to bypass Supabase auth)
  const [isBypassed, setIsBypassed] = useState<boolean>(() => {
    const saved = localStorage.getItem('ibos_auth_bypass');
    return saved === null ? true : saved === 'true';
  });

  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('ibos_auth_bypass');
    const bypassed = saved === null ? true : saved === 'true';
    return bypassed ? GUEST_SESSION : null;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ibos_auth_bypass');
    const bypassed = saved === null ? true : saved === 'true';
    return bypassed ? GUEST_USER : null;
  });

  const [loading, setLoading] = useState(false);

  // Initialize profile in local storage if not already present
  useEffect(() => {
    const profile = db.getProfile();
    if (!profile) {
      db.saveProfile({
        fullName: 'Mama Dlamini',
        businessName: 'Mama Dlamini Spaza Store',
        phone: '071 234 5678',
        email: 'demo@ibos.africa',
        operatorCode: 'OP-78219',
        createdAt: Date.now()
      });
    }
  }, []);

  const bypassAuth = () => {
    localStorage.setItem('ibos_auth_bypass', 'true');
    setIsBypassed(true);
    setSession(GUEST_SESSION);
    setUser(GUEST_USER);
    setLoading(false);
  };

  const resetToGuest = () => {
    bypassAuth();
  };

  useEffect(() => {
    // Attempt Supabase session detection in the background, but never block the UI
    try {
      supabase.auth.getSession().then(({ data: { session: realSession } }) => {
        if (realSession?.user) {
          // If a real Supabase session is found, allow using it
          setSession(realSession);
          setUser(realSession.user);
          setIsBypassed(false);
          syncEngine.restoreFromCloud(realSession.user.id);
        } else if (isBypassed) {
          // Maintain bypass session
          setSession(GUEST_SESSION);
          setUser(GUEST_USER);
        }
        setLoading(false);
      }).catch((err) => {
        console.warn('[AuthContext] Supabase getSession error (using bypass):', err);
        if (isBypassed) {
          setSession(GUEST_SESSION);
          setUser(GUEST_USER);
        }
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setIsBypassed(false);
          if (_event === 'SIGNED_IN') {
            syncEngine.restoreFromCloud(newSession.user.id);
          }
        } else if (isBypassed) {
          setSession(GUEST_SESSION);
          setUser(GUEST_USER);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (e) {
      console.warn('[AuthContext] Supabase init failed, falling back to bypass mode:', e);
      setSession(GUEST_SESSION);
      setUser(GUEST_USER);
      setLoading(false);
    }
  }, [isBypassed]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AuthContext] Supabase sign out error:', e);
    }
    // Fully reset session and bypass flag so the user is directed to the Login & Registration panel
    localStorage.setItem('ibos_auth_bypass', 'false');
    setIsBypassed(false);
    setSession(null);
    setUser(null);
  };

  const loginWithOperator = (profileData: { fullName: string; businessName: string; phone?: string; email?: string }) => {
    const operatorUser: User = {
      id: `operator-${Date.now()}`,
      app_metadata: { provider: 'ibos-local' },
      user_metadata: {
        fullName: profileData.fullName,
        businessName: profileData.businessName,
        phone: profileData.phone || '071 234 5678',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: profileData.email || 'operator@ibos.africa',
      phone: profileData.phone || '0712345678',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as unknown as User;

    const operatorSession: Session = {
      access_token: `token-${Date.now()}`,
      token_type: 'bearer',
      expires_in: 31536000,
      refresh_token: `refresh-${Date.now()}`,
      user: operatorUser,
    } as unknown as Session;

    localStorage.setItem('ibos_auth_bypass', 'true');
    setIsBypassed(true);
    setSession(operatorSession);
    setUser(operatorUser);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading, isBypassed, bypassAuth, resetToGuest, loginWithOperator }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
