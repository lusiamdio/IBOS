import React, { useState } from 'react';
import { translateContent } from '../../services/translationService';
import { Toast, Button } from '../../components/DesignSystem';
import { Languages, Copy, Check } from 'lucide-react';

export const AfriTranslate: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [targetLang, setTargetLang] = useState("Swahili");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as const });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleTranslate = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const result = await translateContent(inputText, targetLang);
      setTranslation(result);
    } catch (e: any) {
      showToast(e.message || "Error during translation", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      {/* Header */}
      <div className="pb-2 border-b border-neutral-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Languages size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">AfriTranslate Dialect Intelligence</h2>
            <p className="text-xs text-neutral-500">Cross-border supplier negotiation and customer communications</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-neutral-200/80 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 ml-0.5">
            Target Dialect / Region
          </label>
          <select 
            className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            <option value="Swahili">Swahili (East Africa)</option>
            <option value="Zulu">isiZulu (South Africa)</option>
            <option value="Yoruba">Yorùbá (West Africa)</option>
            <option value="Igbo">Igbo (Nigeria)</option>
            <option value="Hausa">Hausa (Sahel / Northern Nigeria)</option>
            <option value="Amharic">Amharic (Ethiopia)</option>
            <option value="French (African context)">Français (Francophone West & Central)</option>
            <option value="Portuguese (African context)">Português (Mozambique / Angola)</option>
            <option value="English (Pidgin/Local)">English (Pidgin / Informal Market)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 ml-0.5">
            Trading Message or Supplier Query
          </label>
          <textarea
            className="w-full border border-neutral-200 rounded-xl p-3.5 h-28 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 resize-none placeholder:text-neutral-400"
            placeholder="Type commercial query, price offer, or trade message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        <Button 
          fullWidth
          variant="primary"
          onClick={handleTranslate}
          disabled={loading || !inputText}
        >
          {loading ? "Synthesizing Translation..." : "Translate Content"}
        </Button>
      </div>

      {translation && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-card space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Output in {targetLang}
            </span>
            <button 
              onClick={handleCopy}
              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
            {translation}
          </div>
        </div>
      )}
    </div>
  );
};
