import React, { useState } from 'react';
import { analyzeReceiptImage } from '../../services/geminiService';
import { Toast } from '../../components/DesignSystem';

export const ReceiptScanner: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as const });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      try {
        const jsonString = await analyzeReceiptImage(e.target.files[0]);
        setResult(jsonString);
      } catch (err) {
        showToast("Failed to analyze receipt", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      <div>
        <h3 className="text-base font-bold text-neutral-900">Receipt Scanner</h3>
        <p className="text-xs text-neutral-500">Upload a receipt or invoice slip to extract totals and line items.</p>
      </div>
      
      <div className="border border-dashed border-neutral-300 rounded-2xl p-8 text-center bg-white hover:bg-neutral-50 transition-colors">
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange} 
          className="hidden" 
          id="receipt-upload"
        />
        <label htmlFor="receipt-upload" className="cursor-pointer block">
          <div className="text-3xl mb-2">🧾</div>
          <span className="text-xs font-semibold text-neutral-900">Tap to Upload Receipt</span>
          <p className="text-[11px] text-neutral-400 mt-0.5">JPEG, PNG or camera capture</p>
        </label>
      </div>

      {loading && <div className="text-center text-xs text-neutral-500">Processing receipt...</div>}

      {result && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-card">
          <h4 className="font-semibold text-xs text-neutral-900 mb-2">Parsed Receipt Details</h4>
          <pre className="text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-100 overflow-x-auto whitespace-pre-wrap font-mono text-neutral-800">
            {result}
          </pre>
          <button className="w-full mt-3 bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors">
            Save to Ledger
          </button>
        </div>
      )}
    </div>
  );
};
