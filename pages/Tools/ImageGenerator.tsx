import React, { useState } from 'react';
import { generateHighQualityImage } from '../../services/geminiService';
import { Input, Button } from '../../components/DesignSystem';
import { Image as ImageIcon, Loader2, Download } from 'lucide-react';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const resultUrl = await generateHighQualityImage(prompt, aspectRatio);
      setImageUrl(resultUrl);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate image. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
        <h3 className="font-bold text-base text-neutral-900 mb-1 flex items-center gap-2">
           <ImageIcon size={18} className="text-neutral-700" />
           Storefront Graphics Studio
        </h3>
        <p className="text-xs text-neutral-500 mb-6">Create promotional signs, price cards, and banner graphics for your store.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Image Description</label>
            <Input 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="e.g. A vibrant street market stand selling fresh local produce..."
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Aspect Ratio</label>
             <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '1:1', label: 'Square (1:1)' },
                  { value: '16:9', label: 'Landscape (16:9)' },
                  { value: '9:16', label: 'Portrait (9:16)' }
                ].map((ratio) => (
                   <button
                     key={ratio.value}
                     onClick={() => setAspectRatio(ratio.value)}
                     className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                       aspectRatio === ratio.value 
                         ? 'border-primary-500 bg-primary-50 text-primary-700' 
                         : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                     }`}
                   >
                     {ratio.label}
                   </button>
                ))}
             </div>
          </div>

          <Button 
            className="w-full h-12 mt-2" 
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
               <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Generating...</span>
            ) : "Generate Image"}
          </Button>
          
          {error && <div className="text-danger-600 text-sm font-bold bg-danger-50 p-3 rounded-xl border border-danger-100">{error}</div>}
        </div>
      </div>
      
      {imageUrl && (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-neutral-200 animate-fade-in text-center">
            <h3 className="font-bold text-sm text-neutral-800 mb-4 uppercase tracking-widest">Generated Asset</h3>
            <img src={imageUrl} alt="Generated" className="w-full rounded-2xl shadow-inner mb-4" />
            <a 
              href={imageUrl} 
              download={`asset-${Date.now()}.png`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-bold text-sm shadow-soft-sm transition-transform hover:scale-105 active:scale-95"
            >
               <Download size={18} />
               Download High-Res
            </a>
        </div>
      )}
    </div>
  );
};
