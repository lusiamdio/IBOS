import React, { useState, useMemo } from 'react';
import { Modal, Button, Toast } from './DesignSystem';
import { InventoryItem } from '../types';
import { db } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Smartphone, 
  Copy, 
  Check, 
  Share2, 
  Store, 
  Phone, 
  FileText 
} from 'lucide-react';

interface ShareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: InventoryItem[];
}

export const ShareCatalogModal: React.FC<ShareCatalogModalProps> = ({
  isOpen,
  onClose,
  inventory: propInventory
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  // Get active inventory and merchant profile
  const items = useMemo(() => {
    if (propInventory && propInventory.length > 0) return propInventory;
    return db.getInventory();
  }, [propInventory, isOpen]);

  const profile = useMemo(() => {
    return db.getProfile() || {
      businessName: 'Mama Dlamini Spaza Store',
      fullName: 'Mama Dlamini',
      phone: '071 234 5678'
    };
  }, [isOpen]);

  const storeName = profile.businessName || 'IBOS Merchant Store';
  const contactPhone = customPhone.trim() || profile.phone || '071 234 5678';
  const contactEmail = customEmail.trim() || user?.email || 'lusimadio12@gmail.com';

  // Construct complete catalog text with product name, price, and contact
  const catalogText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`*${storeName.toUpperCase()}*`);
    lines.push(`Product Catalog & Price List`);
    lines.push(``);
    lines.push(`CONTACT DETAILS:`);
    lines.push(`• Phone / Orders: ${contactPhone}`);
    if (contactEmail) {
      lines.push(`• Email: ${contactEmail}`);
    }
    lines.push(``);
    lines.push(`PRODUCTS & PRICING:`);
    
    if (items.length === 0) {
      lines.push(`• No items currently registered in inventory`);
    } else {
      items.forEach((item, index) => {
        const price = Number(item.price || 0).toFixed(2);
        const qtyText = item.quantity > 0 ? `(Stock: ${item.quantity})` : `(On order)`;
        lines.push(`${index + 1}. ${item.name} — R ${price} ${qtyText}`);
      });
    }

    lines.push(``);
    lines.push(`Total Catalog Items: ${items.length}`);
    lines.push(`To place an order or check availability, please reply to this message or call ${contactPhone}.`);
    lines.push(`Thank you for supporting your local merchant.`);

    return lines.join('\n');
  }, [storeName, contactPhone, contactEmail, items]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2800);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(catalogText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = catalogText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast('Catalog text copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('Failed to copy text', 'error');
    }
  };

  // 1. WhatsApp
  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(catalogText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening WhatsApp');
  };

  // 2. Email
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${storeName} — Product Catalog & Price List`);
    const body = encodeURIComponent(catalogText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast('Opening Email Client');
  };

  // 3. Telegram
  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?text=${encodeURIComponent(catalogText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening Telegram');
  };

  // 4. Text Message (SMS)
  const handleShareSMS = () => {
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    window.location.href = `sms:${separator}body=${encodeURIComponent(catalogText)}`;
    showToast('Opening Messages App');
  };

  // Native share sheet fallback if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${storeName} Catalog`,
          text: catalogText,
        });
        showToast('Catalog shared');
      } catch (err) {
        // User cancelled or failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Product Catalog">
      <div className="space-y-4 text-neutral-900">
        <Toast show={toast.show} message={toast.message} type={toast.type} />

        {/* Merchant & Catalog summary */}
        <div className="bg-neutral-900 text-white rounded-xl p-4 space-y-2 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Storefront Catalog
              </span>
              <h3 className="text-sm font-semibold text-white mt-0.5">{storeName}</h3>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              {items.length} SKUs Listed
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Phone size={12} className="text-neutral-400" />
              <span className="font-mono text-neutral-300">{contactPhone}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-neutral-400" />
              <span className="text-neutral-300">{contactEmail}</span>
            </span>
          </div>
        </div>

        {/* 4 Share Channels Grid */}
        <div>
          <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
            Select Channel to Share Whole Catalog
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-3 rounded-xl border border-neutral-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MessageSquare size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-neutral-900 block group-hover:text-emerald-900">
                  WhatsApp
                </span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Direct or group chat
                </span>
              </div>
            </button>

            {/* Email */}
            <button
              type="button"
              onClick={handleShareEmail}
              className="p-3 rounded-xl border border-neutral-200 hover:border-blue-600 hover:bg-blue-50/40 text-left transition-all group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-neutral-900 block group-hover:text-blue-900">
                  Email
                </span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Price list with subject
                </span>
              </div>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleShareTelegram}
              className="p-3 rounded-xl border border-neutral-200 hover:border-sky-600 hover:bg-sky-50/40 text-left transition-all group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Send size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-neutral-900 block group-hover:text-sky-900">
                  Telegram
                </span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Channel or contact
                </span>
              </div>
            </button>

            {/* Text Message (SMS) */}
            <button
              type="button"
              onClick={handleShareSMS}
              className="p-3 rounded-xl border border-neutral-200 hover:border-violet-600 hover:bg-violet-50/40 text-left transition-all group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Smartphone size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-neutral-900 block group-hover:text-violet-900">
                  Text Message
                </span>
                <span className="text-[11px] text-neutral-500 block truncate">
                  Direct cellular SMS
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Catalog Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Catalog Message Preview
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 max-h-44 overflow-y-auto text-xs font-mono text-neutral-700 whitespace-pre-wrap leading-relaxed select-all">
            {catalogText}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Catalog Copied' : 'Copy Full Catalog'}</span>
          </Button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} />
              <span>More Channels</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onClose}
            className="px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
