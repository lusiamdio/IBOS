import React from 'react';
import { AppRoute } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages, Receipt, Video, BrainCircuit, Palette, ArrowRight } from 'lucide-react';

interface ToolsProps {
  onSelectTool: (toolId: string) => void;
  onNavigate: (route: AppRoute) => void;
}

export const Tools: React.FC<ToolsProps> = ({ onSelectTool, onNavigate }) => {
  const { t } = useLanguage();
  
  const tools = [
    { id: 'afri_translate', name: 'AfriTranslate', desc: 'Dialect translation & negotiation', icon: Languages },
    { id: 'receipt_scanner', name: 'Receipt Scanner', desc: 'OCR digitization for paper slips', icon: Receipt },
    { id: 'inventory_video', name: 'Video Stock Count', desc: 'Computer vision shelf audit', icon: Video },
    { id: 'business_strategy', name: 'Business Intelligence', desc: 'Turnover & inventory insights', icon: BrainCircuit },
    { id: 'image_generator', name: 'Storefront Graphics', desc: 'Marketing promotions & banners', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-200/80">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
          Enterprise Business Tools
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Specialized intelligence utilities, translation engines & document scanners
        </p>
      </div>

      {/* Tools Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="bg-white p-4 rounded-2xl shadow-card border border-neutral-200/80 hover:border-neutral-900 flex items-start text-left transition-all active:scale-[0.99] group"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mr-3 shrink-0 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-950">
                    {tool.name}
                  </h3>
                  <ArrowRight size={12} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">{tool.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Cooperative Syndicate Membership */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Trader Cooperative Alliance
          </span>
          <span className="text-xs font-mono text-emerald-700">Verified Member</span>
        </div>

        <div className="flex items-center justify-between bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/70">
          <div>
            <div className="text-xs font-semibold text-neutral-900">Soweto Informal Traders Syndicate</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Co-op ID: COOP-4091 · 48 Active Merchants</div>
          </div>
          <button 
            className="text-xs font-medium text-neutral-900 hover:underline px-2 py-1"
            onClick={() => onNavigate(AppRoute.ASSISTANT)}
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
};