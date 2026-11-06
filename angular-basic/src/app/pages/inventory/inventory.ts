import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Inventory } from '../../models';
import { InventoryService } from '../../services/inventory.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { InventoryEdit } from './inventory-edit/inventory-edit';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, NzTableModule, NzButtonModule, NzIconModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class InventoryComponent implements OnInit {
  private readonly modalService = inject(NzModalService);

  inventoryData: Inventory[] = [];
  categoryNames = new Map<number, string>();
  weightNames = new Map<number, string>();
  isLoading = false;

  constructor(
    private inventoryService: InventoryService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.isLoading = true;
    forkJoin({
      inventory: this.inventoryService.getAll(0, 100),
      categories: this.inventoryService.getCategories(),
      weights: this.inventoryService.getWeights()
    }).subscribe({
      next: ({ inventory, categories, weights }) => {
        this.inventoryData = inventory;
        this.categoryNames = new Map(categories.map((category) => [category.id, category.name]));
        this.weightNames = new Map(weights.map((weight) => [weight.id, weight.name]));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.message.error('Failed to load inventory data');
        this.isLoading = false;
      }
    });
  }

  openEdit(id: number): void {
    const modal = this.modalService.create<InventoryEdit, { itemId: number }, Inventory>({
      nzTitle: 'Edit inventory item',
      nzContent: InventoryEdit,
      nzData: { itemId: id },
      nzFooter: null,
      nzMaskClosable: false
    });

    modal.afterClose.subscribe((updatedItem) => {
      if (updatedItem) {
        this.loadInventory();
      }
    });
  }
}
