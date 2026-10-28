import React, { useState } from 'react';
import { analyzeInventoryVideo } from '../../services/geminiService';
import { Toast } from '../../components/DesignSystem';

export const InventoryVideo: React.FC = () => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as const });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      try {
        const text = await analyzeInventoryVideo(
          e.target.files[0], 
          "Watch this video carefully. Identify all the products on the shelf, estimate their quantities, and suggest which items are running low."
        );
        setAnalysis(text);
      } catch (err) {
        showToast("Video processing failed", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      <div>
        <h3 className="text-base font-bold text-neutral-900">Video Stock Audit</h3>
        <p className="text-xs text-neutral-500">Record a video sweep along store shelves to estimate items and detect low inventory.</p>
      </div>
      
      <div className="border border-dashed border-neutral-300 rounded-2xl p-8 text-center bg-white hover:bg-neutral-50 transition-colors">
        <input 
          type="file" 
          accept="video/*"
          onChange={handleUpload} 
          className="hidden" 
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer block">
          <div className="text-3xl mb-2">📹</div>
          <span className="text-xs font-semibold text-neutral-900">Record or Select Shelf Video</span>
          <p className="text-[11px] text-neutral-400 mt-0.5">MP4, MOV up to 30 seconds</p>
        </label>
      </div>

      {loading && <div className="text-center text-xs text-neutral-500">Analyzing video frames...</div>}

      {analysis && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-card">
          <h4 className="font-semibold text-xs text-neutral-900 mb-2">Shelf Audit Summary</h4>
          <div className="prose text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
};
