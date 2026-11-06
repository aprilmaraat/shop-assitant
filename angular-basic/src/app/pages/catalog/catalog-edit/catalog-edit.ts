import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CatalogItem, CatalogPayload, CatalogService, CatalogType } from '../../../services/catalog.service';

interface CatalogEditData {
  catalogType: CatalogType;
  itemId?: number;
}

@Component({
  selector: 'app-catalog-edit',
  imports: [NzButtonModule, NzFormModule, NzInputModule, NzSpinModule, ReactiveFormsModule],
  templateUrl: './catalog-edit.html',
  styleUrl: './catalog-edit.scss'
})
export class CatalogEdit implements OnInit {
  readonly data = inject<CatalogEditData>(NZ_MODAL_DATA);
  readonly loading = signal(false);
  readonly saving = signal(false);

  private readonly modalRef = inject(NzModalRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly catalogForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', Validators.required),
    description: this.formBuilder.control<string | null>(null)
  });

  constructor(
    private readonly catalogService: CatalogService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    if (this.data.itemId === undefined) {
      return;
    }

    this.loading.set(true);
    this.catalogService.getById(this.data.catalogType, this.data.itemId).subscribe({
      next: (item) => {
        this.catalogForm.patchValue(item);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(`Error loading ${this.data.catalogType.slice(0, -1)}:`, error);
        this.message.error('Failed to load item details');
        this.loading.set(false);
        this.modalRef.close();
      }
    });
  }

  submitForm(): void {
    if (this.catalogForm.invalid || this.loading()) {
      this.catalogForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.catalogForm.getRawValue();
    const payload: CatalogPayload = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || null
    };
    const request = this.data.itemId === undefined
      ? this.catalogService.create(this.data.catalogType, payload)
      : this.catalogService.update(this.data.catalogType, this.data.itemId, payload);

    request.subscribe({
      next: (item: CatalogItem) => {
        const label = this.data.catalogType === 'categories' ? 'Category' : 'Weight';
        this.message.success(`${label} ${this.data.itemId === undefined ? 'created' : 'updated'}`);
        this.modalRef.close(item);
      },
      error: (error) => {
        console.error(`Error saving ${this.data.catalogType.slice(0, -1)}:`, error);
        this.message.error(`Failed to save ${this.data.catalogType.slice(0, -1)}`);
        this.saving.set(false);
      }
    });
  }

  destroyModal(): void {
    this.modalRef.close();
  }
}