import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth, GUEST_USER } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { db } from '../../services/storage';
import { CoinsLogo } from '../../components/CoinsLogo';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Store, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onGoToSignup: () => void;
  onReplayIntro?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onGoToSignup, onReplayIntro }) => {
  const { bypassAuth, loginWithOperator } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Login fields
  const [identifier, setIdentifier] = useState('demo@ibos.africa');
  const [pinOrPassword, setPinOrPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regBizName, setRegBizName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regCategory, setRegCategory] = useState('Spaza & FMCG');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const categories = [
    'Spaza & FMCG',
    'Fresh Produce',
    'Fast Food & Kota',
    'Salon & Grooming',
    'Wholesale / Other'
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // If demo credentials
    if (identifier === 'demo@ibos.africa' || identifier === '0712345678' || identifier === '071 234 5678') {
      setTimeout(() => {
        setLoading(false);
        onLogin();
      }, 350);
      return;
    }

    try {
      if (identifier.includes('@')) {
        const { error: sbError } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password: pinOrPassword,
        });

        if (sbError) {
          const savedProfile = db.getProfile();
          if (savedProfile && (savedProfile.email === identifier.trim() || savedProfile.phone === identifier.trim())) {
            loginWithOperator({
              fullName: savedProfile.fullName || 'Operator',
              businessName: savedProfile.businessName || 'IBOS Store',
              email: savedProfile.email,
              phone: savedProfile.phone
            });
            onLogin();
            return;
          }
          throw sbError;
        }
        onLogin();
      } else {
        const savedProfile = db.getProfile();
        loginWithOperator({
          fullName: savedProfile?.fullName || 'Shop Operator',
          businessName: savedProfile?.businessName || 'IBOS Spaza',
          phone: identifier.trim()
        });
        onLogin();
      }
    } catch (err: any) {
      console.warn('[Login] Authentication error:', err);
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regBizName.trim()) {
      setError('Please provide your full name and business name');
      return;
    }

    setLoading(true);
    setError('');

    const operatorCode = `OP-${Math.floor(10000 + Math.random() * 90000)}`;
    const emailToUse = regPhone.includes('@') ? regPhone.trim() : `${regPhone.replace(/\D/g, '') || 'shop'}@ibos.africa`;

    try {
      await supabase.auth.signUp({
        email: emailToUse,
        password: regPin || '123456',
        options: {
          data: {
            fullName: regFullName.trim(),
            businessName: regBizName.trim(),
            phone: regPhone.trim(),
            category: regCategory,
            operatorCode,
          }
        }
      });
    } catch (sbErr) {
      console.warn('[Registration] Cloud sync deferred:', sbErr);
    }

    const newProfile = {
      fullName: regFullName.trim(),
      businessName: regBizName.trim(),
      phone: regPhone.trim() || '071 234 5678',
      email: emailToUse,
      operatorCode,
      category: regCategory,
      createdAt: Date.now()
    };
    db.saveProfile(newProfile);

    loginWithOperator({
      fullName: newProfile.fullName,
      businessName: newProfile.businessName,
      phone: newProfile.phone,
      email: newProfile.email
    });

    setLoading(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 flex flex-col justify-between p-4 sm:p-6 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Bar with Brand Logo */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center shadow-subtle shrink-0">
            <CoinsLogo className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold tracking-tight text-neutral-950 text-sm">IBOS</span>
        </div>
      </header>

      {/* Main Auth Card Container */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-neutral-200/80">
          
          {/* Header Title */}
          <div className="space-y-1 mb-6 text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              {mode === 'LOGIN' ? 'Sign In' : 'Register Operator'}
            </h1>
            <p className="text-xs text-neutral-500">
              {mode === 'LOGIN' 
                ? 'Informal Business Operating System · South Africa' 
                : 'Set up your operator profile'}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setError(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'LOGIN'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); setError(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'REGISTER'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 071 234 5678 or demo@ibos.africa"
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                    <User size={14} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-700">
                    Operator Passcode / PIN
                  </label>
                  <span className="text-[11px] text-neutral-400 font-mono">Demo: 1234</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={pinOrPassword}
                    onChange={(e) => setPinOrPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-xs text-neutral-600">Keep terminal active</span>
                </label>
                <button
                  type="button"
                  onClick={onGoToSignup}
                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Need guided setup?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-tight transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight size={14} />
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('demo@ibos.africa');
                    setPinOrPassword('1234');
                  }}
                  className="w-full py-2 px-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200/90 rounded-xl text-xs font-medium transition-colors flex items-center justify-between"
                >
                  <span>Fill Demo Credentials</span>
                  <span className="font-mono text-[11px] text-neutral-400">demo@ibos.africa</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: REGISTRATION */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Operator Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Ndlovu"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Trading Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ndlovu Corner Store"
                  value={regBizName}
                  onChange={(e) => setRegBizName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="082 123 4567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="••••"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-category" className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Business Category
                </label>
                <div className="relative">
                  <select
                    id="reg-category"
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors appearance-none cursor-pointer pr-9"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-tight transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                <ArrowRight size={14} />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onGoToSignup}
                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  First time? Complete guided onboarding →
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-neutral-400 flex flex-col items-center gap-1.5">
        <span>Informal Business Operating System · Republic of South Africa</span>
        {onReplayIntro && (
          <button
            type="button"
            onClick={onReplayIntro}
            className="text-[10px] text-neutral-400 hover:text-amber-600 transition-colors underline underline-offset-2"
          >
            Replay Opening Animation (6s)
          </button>
        )}
      </footer>
    </div>
  );
};