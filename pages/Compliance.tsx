import React from 'react';
import { Button } from '../components/DesignSystem';
import { AppRoute } from '../types';
import { FileText, Landmark, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ComplianceProps {
  onNavigate: (route: AppRoute) => void;
}

export const Compliance: React.FC<ComplianceProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-200/80">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
          Regulatory Compliance & Formalization
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Municipal trading licenses, SARS turnover status & formal enterprise verification
        </p>
      </div>

      {/* Compliance Overview Hero */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-card border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Formal Standing
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Level 2 Municipal Recognition
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Gauteng Local Economic Development Board · Safe Harbor Certified
            </p>
          </div>

          <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700/60 text-right">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase block">Verification Rating</span>
            <span className="font-mono text-base font-bold text-emerald-400">92% Complete</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: '92%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
            <span>Zoning Verification</span>
            <span>Permit Renewal: 180 Days</span>
          </div>
        </div>
      </div>

      {/* Municipal Documents & Safe Harbor */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Automated Legal Filings
          </h3>
          <span className="text-xs font-mono text-neutral-400">Direct LED Routing</span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3.5 rounded-xl border border-neutral-200/80 flex items-center justify-between hover:border-neutral-900 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-900">Hawker & Informal Trader Permit</h4>
                <p className="text-[11px] text-neutral-500">Auto-populated with verified stall coordinates</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onNavigate(AppRoute.ASSISTANT)}>
              Generate Dossier
            </Button>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200/80 flex items-center justify-between hover:border-neutral-900 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                <Landmark size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-900">SARS Turnover Exemption Status</h4>
                <p className="text-[11px] text-neutral-500">Qualifies under R 1M informal enterprise threshold</p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
              <ShieldCheck size={14} /> Exempted
            </span>
          </div>
        </div>
      </div>

      {/* Structured Enterprise Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Commercial Formalization Roadmap
          </h3>
          <span className="text-xs font-mono text-neutral-400">Stage 2 of 4</span>
        </div>

        <div className="space-y-2">
          {[
            { title: "Municipal LED Street Permit", status: "Active & Recorded", verified: true, desc: "Authorizes lawful trading at demarcated sector stall." },
            { title: "SARS Micro-Business Tax Filing", status: "Pre-Configured", verified: true, desc: "0% tax bracket on verified revenue under R 335,000." },
            { title: "Commercial Bank Account Separation", status: "Available", verified: false, desc: "Connect dedicated enterprise checking to isolate business flows." },
            { title: "CIPC Enterprise Incorporation", status: "Optional Upgrade", verified: false, desc: "Convert informal sole proprietor into registered Pty Ltd." },
          ].map((item, i) => (
            <div 
              key={i} 
              className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-card flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-neutral-900">{item.title}</h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    item.verified ? 'bg-neutral-100 text-neutral-800 font-medium' : 'bg-neutral-50 text-neutral-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">{item.desc}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onNavigate(AppRoute.ASSISTANT)}
              >
                Review
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};