import { Transaction } from './transaction.model';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  transactions?: Transaction[];
}
