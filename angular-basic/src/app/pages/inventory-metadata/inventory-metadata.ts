import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { InventoryMetadataEdit } from './inventory-metadata-edit/inventory-metadata-edit';
import { InventoryMetadataItem, InventoryMetadataService, InventoryMetadataType } from '../../services/inventory-metadata.service';

@Component({
  selector: 'app-inventory-metadata',
  imports: [CommonModule, NzButtonModule, NzIconModule, NzTableModule],
  templateUrl: './inventory-metadata.html',
  styleUrl: './inventory-metadata.scss'
})
export class InventoryMetadataComponent implements OnInit {
  private readonly modalService = inject(NzModalService);
  private readonly route = inject(ActivatedRoute);
  readonly metadataType = this.route.snapshot.data['metadataType'] as InventoryMetadataType;
  readonly title = this.metadataType === 'categories' ? 'Categories' : 'Weights';

  metadataItems: InventoryMetadataItem[] = [];
  isLoading = false;

  constructor(
    private readonly metadataService: InventoryMetadataService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true;
    this.metadataService.getAll(this.metadataType).subscribe({
      next: (items) => {
        this.metadataItems = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error loading ${this.metadataType}:`, error);
        this.message.error(`Failed to load ${this.title.toLowerCase()}`);
        this.isLoading = false;
      }
    });
  }

  openForm(item?: InventoryMetadataItem): void {
    const modal = this.modalService.create<InventoryMetadataEdit, { metadataType: InventoryMetadataType; itemId?: number }, InventoryMetadataItem>({
      nzTitle: `${item ? 'Edit' : 'Add'} ${this.metadataType === 'categories' ? 'category' : 'weight'}`,
      nzContent: InventoryMetadataEdit,
      nzData: { metadataType: this.metadataType, itemId: item?.id },
      nzFooter: null,
      nzMaskClosable: false
    });

    modal.afterClose.subscribe((savedItem) => {
      if (savedItem) {
        this.loadItems();
      }
    });
  }

  confirmDelete(item: InventoryMetadataItem): void {
    this.modalService.confirm({
      nzTitle: `Delete ${item.name}?`,
      nzContent: 'This cannot be undone.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel'
    }).afterClose.subscribe((confirmed) => {
      if (confirmed === true) {
        this.metadataService.delete(this.metadataType, item.id).subscribe({
          next: () => {
            this.message.success(`${item.name} deleted`);
            this.loadItems();
          },
          error: (error) => {
            console.error(`Error deleting ${this.metadataType.slice(0, -1)}:`, error);
            this.message.error(`Could not delete ${item.name}. It may be used by inventory.`);
          }
        });
      }
    });
  }
}