import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CatalogEdit } from './catalog-edit/catalog-edit';
import { CatalogItem, CatalogService, CatalogType } from '../../services/catalog.service';

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, NzButtonModule, NzIconModule, NzTableModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private readonly modalService = inject(NzModalService);
  private readonly route = inject(ActivatedRoute);
  readonly catalogType = this.route.snapshot.data['catalogType'] as CatalogType;
  readonly title = this.catalogType === 'categories' ? 'Categories' : 'Weights';

  catalogData: CatalogItem[] = [];
  isLoading = false;

  constructor(
    private readonly catalogService: CatalogService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true;
    this.catalogService.getAll(this.catalogType).subscribe({
      next: (items) => {
        this.catalogData = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error loading ${this.catalogType}:`, error);
        this.message.error(`Failed to load ${this.title.toLowerCase()}`);
        this.isLoading = false;
      }
    });
  }

  openForm(item?: CatalogItem): void {
    const modal = this.modalService.create<CatalogEdit, { catalogType: CatalogType; itemId?: number }, CatalogItem>({
      nzTitle: `${item ? 'Edit' : 'Add'} ${this.catalogType === 'categories' ? 'category' : 'weight'}`,
      nzContent: CatalogEdit,
      nzData: { catalogType: this.catalogType, itemId: item?.id },
      nzFooter: null,
      nzMaskClosable: false
    });

    modal.afterClose.subscribe((savedItem) => {
      if (savedItem) {
        this.loadItems();
      }
    });
  }

  confirmDelete(item: CatalogItem): void {
    this.modalService.confirm({
      nzTitle: `Delete ${item.name}?`,
      nzContent: 'This cannot be undone.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel'
    }).afterClose.subscribe((confirmed) => {
      if (confirmed === true) {
        this.catalogService.delete(this.catalogType, item.id).subscribe({
          next: () => {
            this.message.success(`${item.name} deleted`);
            this.loadItems();
          },
          error: (error) => {
            console.error(`Error deleting ${this.catalogType.slice(0, -1)}:`, error);
            this.message.error(`Could not delete ${item.name}. It may be used by inventory.`);
          }
        });
      }
    });
  }
}