import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, Toast } from '../components/DesignSystem';
import { ShareCatalogModal } from '../components/ShareCatalogModal';
import { db } from '../services/storage';
import { InventoryItem, AppRoute } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Users, Store, Link as LinkIcon, AlertCircle, Phone, MessageSquare, ExternalLink, Share2 } from 'lucide-react';

interface TradeProps {
  onNavigate: (route: AppRoute) => void;
}

export const Trade: React.FC<TradeProps> = ({ onNavigate }) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [showGroupBuyModal, setShowGroupBuyModal] = useState(false);
  const [showShareCatalogModal, setShowShareCatalogModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    setInventory(db.getInventory());
  }, []);

  const handleSaveStock = () => {
      if (!itemName || !quantity) return;
      
      const newItem: InventoryItem = {
          id: Date.now().toString(),
          name: itemName,
          quantity: parseInt(quantity),
          price: parseFloat(price) || 0,
          cost: parseFloat(cost) || 0,
          category: 'General',
          icon: '📦',
          lowStockThreshold: 5
      };

      db.addInventoryItem(newItem);
      setInventory(db.getInventory());

      setToast({ show: true, message: `Stocked ${quantity} x ${itemName}`, type: 'success' });
      setShowStockModal(false);
      
      setItemName('');
      setQuantity('');
      setCost('');
      setPrice('');
      
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const lowStockItems = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 0));
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

  const runPromoToast = () => {
    setToast({ show: true, message: 'Storefront catalogue link copied to clipboard', type: 'success' });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  };

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Inventory & Supply Network
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time stock ledger, wholesale consortiums & supplier contacts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => setShowShareCatalogModal(true)}
          >
            <Share2 size={13} className="mr-1.5" /> Share Catalog
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => setShowStockModal(true)}
          >
            <Plus size={13} className="mr-1" /> Add SKU Stock
          </Button>
        </div>
      </div>

      {/* Inventory Valuation & Health Strip */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-card border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Warehouse Valuation at Cost
          </span>
          <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums mt-1 text-white">
            R {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span className="font-mono text-neutral-300">{inventory.length} active SKUs</span>
            <span>·</span>
            <span>Optimal replenishment velocity</span>
          </div>
        </div>

        <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60 text-xs space-y-1">
          <div className="flex justify-between items-center gap-4 text-neutral-400">
            <span>Critical Reorder Alert</span>
            <span className="font-mono text-amber-400 font-semibold">{lowStockItems.length} SKUs</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-neutral-400">
            <span>Average Margin Spread</span>
            <span className="font-mono text-emerald-400 font-semibold">+32.4%</span>
          </div>
        </div>
      </div>

      {/* Low Stock Watchlist */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600" />
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Restock Reorder Required
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-700 font-medium">
              {lowStockItems.length} below threshold
            </span>
          </div>

          <div className="divide-y divide-neutral-100">
            {lowStockItems.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-neutral-900 block">{item.name}</span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Remaining: {item.quantity} units (Threshold: {item.lowStockThreshold})
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onNavigate(AppRoute.ASSISTANT)}
                >
                  Draft PO
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hyperlocal Bulk Purchasing Pool */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Active Regional Buying Syndicate
            </span>
            <h3 className="text-sm font-semibold text-neutral-900 mt-0.5">
              Parboiled Long Grain Rice (10kg Bags)
            </h3>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono text-neutral-900 tabular-nums">
              R 95.00
            </div>
            <span className="text-[11px] line-through text-neutral-400 font-mono">Retail R 120</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-neutral-900 h-full rounded-full transition-all" style={{ width: '65%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>Pool: 65 / 100 bags locked</span>
            <span>Soweto & Diepkloof cluster</span>
          </div>
        </div>

        <Button fullWidth variant="primary" onClick={() => setShowGroupBuyModal(true)}>
          Join Collective Order (Save 21%)
        </Button>
      </div>

      {/* Verified Suppliers Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Verified Supplier Directory
          </h3>
          <span className="text-xs font-mono text-neutral-400">4 Accounts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "Mama Dlamini Wholesalers", role: "Produce & Fresh Greens", phone: "072 123 4567", address: "Gauteng Fresh Market Stand 42", code: "SUP-01" },
            { name: "Soweto Cold Storage", role: "Meats, Poultry & Frozen", phone: "081 987 6543", address: "Warehouse 3, Orlando West", code: "SUP-02" },
            { name: "Crown Mines Cash & Carry", role: "Grains, Sugar & Oils", phone: "011 234 5678", address: "Crown Mines Distribution Depot", code: "SUP-03" },
            { name: "United Beverages Central", role: "Soft Drinks & Juices", phone: "0860 11 22 33", address: "Midrand Route Center", code: "SUP-04" }
          ].map((s, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSupplier(s)}
              className="bg-white border border-neutral-200/80 hover:border-neutral-900 rounded-2xl p-4 shadow-card transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-neutral-400 uppercase">{s.code}</span>
                  <h4 className="text-xs font-semibold text-neutral-900 mt-0.5">{s.name}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{s.role}</p>
                </div>
                <div className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                  <ExternalLink size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Item Listing */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Registered SKUs
          </h3>
          <span className="text-xs font-mono text-neutral-400">{inventory.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                <th className="py-2 font-medium">SKU Name</th>
                <th className="py-2 font-medium text-right">In Stock</th>
                <th className="py-2 font-medium text-right">Unit Cost</th>
                <th className="py-2 font-medium text-right">Selling Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-2.5 font-medium text-neutral-900">{item.name}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-neutral-600">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-neutral-600">
                    R {item.cost.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-neutral-900">
                    R {item.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STOCK MODAL */}
      <Modal isOpen={showStockModal} onClose={() => setShowStockModal(false)} title="Register New Inventory SKU">
        <div className="space-y-4">
          <Input 
            label="Item Description" 
            placeholder="e.g. Albany Superior White Bread"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Stock Quantity" 
              type="number" 
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input 
              label="Cost Price (ZAR)" 
              type="number" 
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <Input 
            label="Retail Selling Price (ZAR)" 
            type="number" 
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Button fullWidth variant="primary" onClick={handleSaveStock} size="lg">
            Commit to Inventory
          </Button>
        </div>
      </Modal>

      {/* SUPPLIER MODAL */}
      <Modal isOpen={!!selectedSupplier} onClose={() => setSelectedSupplier(null)} title="Supplier Information">
        {selectedSupplier && (
          <div className="space-y-4">
            <div>
              <span className="font-mono text-[10px] text-neutral-400 uppercase">{selectedSupplier.code}</span>
              <h3 className="text-base font-semibold text-neutral-900 mt-0.5">{selectedSupplier.name}</h3>
              <p className="text-xs text-neutral-500">{selectedSupplier.role}</p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Contact Line</span>
                <span className="font-mono text-neutral-900">{selectedSupplier.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Facility</span>
                <span className="text-neutral-900 text-right">{selectedSupplier.address}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button fullWidth variant="secondary" onClick={() => setSelectedSupplier(null)}>
                Dismiss
              </Button>
              <Button 
                fullWidth 
                variant="primary" 
                onClick={() => {
                  window.open(`https://wa.me/?text=Hello%20${encodeURIComponent(selectedSupplier.name)}%2C%20I%20would%20like%20to%20place%20a%20restock%20order`, '_blank');
                  setSelectedSupplier(null);
                }}
              >
                Send Order WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* GROUP BUY MODAL */}
      <Modal isOpen={showGroupBuyModal} onClose={() => setShowGroupBuyModal(false)} title="Join Bulk Buying Pool">
        <div className="space-y-4">
          <p className="text-xs text-neutral-600">
            Pool orders with nearby traders to unlock direct manufacturer tier pricing on 10kg Parboiled Rice.
          </p>
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tier Price</span>
              <span className="font-mono font-bold text-neutral-900">R 95.00 / bag</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Target Delivery</span>
              <span className="text-neutral-900">Central Depot · Friday 10:00</span>
            </div>
          </div>
          <Button fullWidth variant="primary" onClick={() => {
            setToast({ show: true, message: 'Reservation of 5 bags locked in pool', type: 'success' });
            setShowGroupBuyModal(false);
          }}>
            Confirm Reservation (5 Bags)
          </Button>
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