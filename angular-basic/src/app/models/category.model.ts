import { Inventory } from './inventory.model';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  inventory_items?: Inventory[];
}
