import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Inventory } from '../../models';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, NzTableModule, NzButtonModule, NzIconModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class InventoryComponent implements OnInit {
  inventoryData: Inventory[] = [];
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
    this.inventoryService.getAll(0, 100).subscribe({
      next: (data) => {
        this.inventoryData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.message.error('Failed to load inventory data');
        this.isLoading = false;
      }
    });
  }
}
