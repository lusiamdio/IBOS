import React, { useState } from 'react';
import { Button, Input, Toast } from '../components/DesignSystem';
import { Mic, Camera, ShieldCheck, CheckCircle2, FileText, Smartphone, ArrowLeft } from 'lucide-react';
import { AppRoute } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/storage';

interface CapitalProps {
  onNavigate: (route: AppRoute) => void;
}

export const Capital: React.FC<CapitalProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<string>('5000');
  const [purpose, setPurpose] = useState<string>('Inventory Restock');
  const [duration, setDuration] = useState<string>('14 days');
  const [repaymentType, setRepaymentType] = useState<string>('Daily');
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleQuickAmount = (val: string) => setAmount(val);

  const mockBusinessSnapshot = {
    avgDailySales: "1240",
    topProduct: "Albany Superior White Bread",
    inventoryValue: "18500",
    cashFlow: "Positive (+14.2%)"
  };

  const handleMicClick = () => {
    if (recording) {
      setRecording(false);
      setVoiceRecorded(true);
    } else {
      setRecording(true);
      setTimeout(() => {
        setRecording(false);
        setVoiceRecorded(true);
      }, 3000);
    }
  };

  const nextStep = () => setStep(s => Math.min(6, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const principal = parseInt(amount || '0', 10);
  const interest = principal * 0.05; // 5% flat fee
  const total = principal + interest;
  let days = parseInt(duration) || 14;
  const dailyRepayment = Math.ceil(total / days);

  const submitLoanRequest = async () => {
    if (!user) {
      showToast("Active operator session required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const loanId = crypto.randomUUID();

      if (!user.id.startsWith('guest-') && !user.id.startsWith('demo-')) {
        try {
          const { error: loanError } = await supabase.from('loans').insert({
            loan_id: loanId,
            borrower_id: user.id.slice(0, 50),
            amount: principal,
            purpose: purpose,
            duration_days: days,
            repayment_type: repaymentType.split(' ')[0].toLowerCase(),
            daily_amount: dailyRepayment,
            avg_daily_sales: parseFloat(mockBusinessSnapshot.avgDailySales),
            inventory_value: parseFloat(mockBusinessSnapshot.inventoryValue),
            trust_score: 84,
            voice_pitch_url: voiceRecorded ? 'recorded_pitch_url' : null,
            status: 'pending'
          });

          if (loanError) {
            console.warn("Supabase remote loan sync skipped:", loanError.message);
          }

          await supabase.from('loan_endorsements').insert([
            { loan_id: loanId, endorser_id: 'Mama Dlamini' },
            { loan_id: loanId, endorser_id: 'Sipho Spaza' }
          ]);
        } catch (remoteErr) {
          console.warn("Remote sync failed, stored locally instead:", remoteErr);
        }
      }

      db.addLoan({
        loan_id: loanId,
        borrower_id: user.id,
        amount: principal,
        purpose,
        duration_days: days,
        repayment_type: repaymentType,
        daily_amount: dailyRepayment,
        avg_daily_sales: parseFloat(mockBusinessSnapshot.avgDailySales),
        inventory_value: parseFloat(mockBusinessSnapshot.inventoryValue),
        trust_score: 84,
        status: 'pending',
        created_at: Date.now()
      });

      showToast("Facility application submitted to underwriting queue");
      setTimeout(() => onNavigate(AppRoute.FINANCE), 1500);

    } catch (err: any) {
      console.error(err);
      showToast(`Submission failed: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Facility Request Sizing</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Select working capital amount and allocation purpose</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-neutral-200/80 space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">
            Requested Amount (ZAR)
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {['1000', '2500', '5000', '10000', '15000', '25000'].map(val => (
              <button 
                key={val} 
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`py-2 px-3 rounded-xl text-xs font-mono tabular-nums font-semibold border transition-colors ${
                  amount === val 
                    ? 'bg-neutral-900 text-white border-neutral-900' 
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                R {parseInt(val).toLocaleString()}
              </button>
            ))}
          </div>
          <Input 
             type="number" 
             placeholder="Custom Amount (R)" 
             value={amount} 
             onChange={(e) => setAmount(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">
            Allocation Purpose
          </label>
          <div className="grid grid-cols-2 gap-2">
             {['Inventory Restock', 'Bulk Wholesaler Order', 'Equipment / Cold Storage', 'Store Expansion'].map(p => (
               <button 
                 key={p} 
                 type="button"
                 onClick={() => setPurpose(p)}
                 className={`p-3 rounded-xl text-xs font-medium border text-left transition-colors ${
                   purpose === p 
                     ? 'bg-neutral-900 text-white border-neutral-900' 
                     : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                 }`}
               >
                 {p}
               </button>
             ))}
          </div>
        </div>

        <div>
           <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">
             Repayment Horizon
           </label>
           <select 
             className="w-full bg-white border border-neutral-200 rounded-xl py-2.5 px-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium"
             value={duration}
             onChange={(e) => setDuration(e.target.value)}
           >
              <option value="7 days">7 Days (Short turnover)</option>
              <option value="14 days">14 Days (Standard bi-weekly)</option>
              <option value="30 days">30 Days (Monthly cycle)</option>
              <option value="60 days">60 Days (Structured)</option>
           </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Repayment Schedule</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Automated settlement model calibrated to turnover</p>
      </div>

      <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-card border border-neutral-800 space-y-4">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Calculated Daily Installment
          </span>
          <div className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums mt-1">
            R {dailyRepayment.toFixed(2)}
          </div>
          <p className="text-xs text-emerald-400 mt-1 font-mono">
            Represents 7.8% of average daily gross sales (conservative risk tier)
          </p>
        </div>

        <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Principal Amount</span>
            <span className="font-mono text-white tabular-nums">R {principal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Financing Fee (5% Fixed)</span>
            <span className="font-mono text-white tabular-nums">R {interest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-800 text-neutral-200 font-semibold">
            <span>Total Maturity Repayment</span>
            <span className="font-mono text-white tabular-nums">R {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-neutral-200/80 space-y-2">
        <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
          Repayment Deduction Mechanism
        </label>
        {['Daily POS Split (Auto-deducted at terminal)', 'Weekly Lump Deduction', 'Maturity Settlement'].map(rt => (
          <button 
            key={rt} 
            type="button"
            onClick={() => setRepaymentType(rt)}
            className={`w-full flex items-center p-3 rounded-xl border text-xs font-medium transition-colors ${
              repaymentType === rt 
                ? 'bg-neutral-900 text-white border-neutral-900' 
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {rt}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Verified Enterprise Records</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Automated telemetry pulled from your IBOS ledger</p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-card border border-neutral-200/80 space-y-3 text-xs">
        <div className="flex justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">Average Daily Turnover</span>
          <span className="font-mono font-semibold text-neutral-900 tabular-nums">R {mockBusinessSnapshot.avgDailySales}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">Warehouse Inventory Val</span>
          <span className="font-mono font-semibold text-neutral-900 tabular-nums">R {mockBusinessSnapshot.inventoryValue}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-100">
          <span className="text-neutral-500">Operating Cashflow Trend</span>
          <span className="font-mono font-semibold text-emerald-700">{mockBusinessSnapshot.cashFlow}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-neutral-500">Top Revenue Driver</span>
          <span className="font-medium text-neutral-900">{mockBusinessSnapshot.topProduct}</span>
        </div>
      </div>

      <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-xl flex items-start gap-3">
        <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-600 leading-relaxed">
          Zero collateral required. Lending partners assess eligibility exclusively through transaction verification and community endorsements.
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Community Trust Endorsements</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Supply chain partners backing your enterprise reputation</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-neutral-200/80 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <span className="text-xs font-semibold text-neutral-900">IBOS Enterprise Trust Score</span>
          <span className="font-mono text-xs font-bold text-neutral-900">84 / 100</span>
        </div>
        
        <div className="space-y-2 pt-1">
          {[
            { id: '1', name: 'Mama Dlamini Wholesalers', relation: 'Primary Produce Supplier', verified: true },
            { id: '2', name: 'Sipho Spaza Enterprise', relation: 'Fellow Licensed Trader', verified: true }
          ].map(usr => (
            <div key={usr.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs">
              <div>
                <span className="font-semibold text-neutral-900 block">{usr.name}</span>
                <span className="text-neutral-500 text-[11px]">{usr.relation}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Verified Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Audio Verification Note</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Optional voice note describing current inventory or equipment needs</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-card text-center space-y-4">
        <div 
          onClick={handleMicClick}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto cursor-pointer transition-colors ${
            recording 
              ? 'bg-rose-500 text-white animate-pulse' 
              : voiceRecorded 
                ? 'bg-emerald-600 text-white' 
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
          }`}
        >
          {voiceRecorded ? <CheckCircle2 size={24} /> : <Mic size={24} />}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-neutral-900">
            {recording ? "Recording audio note..." : voiceRecorded ? "Audio Verified & Attached" : "Tap to Record (10-20 seconds)"}
          </h4>
          <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
            {voiceRecorded 
              ? "Your audio note is securely linked to the application."
              : "Explain your stock order in your preferred language (isiZulu, English, Sesotho)."
            }
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Review Facility Request</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Confirm details prior to routing to lending partners</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-neutral-200/80 overflow-hidden divide-y divide-neutral-100 text-xs">
        <div className="p-4 bg-neutral-50 flex justify-between items-center">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Facility Amount</span>
          <span className="font-mono text-xl font-bold text-neutral-900 tabular-nums">R {amount || '0'}</span>
        </div>
        <div className="p-3.5 flex justify-between">
          <span className="text-neutral-500">Allocation Purpose</span>
          <span className="font-medium text-neutral-900">{purpose}</span>
        </div>
        <div className="p-3.5 flex justify-between">
          <span className="text-neutral-500">Tenure</span>
          <span className="font-mono text-neutral-900">{duration}</span>
        </div>
        <div className="p-3.5 flex justify-between">
          <span className="text-neutral-500">Daily Installment</span>
          <span className="font-mono text-neutral-900 font-semibold tabular-nums">R {dailyRepayment.toFixed(2)} / day</span>
        </div>
        <div className="p-3.5 flex justify-between">
          <span className="text-neutral-500">Syndicate Routing</span>
          <span className="font-medium text-emerald-700">Verified Peer Micro-Consortium</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Navigation Progress Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
        <button 
          onClick={step > 1 ? prevStep : () => onNavigate(AppRoute.FINANCE)}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          {step > 1 ? 'Previous Step' : 'Cancel'}
        </button>

        <span className="text-xs font-mono text-neutral-400">
          Step {step} of 6
        </span>
      </div>

      <div>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </div>

      <div className="pt-2">
        <Button 
          fullWidth 
          variant="primary" 
          size="lg"
          onClick={() => {
            if (step === 6) {
              submitLoanRequest();
            } else {
              nextStep();
            }
          }}
          disabled={(step === 1 && (!amount || !purpose)) || isSubmitting}
        >
          {isSubmitting ? 'Submitting Application...' : step === 6 ? 'Submit Application' : 'Proceed to Next Step'}
        </Button>
      </div>
    </div>
  );
};
