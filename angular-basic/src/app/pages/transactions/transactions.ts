import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { Category, Inventory, Transaction, TransactionType, User, Weight } from '../../models';
import { InventoryService } from '../../services/inventory.service';
import { TransactionService } from '../../services/transaction.service';
import { TransactionEdit } from './transaction-edit/transaction-edit';

interface TransactionEditData {
  transactionId?: number;
}

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, NzButtonModule, NzIconModule, NzInputModule, NzTableModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss'
})
export class TransactionsComponent implements OnInit {
  private readonly modalService = inject(NzModalService);

  readonly transactions = signal<Transaction[]>([]);
  readonly users = signal<User[]>([]);
  readonly inventory = signal<Inventory[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly weights = signal<Weight[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');
  readonly searchText = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly categoryId = signal<number | null>(null);
  readonly weightId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  readonly filteredTransactions = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    const categoryId = this.categoryId();
    const weightId = this.weightId();
    const inventoryById = new Map(this.inventory().map((item) => [item.id, item]));
    const categoryById = new Map(this.categories().map((category) => [category.id, category.name]));
    const weightById = new Map(this.weights().map((weight) => [weight.id, weight.name]));
    const userById = new Map(this.users().map((user) => [user.id, user]));

    return this.transactions()
      .filter((transaction) => {
        const linkedInventory = transaction.inventory_id === null
          ? undefined
          : inventoryById.get(transaction.inventory_id);
        if (categoryId !== null && linkedInventory?.category_id !== categoryId) return false;
        if (weightId !== null && linkedInventory?.weight_id !== weightId) return false;

        const date = this.localDate(transaction.date);
        if (from && date < from) return false;
        if (to && date > to) return false;

        if (!query) return true;
        const owner = userById.get(transaction.owner_id);
        const searchable = [
          transaction.title,
          transaction.description,
          transaction.transaction_type,
          linkedInventory?.name,
          linkedInventory ? categoryById.get(linkedInventory.category_id) : '',
          linkedInventory ? weightById.get(linkedInventory.weight_id) : '',
          owner?.full_name,
          owner?.email
        ].join(' ').toLowerCase();
        return searchable.includes(query);
      })
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  });

  constructor(
    private readonly transactionService: TransactionService,
    private readonly inventoryService: InventoryService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    forkJoin({
      transactions: this.transactionService.getAll(),
      users: this.transactionService.getUsers(),
      inventory: this.inventoryService.getAll(0, 1000),
      categories: this.inventoryService.getCategories(),
      weights: this.inventoryService.getWeights()
    }).subscribe({
      next: ({ transactions, users, inventory, categories, weights }) => {
        this.transactions.set(transactions);
        this.users.set(users);
        this.inventory.set(inventory);
        this.categories.set(categories);
        this.weights.set(weights);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loadError.set(error.error?.detail ?? error.message ?? 'Could not load transaction data.');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  onDateFrom(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
  }

  onDateTo(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.categoryId.set(value ? Number(value) : null);
  }

  onWeightChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.weightId.set(value ? Number(value) : null);
  }

  clearFilters(): void {
    this.searchText.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.categoryId.set(null);
    this.weightId.set(null);
  }

  openForm(transaction?: Transaction): void {
    const modal = this.modalService.create<TransactionEdit, TransactionEditData, Transaction>({
      nzTitle: transaction ? 'Edit transaction' : 'New transaction',
      nzContent: TransactionEdit,
      nzData: { transactionId: transaction?.id },
      nzWidth: 680,
      nzFooter: null,
      nzMaskClosable: false
    });

    modal.afterClose.subscribe((savedTransaction) => {
      if (!savedTransaction) return;
      this.transactions.update((items) => {
        const exists = items.some((item) => item.id === savedTransaction.id);
        const updated = exists
          ? items.map((item) => item.id === savedTransaction.id ? savedTransaction : item)
          : [savedTransaction, ...items];
        return updated.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
      });
    });
  }

  confirmDelete(transaction: Transaction): void {
    this.modalService.confirm({
      nzTitle: `Delete "${transaction.title}"?`,
      nzContent: 'This transaction will be permanently deleted.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.deletingId.set(transaction.id);
        return firstValueFrom(this.transactionService.delete(transaction.id))
          .then(() => {
          this.transactions.update((items) => items.filter((item) => item.id !== transaction.id));
          this.message.success('Transaction deleted');
          })
          .catch((error) => {
          this.message.error(error.error?.detail ?? 'Failed to delete transaction');
            return false;
          })
          .finally(() => this.deletingId.set(null));
      }
    });
  }

  userName(ownerId: number): string {
    const user = this.users().find((item) => item.id === ownerId);
    return user?.full_name || user?.email || 'Unknown';
  }

  inventoryItem(inventoryId: number | null): Inventory | undefined {
    return inventoryId === null ? undefined : this.inventory().find((item) => item.id === inventoryId);
  }

  categoryName(transaction: Transaction): string {
    const item = this.inventoryItem(transaction.inventory_id);
    return item ? this.categories().find((category) => category.id === item.category_id)?.name ?? '-' : '-';
  }

  weightName(transaction: Transaction): string {
    const item = this.inventoryItem(transaction.inventory_id);
    return item ? this.weights().find((weight) => weight.id === item.weight_id)?.name ?? '-' : '-';
  }

  totalAmount(transaction: Transaction): number {
    const total = Number(transaction.total_amount);
    return Number.isFinite(total)
      ? total
      : Number(transaction.amount_per_unit) * Number(transaction.quantity);
  }

  displayDate(value: string): Date | null {
    return this.parseDate(value);
  }

  typeLabel(type: TransactionType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private localDate(value: string): string {
    const date = this.parseDate(value);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value: string): Date | null {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const date = new Date(hasTimezone ? value : `${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}