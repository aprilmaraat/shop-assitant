import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Inventory, Transaction, TransactionType, User } from '../../../models';
import { InventoryService } from '../../../services/inventory.service';
import { TransactionPayload, TransactionService } from '../../../services/transaction.service';

interface TransactionEditData {
  transactionId?: number;
}

const localDateTimeValue = (value: string): string => {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

@Component({
  selector: 'app-transaction-edit',
  imports: [
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSpinModule,
    ReactiveFormsModule
  ],
  templateUrl: './transaction-edit.html',
  styleUrl: './transaction-edit.scss'
})
export class TransactionEdit implements OnInit {
  readonly data = inject<TransactionEditData>(NZ_MODAL_DATA);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly users = signal<User[]>([]);
  readonly inventory = signal<Inventory[]>([]);

  private readonly modalRef = inject(NzModalRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly transactionForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control('', Validators.required),
    description: this.formBuilder.control<string | null>(null),
    owner_id: this.formBuilder.control<number | null>(null, Validators.required),
    transaction_type: this.formBuilder.nonNullable.control<TransactionType>(TransactionType.EARNING, Validators.required),
    amount_per_unit: this.formBuilder.control<number | null>(0, [Validators.required, Validators.min(0)]),
    purchase_price: this.formBuilder.control<number | null>(0, [Validators.required, Validators.min(0)]),
    quantity: this.formBuilder.control<number | null>(1, [Validators.required, Validators.min(0)]),
    inventory_id: this.formBuilder.control<number | null>(null),
    date: this.formBuilder.nonNullable.control(localDateTimeValue(new Date().toISOString()), Validators.required)
  });

  constructor(
    private readonly transactionService: TransactionService,
    private readonly inventoryService: InventoryService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    forkJoin({
      users: this.transactionService.getUsers(),
      inventory: this.inventoryService.getAll(0, 1000),
      transaction: this.data.transactionId === undefined
        ? of(null)
        : this.transactionService.getById(this.data.transactionId)
    }).subscribe({
      next: ({ users, inventory, transaction }) => {
        this.users.set(users.filter((user) => user.is_active));
        this.inventory.set(inventory);
        if (transaction) {
          this.patchForm(transaction);
        } else {
          const defaultOwner = users.find((user) => user.is_active) ?? users[0];
          if (defaultOwner) this.transactionForm.controls.owner_id.setValue(defaultOwner.id);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.message.error(error.error?.detail ?? 'Failed to load transaction form data');
        this.loading.set(false);
      }
    });
  }

  submitForm(): void {
    if (this.transactionForm.invalid || this.loading()) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const value = this.transactionForm.getRawValue();
    const payload: TransactionPayload = {
      title: value.title.trim(),
      description: value.description?.trim() || null,
      owner_id: value.owner_id!,
      transaction_type: value.transaction_type,
      amount_per_unit: value.amount_per_unit!,
      purchase_price: value.purchase_price!,
      quantity: value.quantity!,
      inventory_id: value.inventory_id,
      date: new Date(value.date).toISOString()
    };

    this.saving.set(true);
    const request = this.data.transactionId === undefined
      ? this.transactionService.create(payload)
      : this.transactionService.update(this.data.transactionId, payload);

    request.subscribe({
      next: (transaction) => {
        this.message.success(`Transaction ${this.data.transactionId === undefined ? 'created' : 'updated'}`);
        this.modalRef.close(transaction);
      },
      error: (error) => {
        this.message.error(error.error?.detail ?? 'Failed to save transaction');
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    this.modalRef.close();
  }

  private patchForm(transaction: Transaction): void {
    this.transactionForm.patchValue({
      title: transaction.title,
      description: transaction.description,
      owner_id: transaction.owner_id,
      transaction_type: transaction.transaction_type,
      amount_per_unit: Number(transaction.amount_per_unit),
      purchase_price: Number(transaction.purchase_price),
      quantity: Number(transaction.quantity),
      inventory_id: transaction.inventory_id,
      date: localDateTimeValue(transaction.date)
    });
  }
}