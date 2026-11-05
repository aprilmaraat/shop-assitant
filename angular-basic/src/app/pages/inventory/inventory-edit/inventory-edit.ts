import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { InventoryService } from '../../../services/inventory.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Category, Inventory, Weight } from '../../../models';

interface InventoryEditData {
  itemId: number;
}

@Component({
  selector: 'app-inventory-edit',
  imports: [
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSpinModule,
    ReactiveFormsModule
  ],
  templateUrl: './inventory-edit.html',
  styleUrl: './inventory-edit.scss',
})
export class InventoryEdit implements OnInit, OnDestroy {
  readonly data = inject<InventoryEditData>(NZ_MODAL_DATA);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly weights = signal<Weight[]>([]);

  private readonly modalRef = inject(NzModalRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  readonly inventoryForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    shortname: this.fb.control<string | null>(null),
    quantity: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    category_id: this.fb.control<number | null>(null, Validators.required),
    weight_id: this.fb.control<number | null>(null, Validators.required)
  });

  constructor(
    private inventoryService: InventoryService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadInventoryItem();
  }

  loadInventoryItem(): void {
    forkJoin({
      item: this.inventoryService.getById(this.data.itemId),
      categories: this.inventoryService.getCategories(),
      weights: this.inventoryService.getWeights()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ item, categories, weights }) => {
          this.categories.set(categories);
          this.weights.set(weights);
          this.inventoryForm.patchValue(item);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading inventory edit data:', error);
          this.message.error('Failed to load inventory data');
          this.loading.set(false);
        }
      });
  }

  submitForm(): void {
    if (this.inventoryForm.invalid) {
      Object.values(this.inventoryForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.saving.set(true);
    const formValue = this.inventoryForm.getRawValue();
    const inventory: Partial<Inventory> = {
      name: formValue.name.trim(),
      shortname: formValue.shortname?.trim() || null,
      quantity: formValue.quantity!,
      category_id: formValue.category_id!,
      weight_id: formValue.weight_id!
    };

    this.inventoryService
      .update(this.data.itemId, inventory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedItem) => {
          this.message.success('Inventory item updated');
          this.modalRef.close(updatedItem);
        },
        error: (error) => {
          console.error('Error updating inventory:', error);
          this.message.error('Failed to update inventory item');
          this.saving.set(false);
        }
      });
  }

  destroyModal(): void {
    this.modalRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
