import { InventoryItem, Sale, Expense } from '../types';

// STORAGE KEYS
const KEYS = {
  INVENTORY: 'ibos_inventory',
  SALES: 'ibos_sales',
  EXPENSES: 'ibos_expenses',
  SYNC_QUEUE: 'ibos_sync_queue',
  PROFILE: 'ibos_profile',
};

// INITIAL SEED DATA (If app is fresh)
const SEED_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Bread', price: 18, cost: 12, quantity: 15, category: 'Bakery', icon: '🍞', lowStockThreshold: 5 },
  { id: '2', name: 'Airtime', price: 10, cost: 9.5, quantity: 100, category: 'Services', icon: '📱' },
  { id: '3', name: 'Cold Drink', price: 15, cost: 9, quantity: 24, category: 'Beverages', icon: '🥤', lowStockThreshold: 10 },
  { id: '4', name: 'Kota', price: 35, cost: 20, quantity: 50, category: 'Food', icon: '🥪' },
  { id: '5', name: 'Tomatoes', price: 12, cost: 8, quantity: 30, category: 'Produce', icon: '🍅', lowStockThreshold: 10 },
  { id: '6', name: 'Haircut', price: 50, cost: 0, quantity: 999, category: 'Services', icon: '✂️' },
];

class LocalStorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(KEYS.INVENTORY)) {
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(SEED_INVENTORY));
    }
    if (!localStorage.getItem(KEYS.SALES)) {
      localStorage.setItem(KEYS.SALES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.EXPENSES)) {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.SYNC_QUEUE)) {
      localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
    }
  }

  // --- BULK OPERATIONS FOR SYNC ---
  replaceInventory(items: InventoryItem[]) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
  }
  
  replaceSales(sales: Sale[]) {
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  }

  replaceExpenses(expenses: Expense[]) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  }

  // --- INVENTORY ---
  getInventory(): InventoryItem[] {
    const data = localStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  }

  addInventoryItem(item: InventoryItem) {
    const items = this.getInventory();
    items.push(item);
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
    this.addToSyncQueue({ type: 'INVENTORY_ADD', payload: item });
  }

  updateStock(id: string, delta: number) {
    const items = this.getInventory();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index].quantity += delta;
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
      this.addToSyncQueue({ type: 'INVENTORY_UPDATE', payload: items[index] });
    }
  }

  // --- SALES ---
  getSales(): Sale[] {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  }

  addSale(sale: Sale) {
    const sales = this.getSales();
    sales.unshift(sale); // Add to top
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    
    // Deduct stock
    sale.items.forEach(item => {
      this.updateStock(item.productId, -item.quantity);
    });

    this.addToSyncQueue({ type: 'SALE_CREATE', payload: sale });
  }

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  }

  addExpense(expense: Expense) {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
    this.addToSyncQueue({ type: 'EXPENSE_CREATE', payload: expense });
  }

  // --- SYNC QUEUE ---
  getSyncQueue(): any[] {
    const data = localStorage.getItem(KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  // --- PROFILE ---
  getProfile() {
    const data = localStorage.getItem(KEYS.PROFILE);
    if (!data) {
      const defaultProfile = {
        fullName: 'Mama Dlamini',
        businessName: 'Mama Dlamini Spaza Store',
        phone: '071 234 5678',
        email: 'dlamini.spaza@ibos.africa',
        operatorCode: 'OP-78219',
        createdAt: Date.now()
      };
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    return JSON.parse(data);
  }

  saveProfile(profile: any) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }

  // --- LOANS (OFFLINE / BYPASS SUPPORT) ---
  getLoans(): any[] {
    const data = localStorage.getItem('ibos_loans');
    return data ? JSON.parse(data) : [];
  }

  addLoan(loan: any) {
    const loans = this.getLoans();
    loans.unshift(loan);
    localStorage.setItem('ibos_loans', JSON.stringify(loans));
    this.addToSyncQueue({ type: 'LOAN_CREATE', payload: loan });
    window.dispatchEvent(new Event('ibos-data-change'));
  }

  // --- STOKVEL CONTRIBUTIONS ---
  getStokvelContributions(): any[] {
    const data = localStorage.getItem('ibos_stokvel_contributions');
    return data ? JSON.parse(data) : [];
  }

  addStokvelContribution(contrib: any) {
    const list = this.getStokvelContributions();
    list.unshift(contrib);
    localStorage.setItem('ibos_stokvel_contributions', JSON.stringify(list));
    this.addToSyncQueue({ type: 'STOKVEL_CONTRIBUTION', payload: contrib });
    window.dispatchEvent(new Event('ibos-data-change'));
  }

  // --- DEBTORS BOOK ---
  getDebtors(): Array<{ id: number; name: string; amount: number }> {
    const data = localStorage.getItem('ibos_debtors');
    if (!data) {
      const initial = [
        { id: 1, name: 'Sipho', amount: 50 },
        { id: 2, name: 'Mama Joy', amount: 120 }
      ];
      localStorage.setItem('ibos_debtors', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  saveDebtors(debtors: Array<{ id: number; name: string; amount: number }>) {
    localStorage.setItem('ibos_debtors', JSON.stringify(debtors));
    this.addToSyncQueue({ type: 'DEBTORS_UPDATE', payload: debtors });
    window.dispatchEvent(new Event('ibos-data-change'));
  }

  addToSyncQueue(action: any) {
    const queue = this.getSyncQueue();
    queue.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  clearSyncQueue() {
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
  }

  // --- ANALYTICS ---
  getFinancialSummary() {
    const sales = this.getSales();
    const expenses = this.getExpenses();
    
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = totalRevenue - totalExpenses;

    return { totalRevenue, totalExpenses, profit };
  }
}

export const db = new LocalStorageService();
