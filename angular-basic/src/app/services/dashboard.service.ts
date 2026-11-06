import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Transaction } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = 'http://localhost:8000/transactions';

  constructor(private readonly http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    const params = new HttpParams().set('skip', '0').set('limit', '1000');
    return this.http.get<Transaction[]>(this.apiUrl, { params });
  }
}