import { Inventory } from './inventory.model';

export interface Weight {
  id: number;
  name: string;
  description: string | null;
  inventory_items?: Inventory[];
}
