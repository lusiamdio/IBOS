import React, { useState, useEffect } from 'react';
import { Button, Modal, Toast } from '../components/DesignSystem';
import { ShareCatalogModal } from '../components/ShareCatalogModal';
import { db } from '../services/storage';
import { InventoryItem, SaleItem, Sale } from '../types';
import QRCode from 'qrcode';
import { useLanguage } from '../contexts/LanguageContext';
import { CreditCard, Banknote, QrCode as QrIcon, CheckCircle2, Share2, Plus, Minus, RotateCcw, Receipt } from 'lucide-react';

const RATE_NGN = 85; // 1 ZAR = ~85 NGN

export const Sales: React.FC = () => {
    const [amount, setAmount] = useState(0);
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [currency, setCurrency] = useState<'ZAR' | 'NGN'>('ZAR');
    
    // UI State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showShareCatalogModal, setShowShareCatalogModal] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
    
    // QR Code State
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    const { t } = useLanguage();

    useEffect(() => {
        setInventory(db.getInventory());
    }, []);

    const formatPrice = (val: number, showSymbol = true) => {
        if (currency === 'NGN') {
            const converted = val * RATE_NGN;
            return showSymbol ? `₦ ${converted.toLocaleString()}` : converted.toLocaleString();
        }
        return showSymbol ? `R ${val.toLocaleString()}` : val.toLocaleString();
    };

    const addToCart = (item: InventoryItem, qty: number = 1) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(i => i.productId === item.id);
            if (existingIndex >= 0) {
                const newCart = [...prev];
                const newQty = newCart[existingIndex].quantity + qty;
                if (newQty <= 0) {
                    newCart.splice(existingIndex, 1);
                } else {
                    newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQty };
                }
                return newCart;
            }
            if (qty > 0) {
                return [...prev, { productId: item.id, name: item.name, price: item.price, quantity: qty }];
            }
            return prev;
        });
        setAmount(prev => Math.max(0, prev + (item.price * qty)));
    };

    const handleClear = () => {
        setAmount(0);
        setCart([]);
        setQrCodeUrl(null);
    };

    const handleNewSale = () => {
        handleClear();
        setLastSale(null);
        setShowSuccessModal(false);
    };

    const initiatePayment = () => {
        if (amount === 0) return;
        setQrCodeUrl(null);
        setShowPaymentModal(true);
    };

    const generatePaymentQR = async () => {
        setIsGeneratingQR(true);
        try {
            const transactionId = `txn_${Date.now()}`;
            const displayAmount = currency === 'NGN' ? amount * RATE_NGN : amount;
            
            const paymentData = {
                id: transactionId,
                amount: displayAmount,
                currency: currency,
                merchant: "IBOS Merchant",
                items: cart.map(i => ({ name: i.name, qty: i.quantity }))
            };
            
            const url = await QRCode.toDataURL(JSON.stringify(paymentData), {
                width: 256,
                margin: 2,
                color: {
                    dark: '#18181B',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(url);
        } catch (err) {
            console.error("QR Gen Error", err);
            setToast({ show: true, message: 'Could not generate payment QR', type: 'error' });
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const completeSale = (method: string) => {
        const sale: Sale = {
            id: Date.now().toString(),
            items: cart,
            total: amount,
            currency,
            method,
            timestamp: Date.now(),
            synced: false
        };

        db.addSale(sale);

        setInventory(prev => prev.map(invItem => {
            const cartItem = cart.find(c => c.productId === invItem.id);
            if (cartItem) {
                return { ...invItem, quantity: invItem.quantity - cartItem.quantity };
            }
            return invItem;
        }));

        const displayTotal = formatPrice(amount);
        setToast({ show: true, message: `Recorded ${displayTotal} via ${method}`, type: 'success' });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);

        setLastSale(sale);
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        setQrCodeUrl(null);
    };

    const shareInvoiceWhatsApp = () => {
        if (!lastSale) return;
        
        const date = new Date(lastSale.timestamp).toLocaleDateString();
        const time = new Date(lastSale.timestamp).toLocaleTimeString();
        
        const isNgn = lastSale.currency === 'NGN';
        const rate = isNgn ? RATE_NGN : 1;
        const symbol = isNgn ? '₦' : 'R';
        const displayTotal = (lastSale.total * rate).toLocaleString();

        let message = `INVOICE - IBOS Merchant\n`;
        message += `Date: ${date} at ${time}\n`;
        message += `Ref: ${lastSale.id.slice(-6)}\n\n`;
        message += `ITEMS:\n`;
        lastSale.items.forEach(item => {
             const p = item.price * rate;
             message += `${item.quantity}x ${item.name} (${symbol}${p.toLocaleString()})\n`;
        });
        message += `\nTOTAL: ${symbol} ${displayTotal}\n`;
        message += `Method: ${lastSale.method}\n`;
        message += `Thank you for your business.`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <Toast show={toast.show} message={toast.message} type={toast.type} />

            {/* Total Display Screen */}
            <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-card border border-neutral-800 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Current Register Total
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-neutral-800 p-0.5 rounded-lg border border-neutral-700/80">
                            <button 
                                onClick={() => setCurrency('ZAR')}
                                className={`px-2 py-0.5 text-xs font-mono rounded ${currency === 'ZAR' ? 'bg-white text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-white'}`}
                            >
                                ZAR
                            </button>
                            <button 
                                onClick={() => setCurrency('NGN')}
                                className={`px-2 py-0.5 text-xs font-mono rounded ${currency === 'NGN' ? 'bg-white text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-white'}`}
                            >
                                NGN
                            </button>
                        </div>
                        {amount > 0 && (
                            <button 
                                onClick={handleClear}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-rose-950/40 border border-rose-900/50"
                            >
                                <RotateCcw size={11} /> Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex items-baseline justify-between">
                    <div>
                        <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight tabular-nums">
                            {formatPrice(amount)}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                            {cart.length === 0 ? 'No items in current transaction' : `${cart.reduce((s, i) => s + i.quantity, 0)} units selected`}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 sm:min-w-[160px]">
                        <Button 
                            variant="accent"
                            size="md"
                            onClick={initiatePayment}
                            disabled={amount === 0}
                            className="w-full justify-center shadow-subtle font-semibold"
                        >
                            Charge Total
                        </Button>
                        <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowInvoiceModal(true)}
                            disabled={amount === 0}
                            className="w-full justify-center bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs py-1.5 transition-colors"
                        >
                            <Receipt size={13} className="mr-1.5" /> Draft Receipt
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Amount Injections */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-card">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                    Quick Cash Denominations
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {(currency === 'NGN' ? [500, 1000, 2000, 5000] : [10, 20, 50, 100, 200]).map(val => (
                        <button
                            key={val}
                            onClick={() => addToCart({ id: `custom_${val}`, name: `Quick Item (${val})`, price: val, quantity: 999 }, 1)}
                            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl py-2 px-3 text-center transition-colors font-mono tabular-nums text-xs font-semibold text-neutral-800"
                        >
                            +{currency === 'NGN' ? '₦' : 'R'}{val}
                        </button>
                    ))}
                    <div className="col-span-2 flex items-center gap-1.5">
                        <input 
                            type="number" 
                            placeholder="Custom amount"
                            className="w-full bg-white border border-neutral-200 rounded-xl py-1.5 px-3 text-xs font-mono focus:outline-none focus:border-neutral-900"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = parseFloat(e.currentTarget.value);
                                    if (!isNaN(val) && val > 0) {
                                        addToCart({ id: `custom_${Date.now()}`, name: 'Custom Item', price: val, quantity: 999 }, 1);
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Product Catalog Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Quick Items Catalog
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowShareCatalogModal(true)}
                            className="text-xs font-medium text-neutral-700 hover:text-neutral-950 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200/80 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                        >
                            <Share2 size={12} /> Share Catalog
                        </button>
                        <span className="text-xs text-neutral-400 font-mono">{inventory.length} items</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {inventory.map((item) => {
                        const inCart = cart.find(c => c.productId === item.id)?.quantity || 0;
                        return (
                            <div 
                                key={item.id}
                                className={`bg-white border rounded-2xl p-4 shadow-card transition-all flex flex-col justify-between ${
                                    inCart > 0 ? 'border-neutral-900 ring-1 ring-neutral-900/10' : 'border-neutral-200/80 hover:border-neutral-300'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <h4 className="text-xs font-semibold text-neutral-900 leading-snug">
                                            {item.name}
                                        </h4>
                                        <p className="text-xs font-mono font-medium text-neutral-500 mt-1 tabular-nums">
                                            {formatPrice(item.price)}
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-mono text-neutral-400">
                                        Qty: {item.quantity}
                                    </span>
                                </div>

                                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                                    {inCart === 0 ? (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            fullWidth
                                            onClick={() => addToCart(item, 1)}
                                        >
                                            <Plus size={12} className="mr-1" /> Add to Sale
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
                                                <button 
                                                    onClick={() => addToCart(item, -1)} 
                                                    className="w-6 h-6 rounded bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="font-mono text-xs font-semibold px-2 tabular-nums">
                                                    {inCart}
                                                </span>
                                                <button 
                                                    onClick={() => addToCart(item, 1)} 
                                                    className="w-6 h-6 rounded bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <span className="text-xs font-mono font-semibold text-neutral-900 tabular-nums">
                                                {formatPrice(item.price * inCart)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PAYMENT METHOD MODAL */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Select Settlement Method">
                <div className="space-y-3">
                    {!qrCodeUrl ? (
                        <>
                            <button 
                                onClick={() => completeSale('Cash')} 
                                className="w-full flex items-center p-3.5 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mr-3 shrink-0">
                                    <Banknote size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-neutral-900">Cash Payment</div>
                                    <div className="text-[11px] text-neutral-500">Record in local drawer and update register</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => completeSale('Card / Yoco')} 
                                className="w-full flex items-center p-3.5 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mr-3 shrink-0">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-neutral-900">Card / Yoco / Speedpoint</div>
                                    <div className="text-[11px] text-neutral-500">Chip & PIN or Tap-to-Pay POS</div>
                                </div>
                            </button>

                            <button 
                                onClick={generatePaymentQR} 
                                className="w-full flex items-center p-3.5 bg-white border border-neutral-200/90 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mr-3 shrink-0">
                                    <QrIcon size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-neutral-900">Scan to Pay (Digital QR)</div>
                                    <div className="text-[11px] text-neutral-500">Generate on-screen merchant QR for customer</div>
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="text-center space-y-4 py-2">
                            <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-card inline-block">
                                <img src={qrCodeUrl} alt="Payment QR" className="w-44 h-44" />
                            </div>
                            <p className="text-xs font-mono font-medium text-neutral-600">
                                Scan to settle {formatPrice(amount)}
                            </p>
                            <div className="flex gap-2">
                                <Button fullWidth variant="secondary" onClick={() => setQrCodeUrl(null)}>
                                    Back
                                </Button>
                                <Button fullWidth variant="primary" onClick={() => completeSale('QR Payment')}>
                                    Confirm Settled
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* RECEIPT SUCCESS MODAL */}
            <Modal isOpen={showSuccessModal} onClose={handleNewSale} title="Transaction Settled">
                <div className="text-center space-y-4 py-2">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
                            {lastSale && (lastSale.currency === 'NGN' ? `₦ ${(lastSale.total * RATE_NGN).toLocaleString()}` : `R ${lastSale.total.toLocaleString()}`)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Logged to local ledger & inventory synced</p>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Button fullWidth variant="primary" onClick={shareInvoiceWhatsApp}>
                            <Share2 size={14} className="mr-2" /> Share Receipt via WhatsApp
                        </Button>
                        <Button fullWidth variant="secondary" onClick={handleNewSale}>
                            Start Next Sale
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* DRAFT RECEIPT MODAL */}
            <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Draft Receipt">
                <div className="space-y-4">
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 space-y-3">
                        <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-200/80">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-900">IBOS Verified Draft Slip</span>
                                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    SARS SME Ready
                                </span>
                            </div>
                            <span className="font-mono text-neutral-500 text-[11px]">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-700">{item.quantity}× {item.name}</span>
                                    <span className="font-mono tabular-nums text-neutral-900 font-medium">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-neutral-200/80 space-y-1">
                            <div className="flex justify-between items-center text-[11px] text-neutral-500">
                                <span>Subtotal</span>
                                <span className="font-mono tabular-nums">{formatPrice(amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-neutral-500">
                                <span>SARS Turnover Tax Status</span>
                                <span className="font-mono text-emerald-600">SME Exemption / 0% at Point-of-Sale</span>
                            </div>
                            <div className="pt-2 border-t border-neutral-200/80 flex justify-between items-center">
                                <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">Draft Total</span>
                                <span className="text-base font-bold font-mono tabular-nums text-neutral-950">{formatPrice(amount)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button fullWidth variant="secondary" onClick={() => setShowInvoiceModal(false)}>
                            Close
                        </Button>
                        <Button fullWidth variant="primary" onClick={() => {
                            setShowInvoiceModal(false);
                            initiatePayment();
                        }}>
                            Proceed to Charge
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* SHARE CATALOG MODAL */}
            <ShareCatalogModal
                isOpen={showShareCatalogModal}
                onClose={() => setShowShareCatalogModal(false)}
                inventory={inventory}
            />
        </div>
    );
};