import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Category, Inventory, Transaction, Weight } from '../../models';
import { InventoryService } from '../../services/inventory.service';
import { DashboardService } from '../../services/dashboard.service';

type ViewMode = 'monthly' | 'daily';
type TransactionFilter = 'all' | 'expense' | 'earning' | 'capital';

interface TransactionPoint {
  label: string;
  expense: number;
  earning: number;
  capital: number;
  expenseHeight: number;
  earningHeight: number;
  capitalHeight: number;
}

interface InventoryBar {
  id: number;
  name: string;
  quantity: number;
  category: string;
  weight: string;
  width: number;
  color: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');
const localDateValue = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, NzButtonModule, NzIconModule, NzSpinModule],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss'
})
export class Welcome implements OnInit {
  private readonly today = new Date();
  private hasInitializedTransactionPeriod = false;
  readonly viewMode = signal<ViewMode>('monthly');
  readonly selectedMonth = signal(`${this.today.getFullYear()}-${pad(this.today.getMonth() + 1)}`);
  readonly selectedDate = signal(localDateValue(this.today));
  readonly transactionFilter = signal<TransactionFilter>('all');
  readonly transactions = signal<Transaction[] | null>(null);
  readonly transactionLoading = signal(false);
  readonly transactionError = signal('');
  readonly inventory = signal<Inventory[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly weights = signal<Weight[]>([]);
  readonly inventoryLoading = signal(false);
  readonly inventoryError = signal('');
  selectedCategoryId: number | null = null;
  selectedWeightId: number | null = null;

  readonly filteredTransactions = computed(() => {
    const transactions = this.transactions() ?? [];
    const filter = this.transactionFilter();
    const monthly = this.viewMode() === 'monthly';
    const selectedMonth = this.selectedMonth();
    const selectedDate = this.selectedDate();
    return transactions.filter((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return false;
      const inPeriod = monthly
        ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}` === selectedMonth
        : localDateValue(date) === selectedDate;
      return inPeriod && (filter === 'all' || item.transaction_type === filter);
    });
  });

  readonly summary = computed(() => {
    let expense = 0;
    let earning = 0;
    let capital = 0;
    let netEarnings = 0;

    for (const transaction of this.filteredTransactions()) {
      const amount = this.transactionAmount(transaction);
      if (transaction.transaction_type === 'expense') expense += amount;
      if (transaction.transaction_type === 'earning') {
        earning += amount;
        netEarnings += (Number(transaction.amount_per_unit) - Number(transaction.purchase_price || 0))
          * Number(transaction.quantity || 0);
      }
      if (transaction.transaction_type === 'capital') capital += amount;
    }

    return { expense, earning, treasury: capital - expense + earning, netEarnings };
  });

  readonly transactionPoints = computed(() => {
    const monthly = this.viewMode() === 'monthly';
    const period = monthly ? this.selectedMonth() : this.selectedDate();
    const [year, month, day] = period.split('-').map(Number);
    const count = monthly ? new Date(year, month, 0).getDate() : 24;
    const buckets = new Map<number, { expense: number; earning: number; capital: number }>();

    for (const transaction of this.filteredTransactions()) {
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime())) continue;
      const bucket = monthly ? date.getDate() : date.getHours();
      const totals = buckets.get(bucket) ?? { expense: 0, earning: 0, capital: 0 };
      const type = transaction.transaction_type;
      if (type === 'expense' || type === 'earning' || type === 'capital') {
        totals[type] += this.transactionAmount(transaction);
      }
      buckets.set(bucket, totals);
    }

    const points = Array.from({ length: count }, (_, index) => {
      const bucket = index + 1;
      const totals = buckets.get(monthly ? bucket : index) ?? { expense: 0, earning: 0, capital: 0 };
      return {
        label: monthly ? pad(bucket) : pad(index),
        ...totals,
        expenseHeight: 0,
        earningHeight: 0,
        capitalHeight: 0
      };
    });
    const maximum = Math.max(0, ...points.flatMap(({ expense, earning, capital }) => [expense, earning, capital]));

    return points.map((point) => ({
      ...point,
      expenseHeight: maximum ? point.expense / maximum * 100 : 0,
      earningHeight: maximum ? point.earning / maximum * 100 : 0,
      capitalHeight: maximum ? point.capital / maximum * 100 : 0
    }));
  });

  readonly inventoryBars = computed<InventoryBar[]>(() => {
    const categories = this.categories();
    const weights = this.weights();
    const palette = ['#167d68', '#d17a31', '#5577a2', '#9e4861', '#786846'];
    const rows = this.inventory()
      .filter((item) => this.selectedCategoryId === null || item.category_id === this.selectedCategoryId)
      .filter((item) => this.selectedWeightId === null || item.weight_id === this.selectedWeightId)
      .map((item) => {
        const categoryIndex = categories.findIndex((category) => category.id === item.category_id);
        return {
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity) || 0,
          category: categories.find((category) => category.id === item.category_id)?.name ?? 'Unknown category',
          weight: weights.find((weight) => weight.id === item.weight_id)?.name ?? 'Unknown weight',
          width: 0,
          color: palette[(categoryIndex < 0 ? 0 : categoryIndex) % palette.length]
        };
      })
      .sort((left, right) => right.quantity - left.quantity);
    const maximum = Math.max(0, ...rows.map((row) => row.quantity));

    return rows.map((row) => ({ ...row, width: maximum ? row.quantity / maximum * 100 : 0 }));
  });

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadInventory();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  changeMonth(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedMonth.set(value);
  }

  changeDate(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedDate.set(value);
  }

  changeTransactionFilter(event: Event): void {
    this.transactionFilter.set((event.target as HTMLSelectElement).value as TransactionFilter);
  }

  changeCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategoryId = value ? Number(value) : null;
  }

  changeWeight(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedWeightId = value ? Number(value) : null;
  }

  refresh(): void {
    this.loadTransactions();
    this.loadInventory();
  }

  periodLabel(): string {
    if (this.viewMode() === 'monthly') {
      const [year, month] = this.selectedMonth().split('-').map(Number);
      return new Date(year, month - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return new Date(`${this.selectedDate()}T00:00:00`).toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  private loadTransactions(): void {
    this.transactionLoading.set(true);
    this.transactionError.set('');
    this.dashboardService.getTransactions().subscribe({
      next: (transactions) => {
        if (!this.hasInitializedTransactionPeriod) {
          const validDates = transactions
            .map((item) => new Date(item.date))
            .filter((date) => !Number.isNaN(date.getTime()))
            .sort((left, right) => left.getTime() - right.getTime());
          const latest = validDates[validDates.length - 1];

          if (latest) {
            const latestMonth = `${latest.getFullYear()}-${pad(latest.getMonth() + 1)}`;
            const latestDate = localDateValue(latest);
            if (!transactions.some((item) => {
              const date = new Date(item.date);
              return !Number.isNaN(date.getTime())
                && `${date.getFullYear()}-${pad(date.getMonth() + 1)}` === this.selectedMonth();
            })) {
              this.selectedMonth.set(latestMonth);
            }
            if (!transactions.some((item) => localDateValue(new Date(item.date)) === this.selectedDate())) {
              this.selectedDate.set(latestDate);
            }
          }
          this.hasInitializedTransactionPeriod = true;
        }
        this.transactions.set(transactions);
        this.transactionLoading.set(false);
      },
      error: (error) => {
        this.transactionError.set(error.error?.detail ?? error.message ?? 'Could not load transactions.');
        this.transactions.set([]);
        this.transactionLoading.set(false);
      }
    });
  }

  private loadInventory(): void {
    this.inventoryLoading.set(true);
    this.inventoryError.set('');
    forkJoin({
      inventory: this.inventoryService.getAll(0, 100),
      categories: this.inventoryService.getCategories(),
      weights: this.inventoryService.getWeights()
    }).subscribe({
      next: ({ inventory, categories, weights }) => {
        this.inventory.set(inventory);
        this.categories.set(categories);
        this.weights.set(weights);
        this.inventoryLoading.set(false);
      },
      error: (error) => {
        this.inventoryError.set(error.error?.detail ?? error.message ?? 'Could not load inventory.');
        this.inventoryLoading.set(false);
      }
    });
  }

  private transactionAmount(transaction: Transaction): number {
    const total = Number(transaction.total_amount);
    if (Number.isFinite(total) && total !== 0) return total;
    return (Number(transaction.amount_per_unit) || 0) * (Number(transaction.quantity) || 0);
  }
}
