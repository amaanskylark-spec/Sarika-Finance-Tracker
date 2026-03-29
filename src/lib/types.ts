export interface User {
  id: string;
  username: string;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  initialBalance: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  addedBy: string;
  deleted: boolean;
  deletedAt?: number;
  deletedBy?: string;
}

export interface Transaction {
  id: string;
  personId: string;
  srNo: number;
  amount: number;
  type: 'income' | 'expense';
  date: number;
  description: string;
  category?: string;
  createdAt: number;
  addedBy: string;
  deleted: boolean;
  deletedAt?: number;
  deletedBy?: string;
}

export type SortKey = 'name' | 'balance' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';
