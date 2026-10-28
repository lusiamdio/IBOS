import React from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  groundingMetadata?: {
    search?: { url: string; title: string }[];
    maps?: { url: string; title: string }[];
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  category: string;
  icon?: string;
  lowStockThreshold?: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  currency: string;
  method: string;
  timestamp: number;
  synced: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note?: string;
  timestamp: number;
  synced: boolean;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  SALES = 'sales',
  TRADE = 'trade',
  FINANCE = 'finance',
  COMPLIANCE = 'compliance',
  ASSISTANT = 'assistant',
  TOOLS = 'tools',
  DESIGN_DOC = 'design_doc', 
  PROFILE = 'profile',
  CAPITAL = 'capital',
  HELP = 'help',
}

export interface ToolConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  route: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}