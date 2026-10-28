import React, { useEffect, useState } from 'react';
import { AppRoute } from '../types';
import { Card, Button, Modal, Input, Toast } from '../components/DesignSystem';
import { useLanguage } from '../contexts/LanguageContext';
import QRCode from 'qrcode';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  BookOpen, 
  Package, 
  ShieldCheck, 
  TrendingUp, 
  Mic, 
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { db } from '../services/storage';
import { calculateSARS_SMETax } from './Finance';

interface DashboardProps {
    onNavigate: (route: AppRoute) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'analytics'>('overview');
  
  // Real-time Financials and SME Tax
  const [financials, setFinancials] = useState(() => db.getFinancialSummary());
  
  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  
  // Debtors State (synced with storage)
  const [debtors, setDebtors] = useState(() => db.getDebtors());
  const [newDebtorName, setNewDebtorName] = useState('');
  const [newDebtorAmount, setNewDebtorAmount] = useState('');
  
  // App Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const smeTax = calculateSARS_SMETax(financials.profit, financials.totalRevenue);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ show: true, message: msg, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const syncFinancials = () => {
      setFinancials(db.getFinancialSummary());
      setDebtors(db.getDebtors());
    };
    window.addEventListener('ibos-data-change', syncFinancials);
    window.addEventListener('ibos-sync-complete', syncFinancials);
    return () => {
      window.removeEventListener('ibos-data-change', syncFinancials);
      window.removeEventListener('ibos-sync-complete', syncFinancials);
    };
  }, []);

  useEffect(() => {
    QRCode.toDataURL('IBOS_MERCHANT_OP78219_VERIFIED', {
      color: { dark: '#18181B', light: '#FFFFFF' },
      margin: 1,
      width: 120
    })
    .then(url => setQrCodeDataUrl(url))
    .catch(err => console.error(err));
  }, []);

  const handleSaveExpense = () => {
      if (expenseAmount) {
          db.addExpense({
              id: Date.now().toString(),
              amount: parseFloat(expenseAmount),
              category: expenseCategory || 'General',
              timestamp: Date.now(),
              synced: false
          });
          setShowExpenseModal(false);
          setExpenseAmount('');
          setExpenseCategory('');
          showToast('Expense logged to ledger');
      }
  };

  const handleAddDebtor = () => {
      if (newDebtorName && newDebtorAmount) {
          const updated = [...debtors, { id: Date.now(), name: newDebtorName, amount: parseFloat(newDebtorAmount) }];
          setDebtors(updated);
          db.saveDebtors(updated);
          setNewDebtorName('');
          setNewDebtorAmount('');
          showToast('Customer record updated');
      }
  };

  const markDebtorPaid = (id: number) => {
      const updated = debtors.filter(d => d.id !== id);
      setDebtors(updated);
      db.saveDebtors(updated);
      showToast('Debt settlement recorded');
  };

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Top Welcome / Merchant Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Mama Dlamini Spaza Store
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
            <span className="font-mono text-[11px] text-neutral-700">OP-78219</span>
            <span aria-hidden="true">·</span>
            <span>Gauteng Sector 4</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              Verified Enterprise
            </span>
          </div>
        </div>

        {/* View Mode Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto border border-neutral-200/60">
          <button 
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'overview' 
                ? 'bg-white text-neutral-900 shadow-subtle' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setViewMode('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'analytics' 
                ? 'bg-white text-neutral-900 shadow-subtle' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Primary Financial Canvas Card */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-card border border-neutral-800 relative overflow-hidden space-y-4">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Cumulative Net Operating Margin
              </span>
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded">
                SARS SBC Verified
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-mono tabular-nums">
                R {financials.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs text-neutral-300">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Inflows:</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-400">
                  +R {financials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-neutral-700" aria-hidden="true">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Outflows:</span>
                <span className="font-mono tabular-nums font-semibold text-rose-400">
                  -R {financials.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-neutral-700" aria-hidden="true">|</span>
              <div 
                onClick={() => onNavigate(AppRoute.FINANCE)}
                className="flex items-center gap-1.5 cursor-pointer group"
                title="View South African SME Tax Schedule in Finance Ledger"
              >
                <span className="text-neutral-400 group-hover:text-amber-300 transition-colors">Tax To Pay:</span>
                <span className="font-mono tabular-nums font-bold text-amber-300 group-hover:underline">
                  R {smeTax.taxToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                  SARS SME
                </span>
              </div>
            </div>
          </div>

          {/* Quick Verified Passport Pass */}
          <div className="flex items-center gap-4 bg-neutral-800/70 border border-neutral-700/60 rounded-xl p-3 shrink-0">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="IBOS Digital ID" className="w-14 h-14 rounded-lg bg-white p-1" />
            ) : (
              <div className="w-14 h-14 bg-neutral-700 rounded-lg flex items-center justify-center font-mono text-xs">ID</div>
            )}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider block">
                Digital Pass
              </span>
              <p className="text-xs font-mono font-medium text-white">OP-78219</p>
              <button 
                onClick={() => onNavigate(AppRoute.COMPLIANCE)}
                className="text-[11px] text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                Inspect credentials <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Strip when viewMode is 'analytics' */}
        {viewMode === 'analytics' && (
          <div className="pt-3 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/40">
              <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Post-Tax Margin</span>
              <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                R {smeTax.netAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Net retained after SARS liability</p>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/40">
              <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Tax Bracket Applied</span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {smeTax.rateApplied} ({smeTax.bracketName.split(' ')[0]})
              </span>
              <p className="text-[10px] text-neutral-400 mt-0.5">SARS Sec 12E Small Business Corp</p>
            </div>
            <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/40">
              <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Operating Ratio</span>
              <span className="text-sm font-mono font-bold text-white tabular-nums">
                {financials.totalRevenue > 0 
                  ? `${Math.round((financials.profit / financials.totalRevenue) * 100)}% Margin` 
                  : 'N/A'}
              </span>
              <p className="text-[10px] text-neutral-400 mt-0.5">Healthy liquidity threshold</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Operational Actions
          </h2>
          <span className="text-xs text-neutral-400 font-mono">4 Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate(AppRoute.SALES)}
            className="group bg-white border border-neutral-200/90 hover:border-neutral-900 rounded-xl p-4 text-left shadow-card transition-all active:scale-[0.99] flex flex-col justify-between h-28"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center transition-colors group-hover:bg-neutral-900 group-hover:text-white">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-900 block tracking-tight">Record Sale</span>
              <span className="text-[11px] text-neutral-500">POS terminal</span>
            </div>
          </button>

          <button 
            onClick={() => setShowExpenseModal(true)}
            className="group bg-white border border-neutral-200/90 hover:border-neutral-900 rounded-xl p-4 text-left shadow-card transition-all active:scale-[0.99] flex flex-col justify-between h-28"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors group-hover:bg-neutral-900 group-hover:text-white">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-900 block tracking-tight">Log Outflow</span>
              <span className="text-[11px] text-neutral-500">Stock & bills</span>
            </div>
          </button>

          <button 
            onClick={() => setShowDebtorsModal(true)}
            className="group bg-white border border-neutral-200/90 hover:border-neutral-900 rounded-xl p-4 text-left shadow-card transition-all active:scale-[0.99] flex flex-col justify-between h-28"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors group-hover:bg-neutral-900 group-hover:text-white">
              <BookOpen size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-900 block tracking-tight">Customer Credit</span>
              <span className="text-[11px] text-neutral-500">R 170 outstanding</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate(AppRoute.TRADE)}
            className="group bg-white border border-neutral-200/90 hover:border-neutral-900 rounded-xl p-4 text-left shadow-card transition-all active:scale-[0.99] flex flex-col justify-between h-28"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors group-hover:bg-neutral-900 group-hover:text-white">
              <Package size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-900 block tracking-tight">Inventory Catalog</span>
              <span className="text-[11px] text-neutral-500">Audit & restock</span>
            </div>
          </button>
        </div>
      </div>

      {/* Voice Assistant Strip */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
            <Mic size={16} />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-900 block tracking-tight">
              Voice Assistant & Natural Language
            </span>
            <p className="text-[11px] text-neutral-500">
              Dictate sales or inventory queries in isiZulu, Sesotho, or English
            </p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => onNavigate(AppRoute.ASSISTANT)}
        >
          Open Assistant
        </Button>
      </div>

      {/* Real-Time Local Commodity Radar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
              Local Commodity & Supplier Intelligence
            </h3>
            <p className="text-xs text-neutral-500">
              Aggregated wholesale benchmarks within 5km radius
            </p>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">Updated 12m ago</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                <th className="py-2 font-medium">Commodity</th>
                <th className="py-2 font-medium text-right">Avg Wholesaler</th>
                <th className="py-2 font-medium text-right">Recommended Retail</th>
                <th className="py-2 font-medium text-right">7-Day Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              <tr className="hover:bg-neutral-50/70 transition-colors">
                <td className="py-2.5 font-medium text-neutral-900">Tomatoes (1kg Box)</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-600">R 18.50</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-900 font-semibold">R 26.00</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-emerald-600 font-medium">+15.0%</td>
              </tr>
              <tr className="hover:bg-neutral-50/70 transition-colors">
                <td className="py-2.5 font-medium text-neutral-900">White Bread (700g Loaf)</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-600">R 14.20</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-900 font-semibold">R 19.50</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-500">Stable</td>
              </tr>
              <tr className="hover:bg-neutral-50/70 transition-colors">
                <td className="py-2.5 font-medium text-neutral-900">Sunflower Oil (2L)</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-600">R 62.00</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-900 font-semibold">R 79.99</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-rose-600 font-medium">-2.4%</td>
              </tr>
              <tr className="hover:bg-neutral-50/70 transition-colors">
                <td className="py-2.5 font-medium text-neutral-900">Maize Meal (5kg)</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-600">R 48.00</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-neutral-900 font-semibold">R 62.50</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-emerald-600 font-medium">+4.1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit & Working Capital Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Working Capital
            </span>
            <span className="text-xs font-medium text-emerald-700">Pre-Qualified</span>
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono tabular-nums">
              R 15,000<span className="text-base text-neutral-400">.00</span>
            </span>
            <p className="text-xs text-neutral-500 mt-1">
              Micro-credit line ready based on 60 days of verified transaction history.
            </p>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            fullWidth 
            onClick={() => onNavigate(AppRoute.CAPITAL)}
          >
            Review Capital Facility
          </Button>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Stock Warnings
            </span>
            <span className="text-xs font-medium text-amber-700">1 Item Low</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-900 block">
              Albany Superior White Bread
            </span>
            <p className="text-xs text-neutral-500 mt-1">
              3 units remaining. Estimated stockout in 2 hours based on daily velocity.
            </p>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            fullWidth 
            onClick={() => onNavigate(AppRoute.TRADE)}
          >
            Reorder Stock
          </Button>
        </div>
      </div>

      {/* EXPENSE LOG MODAL */}
      <Modal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)} 
        title="Record Expense Outflow"
      >
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
              Confirm Ledger Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* DEBTORS BOOK MODAL */}
      <Modal 
        isOpen={showDebtorsModal} 
        onClose={() => setShowDebtorsModal(false)} 
        title="Customer Credit Book"
      >
        <div className="space-y-4">
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Total Outstanding Credit
              </p>
              <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-0.5">
                R {debtors.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-500">{debtors.length} customers</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Active Debtors
            </h4>
            {debtors.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No outstanding balances.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {debtors.map(debtor => (
                  <div key={debtor.id} className="flex justify-between items-center bg-white border border-neutral-200/80 p-3 rounded-xl">
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{debtor.name}</div>
                      <div className="text-xs font-mono tabular-nums text-neutral-500">Owes: R {debtor.amount.toFixed(2)}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => markDebtorPaid(debtor.id)}>
                      Mark Settled
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-900">Add Customer Debt</h4>
            <Input 
              label="Customer Name" 
              placeholder="e.g. Sipho" 
              value={newDebtorName} 
              onChange={(e: any) => setNewDebtorName(e.target.value)} 
            />
            <Input 
              label="Amount (ZAR)" 
              type="number" 
              placeholder="0.00" 
              value={newDebtorAmount} 
              onChange={(e: any) => setNewDebtorAmount(e.target.value)} 
            />
            <Button fullWidth variant="primary" onClick={handleAddDebtor} disabled={!newDebtorName || !newDebtorAmount}>
              Record Credit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};