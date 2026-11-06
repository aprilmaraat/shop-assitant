import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, Weight } from '../models';

export type CatalogType = 'categories' | 'weights';
export type CatalogItem = Category | Weight;
export interface CatalogPayload {
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly apiUrl = 'http://localhost:8000';

  constructor(private readonly http: HttpClient) {}

  getAll(type: CatalogType): Observable<CatalogItem[]> {
    const params = new HttpParams().set('skip', '0').set('limit', '500');
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/${type}`, { params });
  }

  getById(type: CatalogType, id: number): Observable<CatalogItem> {
    return this.http.get<CatalogItem>(`${this.apiUrl}/${type}/${id}`);
  }

  create(type: CatalogType, payload: CatalogPayload): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(`${this.apiUrl}/${type}`, payload);
  }

  update(type: CatalogType, id: number, payload: CatalogPayload): Observable<CatalogItem> {
    return this.http.put<CatalogItem>(`${this.apiUrl}/${type}/${id}`, payload);
  }

  delete(type: CatalogType, id: number): Observable<CatalogItem> {
    return this.http.delete<CatalogItem>(`${this.apiUrl}/${type}/${id}`);
  }
}