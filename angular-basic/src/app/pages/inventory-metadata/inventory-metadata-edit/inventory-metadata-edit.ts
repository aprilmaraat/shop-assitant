import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { InventoryMetadataItem, InventoryMetadataPayload, InventoryMetadataService, InventoryMetadataType } from '../../../services/inventory-metadata.service';

interface InventoryMetadataEditData {
  metadataType: InventoryMetadataType;
  itemId?: number;
}

@Component({
  selector: 'app-inventory-metadata-edit',
  imports: [NzButtonModule, NzFormModule, NzInputModule, NzSpinModule, ReactiveFormsModule],
  templateUrl: './inventory-metadata-edit.html',
  styleUrl: './inventory-metadata-edit.scss'
})
export class InventoryMetadataEdit implements OnInit {
  readonly data = inject<InventoryMetadataEditData>(NZ_MODAL_DATA);
  readonly loading = signal(false);
  readonly saving = signal(false);

  private readonly modalRef = inject(NzModalRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly metadataForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', Validators.required),
    description: this.formBuilder.control<string | null>(null)
  });

  constructor(
    private readonly metadataService: InventoryMetadataService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    if (this.data.itemId === undefined) {
      return;
    }

    this.loading.set(true);
    this.metadataService.getById(this.data.metadataType, this.data.itemId).subscribe({
      next: (item) => {
        this.metadataForm.patchValue(item);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(`Error loading ${this.data.metadataType.slice(0, -1)}:`, error);
        this.message.error('Failed to load item details');
        this.loading.set(false);
        this.modalRef.close();
      }
    });
  }

  submitForm(): void {
    if (this.metadataForm.invalid || this.loading()) {
      this.metadataForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.metadataForm.getRawValue();
    const payload: InventoryMetadataPayload = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || null
    };
    const request = this.data.itemId === undefined
      ? this.metadataService.create(this.data.metadataType, payload)
      : this.metadataService.update(this.data.metadataType, this.data.itemId, payload);

    request.subscribe({
      next: (item: InventoryMetadataItem) => {
        const label = this.data.metadataType === 'categories' ? 'Category' : 'Weight';
        this.message.success(`${label} ${this.data.itemId === undefined ? 'created' : 'updated'}`);
        this.modalRef.close(item);
      },
      error: (error) => {
        console.error(`Error saving ${this.data.metadataType.slice(0, -1)}:`, error);
        this.message.error(`Failed to save ${this.data.metadataType.slice(0, -1)}`);
        this.saving.set(false);
      }
    });
  }

  destroyModal(): void {
    this.modalRef.close();
  }
}