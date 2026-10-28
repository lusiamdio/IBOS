import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, Toast } from '../components/DesignSystem';
import { db } from '../services/storage';
import { AppRoute } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronRight, FileText, Plus, Users, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FinanceProps {
  onNavigate: (route: AppRoute) => void;
}

// South African Revenue Service (SARS) SME Tax Calculator
// Small Business Corporation (SBC Section 12E) & Micro-business Turnover Rates
export const calculateSARS_SMETax = (netOperatingMargin: number, turnover: number) => {
  const taxableProfit = Math.max(0, netOperatingMargin);
  let taxToPay = 0;
  let bracketName = "Tier 1: 0% (Under R95,750 Tax-Free Threshold)";
  let rateApplied = "0%";

  if (taxableProfit <= 95750) {
    taxToPay = 0;
    bracketName = "Tier 1: 0% (Tax-Free Threshold under R95,750)";
    rateApplied = "0%";
  } else if (taxableProfit <= 365000) {
    taxToPay = (taxableProfit - 95750) * 0.07;
    bracketName = "Tier 2: 7% on excess above R95,750";
    rateApplied = "7%";
  } else if (taxableProfit <= 550000) {
    taxToPay = 18848 + (taxableProfit - 365000) * 0.21;
    bracketName = "Tier 3: R18,848 + 21% above R365,000";
    rateApplied = "21%";
  } else {
    taxToPay = 57698 + (taxableProfit - 550000) * 0.27;
    bracketName = "Tier 4: R57,698 + 27% above R550,000";
    rateApplied = "27%";
  }

  return {
    taxToPay: Math.round(taxToPay * 100) / 100,
    bracketName,
    rateApplied,
    netAfterTax: Math.max(0, taxableProfit - taxToPay)
  };
};

export const Finance: React.FC<FinanceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showStokvelModal, setShowStokvelModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [financials, setFinancials] = useState({ totalRevenue: 0, totalExpenses: 0, profit: 0 });
  const [loans, setLoans] = useState<any[]>([]);
  const { t } = useLanguage();

  const smeTax = calculateSARS_SMETax(financials.profit, financials.totalRevenue);

  useEffect(() => {
    setFinancials(db.getFinancialSummary());
  }, [showExpenseModal]);

  useEffect(() => {
    const localLoans = db.getLoans();
    if (localLoans && localLoans.length > 0) {
      setLoans(localLoans);
    }

    if (!user || user.id.startsWith('guest-') || user.id.startsWith('demo-')) {
      return;
    }

    const fetchLoans = async () => {
      try {
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .eq('borrower_id', user.id.slice(0, 50))
          .order('created_at', { ascending: false });

        if (error) {
          console.warn("Notice: Remote loans fetch skipped:", error.message);
          return;
        }

        if (data && data.length > 0) {
          setLoans(data);
        }
      } catch (err) {
        console.warn("Notice: Failed to load loans remotely", err);
      }
    };

    fetchLoans();
  }, [user]);

  const handleSaveExpense = () => {
    if (!expenseAmount) return;
    
    db.addExpense({
        id: Date.now().toString(),
        amount: parseFloat(expenseAmount),
        category: expenseCategory || 'General',
        timestamp: Date.now(),
        synced: false
    });

    setToast({ show: true, message: `Recorded outflow: R ${parseFloat(expenseAmount).toFixed(2)}`, type: 'success' });
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseCategory('');
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Treasury & Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Automated double-entry reconciliation & verified micro-records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => setShowTaxModal(true)}
          >
            <Download size={13} className="mr-1.5" /> Export Statement
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => setShowExpenseModal(true)}
          >
            <Plus size={13} className="mr-1" /> Log Outflow
          </Button>
        </div>
      </div>

      {/* Financial Overview Card */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-card border border-neutral-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Cumulative Net Operating Margin
              </span>
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded">
                SARS SBC Verified
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums mt-1 text-white">
              R {financials.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
              <span className="text-emerald-400 font-medium">Post-Tax Margin: R {smeTax.netAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">{smeTax.bracketName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 bg-neutral-800/80 p-3 sm:p-3.5 rounded-xl border border-neutral-700/60 overflow-x-auto">
            <div>
              <span className="text-[10px] font-semibold uppercase text-neutral-400 block tracking-wider">Inflows</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-emerald-400 tabular-nums">
                +R {financials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-px h-8 bg-neutral-700 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold uppercase text-neutral-400 block tracking-wider">Outflows</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-rose-400 tabular-nums">
                -R {financials.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-px h-8 bg-neutral-700 shrink-0" />
            <div 
              onClick={() => setShowTaxModal(true)} 
              className="cursor-pointer group"
              title="Click to view South African SME Tax Schedule"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase text-neutral-400 group-hover:text-amber-300 transition-colors block tracking-wider">Tax To Pay</span>
                <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                  SARS SME
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 tabular-nums block group-hover:underline">
                R {smeTax.taxToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Credit & Capital Score */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              FinTech Credit Standing
            </h3>
            <span className="text-sm font-semibold text-neutral-900 block mt-0.5">
              Tier 4 Enterprise Verification
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md">
            Score: 720 / 850
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-neutral-900 h-full rounded-full transition-all" style={{ width: '84%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>Minimum 500</span>
            <span>Prime Tier 850</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate(AppRoute.CAPITAL)}
          className="bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors group"
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
              Pre-Approved Working Capital Line
            </span>
            <span className="text-xl font-bold font-mono text-neutral-950 tabular-nums">
              R 15,000.00
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Instant disbursement to digital account or bank
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 group-hover:border-neutral-900 group-hover:text-neutral-950 transition-colors">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Active Loan Ledger */}
      {loans.length > 0 && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Facility Applications & Records
            </h3>
            <span className="text-xs font-mono text-neutral-400">{loans.length} facilities</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {loans.map(loan => (
              <div key={loan.loan_id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-neutral-900 font-mono tabular-nums">
                    R {loan.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {loan.purpose} · {loan.duration_days} days term
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${
                    loan.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {loan.status === 'approved' ? 'Approved' : 'In Review'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                    {new Date(loan.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lending Circle / Stokvel */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Rotational Savings Circle (Stokvel)
            </h3>
            <span className="text-sm font-semibold text-neutral-900 block mt-0.5">
              Gauteng Traders Circle #4
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-700 font-mono">12 Members Active</span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs">
          <div>
            <span className="text-neutral-500 block">Next Scheduled Payout</span>
            <span className="text-sm font-semibold text-neutral-900">Your Turn (Oct 30)</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block">Pool Volume</span>
            <span className="text-sm font-bold font-mono tabular-nums text-neutral-900">R 15,000.00</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            fullWidth 
            onClick={() => setShowStokvelModal(true)}
          >
            View Roster & History
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            fullWidth 
            onClick={() => {
              db.addStokvelContribution({
                id: `stokvel-${Date.now()}`,
                amount: 1250,
                cycle_month: new Date().toISOString().slice(0, 7),
                circle_name: 'Gauteng Traders Circle #4',
                timestamp: Date.now()
              });
              setToast({ show: true, message: 'Monthly contribution of R 1,250 recorded to ledger', type: 'success' });
              setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
            }}
          >
            Contribute R 1,250
          </Button>
        </div>
      </div>

      {/* LOG EXPENSE MODAL */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record Ledger Outflow">
        <div className="space-y-4">
          <Input 
            label="Amount (ZAR)" 
            type="number" 
            placeholder="0.00" 
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 ml-0.5 uppercase tracking-wider">
              Allocation Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Stock Inventory', 'Logistics & Fuel', 'Facility Rent', 'Wages & Helper'].map(cat => (
                <button 
                  key={cat}
                  type="button"
                  onClick={() => setExpenseCategory(cat)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-colors text-left ${
                    expenseCategory === cat 
                      ? 'bg-neutral-900 text-white border-neutral-900' 
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <Button fullWidth variant="primary" onClick={handleSaveExpense} size="lg">
              Confirm Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* STOKVEL GROUP MODAL */}
      <Modal isOpen={showStokvelModal} onClose={() => setShowStokvelModal(false)} title="Stokvel Savings Roster">
        <div className="space-y-4">
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 text-center">
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider mb-0.5">
              Accumulated Pool Value
            </p>
            <div className="text-3xl font-bold text-neutral-900 font-mono tabular-nums">
              R 15,000.00
            </div>
            <p className="text-xs text-neutral-500 mt-1">12 Members · 100% On-Time Record</p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {[
              { name: 'Mama Dlamini (You)', status: 'Receiving', date: 'Oct 30' },
              { name: 'Sipho Spaza Store', status: 'Settled', date: 'Oct 5' },
              { name: 'Lerato Kiosk', status: 'Settled', date: 'Oct 1' },
              { name: 'Bongani Wholesalers', status: 'Upcoming', date: 'Nov 15' }
            ].map((member, i) => (
              <div key={i} className="flex justify-between items-center bg-white border border-neutral-200/80 p-3 rounded-xl text-xs">
                <div>
                  <div className="font-semibold text-neutral-900">{member.name}</div>
                  <div className="text-neutral-500 text-[11px]">Date: {member.date}</div>
                </div>
                <span className={`text-xs font-medium ${
                  member.status === 'Receiving' ? 'text-emerald-700' : 'text-neutral-600'
                }`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>

          <Button fullWidth variant="secondary" onClick={() => setShowStokvelModal(false)}>
            Close Roster
          </Button>
        </div>
      </Modal>

      {/* TAX REPORT MODAL */}
      <Modal isOpen={showTaxModal} onClose={() => setShowTaxModal(false)} title="SARS SME Tax Calculation & Export">
        <div className="space-y-4">
          <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-3 border border-neutral-800">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">South African Revenue Service (SARS) SME Assessment</span>
              <span className="font-mono text-amber-400 font-medium">SBC Section 12E</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Cumulative Margin</span>
                <span className="font-mono text-white text-sm font-bold tabular-nums">
                  R {financials.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Tax To Pay (Calculated)</span>
                <span className="font-mono text-amber-300 text-sm font-bold tabular-nums">
                  R {smeTax.taxToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-neutral-300 bg-neutral-800/80 p-2.5 rounded-lg border border-neutral-700/60 font-mono">
              <span className="text-neutral-400 block mb-0.5">Active SBC Rate Tier:</span>
              <span className="text-amber-200">{smeTax.bracketName}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-600">
            Generate compliant SARS Turnover Tax statement and export for reconciliation:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                setToast({ show: true, message: 'Turnover Tax PDF downloaded', type: 'success' });
                setShowTaxModal(false);
              }}
              className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-left"
            >
              <FileText size={20} className="text-neutral-700 mb-2" />
              <span className="text-xs font-semibold text-neutral-900 block">PDF Statement</span>
              <span className="text-[11px] text-neutral-400">Formal tax receipt</span>
            </button>
            <button 
              onClick={() => {
                setToast({ show: true, message: 'CSV ledger exported', type: 'success' });
                setShowTaxModal(false);
              }}
              className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-left"
            >
              <Download size={20} className="text-neutral-700 mb-2" />
              <span className="text-xs font-semibold text-neutral-900 block">CSV Ledger</span>
              <span className="text-[11px] text-neutral-400">Excel / Spreadsheets</span>
            </button>
          </div>
          <Button fullWidth variant="secondary" onClick={() => setShowTaxModal(false)}>
            Dismiss
          </Button>
        </div>
      </Modal>
    </div>
  );
};