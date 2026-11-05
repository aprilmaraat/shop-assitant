import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, Inventory, Weight } from '../models';

export interface InventorySearchParams {
  q?: string;
  category_id?: number;
  weight_id?: number;
  min_quantity?: number;
  max_quantity?: number;
  skip?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'http://localhost:8000/inventory';

  constructor(private http: HttpClient) {}

  getAll(skip: number = 0, limit: number = 100): Observable<Inventory[]> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    return this.http.get<Inventory[]>(this.apiUrl, { params });
  }

  search(searchParams: InventorySearchParams): Observable<Inventory[]> {
    let params = new HttpParams();
    
    if (searchParams.q) params = params.set('q', searchParams.q);
    if (searchParams.category_id) params = params.set('category_id', searchParams.category_id.toString());
    if (searchParams.weight_id) params = params.set('weight_id', searchParams.weight_id.toString());
    if (searchParams.min_quantity !== undefined) params = params.set('min_quantity', searchParams.min_quantity.toString());
    if (searchParams.max_quantity !== undefined) params = params.set('max_quantity', searchParams.max_quantity.toString());
    if (searchParams.skip !== undefined) params = params.set('skip', searchParams.skip.toString());
    if (searchParams.limit !== undefined) params = params.set('limit', searchParams.limit.toString());

    return this.http.get<Inventory[]>(`${this.apiUrl}/search`, { params });
  }

  getById(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('http://localhost:8000/categories');
  }

  getWeights(): Observable<Weight[]> {
    return this.http.get<Weight[]>('http://localhost:8000/weights');
  }

  create(inventory: Partial<Inventory>): Observable<Inventory> {
    return this.http.post<Inventory>(this.apiUrl, inventory);
  }

  update(id: number, inventory: Partial<Inventory>): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiUrl}/${id}`, inventory);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
