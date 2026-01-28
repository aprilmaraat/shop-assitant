import { Category } from './category.model';
import { Weight } from './weight.model';
import { Transaction } from './transaction.model';

export interface Inventory {
  id: number;
  name: string;
  shortname: string | null;
  quantity: number; // Decimal in Python, represented as number in TypeScript
  category_id: number;
  weight_id: number;
  category?: Category;
  weight?: Weight;
  transactions?: Transaction[];
}
