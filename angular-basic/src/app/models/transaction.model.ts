import { User } from './user.model';
import { Inventory } from './inventory.model';

export enum TransactionType {
  EXPENSE = 'expense',
  EARNING = 'earning',
  CAPITAL = 'capital'
}

export interface Transaction {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  transaction_type: TransactionType;
  amount_per_unit: number; // Decimal in Python, represented as number in TypeScript
  quantity: number; // Decimal in Python, represented as number in TypeScript
  purchase_price: number; // Decimal in Python, represented as number in TypeScript
  inventory_id: number | null;
  date: string; // DateTime in Python, represented as ISO string in TypeScript
  owner?: User;
  inventory?: Inventory;
  total_amount?: number; // Computed property
}
