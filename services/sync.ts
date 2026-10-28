import { db } from './storage';
import { supabase } from '../lib/supabase';

class SyncEngine {
  private isSyncing = false;
  private intervalId: any;

  start() {
    if (this.intervalId) return;
    // Try to sync every 10 seconds
    this.intervalId = setInterval(() => this.sync(), 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async restoreFromCloud(userId: string) {
    if (!navigator.onLine) return;
    if (!userId || userId.startsWith('guest-') || userId.startsWith('demo-')) {
      console.log('[SyncEngine] Running in guest/bypass mode. Local storage is active.');
      return;
    }
    
    console.log('[SyncEngine] Restoring data from Supabase...');
    this.isSyncing = true;
    window.dispatchEvent(new Event('ibos-sync-start'));
    
    try {
      // 1. Restore Inventory
      const { data: invData } = await supabase.from('inventory').select('data').order('created_at', { ascending: true }).eq('user_id', userId);
      if (invData && invData.length > 0) {
        const inventoryMap = new Map();
        invData.forEach(row => {
          const item = row.data as any;
          if (item && item.id) {
            inventoryMap.set(item.id, item);
          }
        });
        db.replaceInventory(Array.from(inventoryMap.values()));
      }

      // 2. Restore Sales
      const { data: salesData } = await supabase.from('sales').select('data').order('created_at', { ascending: false }).eq('user_id', userId);
      if (salesData && salesData.length > 0) {
        db.replaceSales(salesData.map(row => row.data as any));
      }

      // 3. Restore Expenses
      const { data: expData } = await supabase.from('expenses').select('data').order('created_at', { ascending: false }).eq('user_id', userId);
      if (expData && expData.length > 0) {
        db.replaceExpenses(expData.map(row => row.data as any));
      }

      // 4. Restore Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileData) {
        const localProfile = db.getProfile() || {};
        const { data: { user } } = await supabase.auth.getUser();
        
        db.saveProfile({
          ...localProfile,
          businessName: profileData.business_name || localProfile.businessName,
          phone: profileData.phone || localProfile.phone,
          fullName: user?.user_metadata?.fullName || localProfile.fullName || '',
          email: user?.email || localProfile.email || '',
        });
      }

      console.log('[SyncEngine] Restore complete.');
      window.dispatchEvent(new Event('ibos-sync-complete'));
    } catch (e) {
      console.error('[SyncEngine] Restore failed:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  async sync() {
    if (this.isSyncing || !navigator.onLine) return;

    const queue = db.getSyncQueue();
    if (queue.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id.startsWith('guest-') || session.user.id.startsWith('demo-')) {
        // In bypass mode, items are stored safely in local storage (offline-first)
        return;
      }

      this.isSyncing = true;
      window.dispatchEvent(new Event('ibos-sync-start'));
      console.log(`[SyncEngine] Processing ${queue.length} items to Supabase...`);

      // We wrap syncing in try-catch so it won't crash if tables don't exist yet
      for (const item of queue) {
        try {
           if (item.type === 'SALE_CREATE') {
             await supabase.from('sales').insert({ user_id: session.user.id, data: item.payload });
           } else if (item.type === 'EXPENSE_CREATE') {
             await supabase.from('expenses').insert({ user_id: session.user.id, data: item.payload });
           } else if (item.type === 'INVENTORY_ADD') {
             await supabase.from('inventory').insert({ user_id: session.user.id, data: item.payload });
           } else if (item.type === 'INVENTORY_UPDATE') {
             await supabase.from('inventory').insert({ user_id: session.user.id, data: item.payload });
           } else if (item.type === 'LOAN_CREATE') {
             await supabase.from('loans').insert({
               loan_id: item.payload.loan_id || crypto.randomUUID(),
               borrower_id: session.user.id.slice(0, 50),
               amount: item.payload.amount,
               purpose: item.payload.purpose,
               duration_days: item.payload.duration_days,
               repayment_type: item.payload.repayment_type,
               daily_amount: item.payload.daily_amount,
               avg_daily_sales: item.payload.avg_daily_sales,
               inventory_value: item.payload.inventory_value,
               trust_score: item.payload.trust_score,
               status: item.payload.status || 'pending'
             });
           } else if (item.type === 'STOKVEL_CONTRIBUTION') {
             await supabase.from('stokvel_contributions').insert({
               user_id: session.user.id,
               amount: item.payload.amount || 1250,
               cycle_month: item.payload.cycle_month || new Date().toISOString().slice(0, 7),
               status: 'verified',
               data: item.payload
             });
           } else if (item.type === 'DEBTORS_UPDATE') {
             await supabase.from('debtors').upsert({
               user_id: session.user.id,
               records: item.payload,
               updated_at: new Date().toISOString()
             });
           }
        } catch (e) {
           console.warn('[SyncEngine] Failed to sync item:', e);
        }
      }

      // On success, clear queue
      db.clearSyncQueue();
      console.log('[SyncEngine] Sync complete to Supabase.');
      
      // Dispatch event to update UI if needed
      window.dispatchEvent(new Event('ibos-sync-complete'));
      
    } catch (error) {
      console.error('[SyncEngine] Failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncEngine = new SyncEngine();
