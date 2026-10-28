import React, { useState } from 'react';
import { generateBusinessStrategy } from '../../services/geminiService';
import { Toast } from '../../components/DesignSystem';

export const BusinessStrategy: React.FC = () => {
  const [context, setContext] = useState("");
  const [strategy, setStrategy] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as const });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleThink = async () => {
    if (!context) return;
    setLoading(true);
    try {
      const result = await generateBusinessStrategy(context);
      setStrategy(result);
    } catch (e) {
      showToast("Error generating strategy", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      <div>
        <h3 className="text-base font-bold text-neutral-900">Trading Roadmap & Strategy</h3>
        <p className="text-xs text-neutral-500">Describe your store situation or trade challenge to get practical action steps.</p>
      </div>
      
      <textarea
        className="w-full border border-neutral-200 rounded-2xl p-3.5 h-32 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 resize-none placeholder:text-neutral-400 bg-white shadow-subtle"
        placeholder="e.g. My spaza store wants to buy bulk maize directly from millers to improve gross margin from 14% to 22%. What are the best supplier terms to ask for?"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      <button 
        onClick={handleThink}
        disabled={loading || !context}
        className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold flex justify-center items-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
            <span>Analyzing scenario...</span>
          </>
        ) : (
          "Generate Roadmap"
        )}
      </button>

      {strategy && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-card mt-4">
          <h4 className="font-semibold text-xs text-neutral-900 mb-2">Recommended Roadmap</h4>
          <div className="prose text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans">
            {strategy}
          </div>
        </div>
      )}
    </div>
  );
};
