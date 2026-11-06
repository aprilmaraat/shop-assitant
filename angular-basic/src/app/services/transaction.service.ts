import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Transaction, User } from '../models';

export interface TransactionPayload {
  title: string;
  description: string | null;
  owner_id: number;
  transaction_type: Transaction['transaction_type'];
  amount_per_unit: number;
  quantity: number;
  purchase_price: number;
  inventory_id: number | null;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = 'http://localhost:8000';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Transaction[]> {
    const params = new HttpParams().set('skip', '0').set('limit', '1000');
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  getById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`);
  }

  getUsers(): Observable<User[]> {
    const params = new HttpParams().set('skip', '0').set('limit', '500');
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params });
  }

  create(payload: TransactionPayload): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions`, payload);
  }

  update(id: number, payload: TransactionPayload): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, payload);
  }

  delete(id: number): Observable<Transaction> {
    return this.http.delete<Transaction>(`${this.apiUrl}/transactions/${id}`);
  }
}