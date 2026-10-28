import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/storage';
import { supabase } from '../../lib/supabase';
import { CoinsLogo } from '../../components/CoinsLogo';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Store, 
  MapPin, 
  ShieldCheck, 
  BadgePercent, 
  ChevronDown,
  Smartphone,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onLogin: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onLogin }) => {
  const { loginWithOperator } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Business Identity
  const [bizName, setBizName] = useState('Mama Dlamini Spaza Store');
  const [fullName, setFullName] = useState('Mama Dlamini');
  const [location, setLocation] = useState('Soweto, Johannesburg');
  const [category, setCategory] = useState('Spaza & FMCG');

  // Step 2: SARS SME Tax & Finance
  const [monthlyTurnover, setMonthlyTurnover] = useState(30000);
  const [openingFloat, setOpeningFloat] = useState(500);

  // Step 3: Security & Pass
  const [phone, setPhone] = useState('071 234 5678');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [generatedCode] = useState(() => `OP-${Math.floor(10000 + Math.random() * 90000)}`);

  const townships = [
    'Soweto, Gauteng',
    'Khayelitsha, Western Cape',
    'Umlazi, KwaZulu-Natal',
    'Tembisa, Gauteng',
    'Mamelodi, Gauteng',
    'Mdantsane, Eastern Cape',
    'Botshabelo, Free State',
    'Other Region'
  ];

  const categories = [
    { id: 'Spaza & FMCG', label: 'Spaza & FMCG', desc: 'Bread, maize, drinks, airtime' },
    { id: 'Fresh Produce', label: 'Fresh Produce', desc: 'Vegetables, fruit, meat' },
    { id: 'Fast Food & Kota', label: 'Fast Food & Kota', desc: 'Kotas, braai, takeaway' },
    { id: 'Salon & Grooming', label: 'Salon & Grooming', desc: 'Hair, cuts, cosmetics' },
    { id: 'Wholesale / Other', label: 'Wholesale / Other', desc: 'Bulk goods, hardware, other' },
  ];

  // Calculate SARS SME Turnover Tax based on annual turnover
  const annualTurnover = monthlyTurnover * 12;
  const calculateSarsTax = (turnover: number): { tax: number; rateDesc: string } => {
    if (turnover <= 335000) {
      return { tax: 0, rateDesc: '0% (Tax-Free under R335k)' };
    } else if (turnover <= 500000) {
      return { 
        tax: (turnover - 335000) * 0.01, 
        rateDesc: '1% of turnover over R335,000' 
      };
    } else if (turnover <= 750000) {
      return { 
        tax: 1650 + (turnover - 500000) * 0.02, 
        rateDesc: 'R1,650 + 2% over R500,000' 
      };
    } else {
      return { 
        tax: 6650 + (turnover - 750000) * 0.03, 
        rateDesc: 'R6,650 + 3% over R750,000' 
      };
    }
  };

  const sarsTaxInfo = calculateSarsTax(annualTurnover);

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    const emailToUse = `${phone.replace(/\D/g, '') || 'operator'}@ibos.africa`;

    try {
      await supabase.auth.signUp({
        email: emailToUse,
        password: pin || '123456',
        options: {
          data: {
            fullName,
            businessName: bizName,
            phone,
            location,
            category,
            operatorCode: generatedCode,
          }
        }
      });
    } catch (e) {
      console.warn('[Onboarding] Supabase background signup deferred:', e);
    }

    const newProfile = {
      fullName: fullName.trim() || 'Mama Dlamini',
      businessName: bizName.trim() || 'Mama Dlamini Spaza Store',
      phone: phone.trim() || '071 234 5678',
      email: emailToUse,
      location,
      category,
      operatorCode: generatedCode,
      monthlyTurnover,
      openingFloat,
      createdAt: Date.now()
    };
    db.saveProfile(newProfile);

    if (openingFloat > 0) {
      db.saveExpense({
        category: 'Cash Float Inflow',
        amount: openingFloat,
        notes: 'Initial cash float registered during terminal onboarding',
        date: new Date().toISOString()
      });
    }

    loginWithOperator({
      fullName: newProfile.fullName,
      businessName: newProfile.businessName,
      phone: newProfile.phone,
      email: newProfile.email
    });

    setLoading(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 flex flex-col justify-between p-4 sm:p-6 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <header className="max-w-lg w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center shadow-subtle shrink-0">
                <CoinsLogo className="w-4 h-4 fill-current" />
              </div>
              <span className="font-bold tracking-tight text-neutral-950 text-sm">IBOS</span>
            </div>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step 
                  ? 'w-6 bg-neutral-900' 
                  : s < step 
                    ? 'w-2 bg-emerald-500' 
                    : 'w-2 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <div className="text-[11px] font-mono text-neutral-400">
          Step {step} of 3
        </div>
      </header>

      {/* Main Form Container */}
      <div className="max-w-lg w-full mx-auto my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-neutral-200/80">
          
          {/* Step 1: Business Identity */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Step 1 of 3 · Business Identity
                </div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">
                  Register Your Business Profile
                </h2>
                <p className="text-xs text-neutral-500">
                  Enter your trading name, owner details, and township location.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Store / Trading Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Mama Dlamini Spaza Store"
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Primary Operator / Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mama Dlamini"
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Operating Township / Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                  >
                    {townships.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="onboard-category-select" className="block text-xs font-medium text-neutral-700 mb-1">
                    Business Category
                  </label>
                  <div className="relative">
                    <select
                      id="onboard-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors appearance-none cursor-pointer pr-9"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({cat.desc})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Already registered? Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  Continue to Tax & Cash Float <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: SARS SME Turnover Tax Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Step 2 of 3 · Financial & Tax Setup
                </div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">
                  Turnover Tax & Opening Float
                </h2>
                <p className="text-xs text-neutral-500">
                  SARS Micro-Business Turnover Tax calculation (0% under R335k/year).
                </p>
              </div>

              {/* SARS Tax Calculation Preview Card */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgePercent size={16} className="text-neutral-700" />
                    <span className="text-xs font-semibold text-neutral-900">SARS Micro-Business Regime</span>
                  </div>
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-mono">
                    Turnover Tax
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-neutral-600">Estimated Monthly Turnover</span>
                    <span className="font-mono font-bold text-neutral-950">
                      R{monthlyTurnover.toLocaleString()} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="85000"
                    step="5000"
                    value={monthlyTurnover}
                    onChange={(e) => setMonthlyTurnover(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                    <span>R5,000/mo</span>
                    <span>R85,000/mo (~R1M/yr)</span>
                  </div>
                </div>

                {/* Real-time SARS Rate breakdown */}
                <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 text-[11px] block">Projected Tax to Pay (SARS)</span>
                    <span className="text-[11px] font-medium text-neutral-700">{sarsTaxInfo.rateDesc}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-neutral-950">
                      {sarsTaxInfo.tax === 0 ? 'R0.00' : `R${Math.round(sarsTaxInfo.tax).toLocaleString()}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">per year</span>
                  </div>
                </div>
              </div>

              {/* Initial Drawer Cash Float */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Starting Cash Float in Drawer (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-xs font-bold text-neutral-500 font-mono">
                    R
                  </span>
                  <input
                    type="number"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(Number(e.target.value))}
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors font-mono font-semibold"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Recorded into opening ledger for cash drawer balancing.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  ← Back to Profile
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  Continue to Security PIN <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Security & Terminal Pass */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Step 3 of 3 · Terminal Security
                </div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">
                  Set Terminal PIN
                </h2>
                <p className="text-xs text-neutral-500">
                  Set your phone number and 4-digit PIN for daily sign-in.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {error}
                </div>
              )}

              {/* Operator Pass Badge Preview */}
              <div className="p-4 bg-neutral-900 text-white rounded-2xl shadow-subtle border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/10 text-amber-400 flex items-center justify-center">
                      <CoinsLogo className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span className="text-xs font-bold tracking-tight">IBOS Operator Card</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>

                <div className="flex justify-between items-end pt-1">
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase tracking-wider">Store</span>
                    <span className="text-xs font-semibold text-white">{bizName}</span>
                    <span className="text-[11px] text-neutral-300 block">{fullName} · {location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block uppercase tracking-wider">Operator ID</span>
                    <span className="font-mono text-xs font-bold text-amber-400">{generatedCode}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Mobile Phone Number (WhatsApp / Receipts)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="071 234 5678"
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                      <Smartphone size={14} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    4-Digit Terminal PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors font-mono tracking-widest"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                      <KeyRound size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-tight transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Setup'}
                <CheckCircle2 size={14} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-lg w-full mx-auto text-center py-2 text-[11px] text-neutral-400">
        <span>Informal Business Operating System · Republic of South Africa</span>
      </footer>
    </div>
  );
};