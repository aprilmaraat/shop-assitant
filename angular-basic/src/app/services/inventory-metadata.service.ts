import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, Weight } from '../models';

export type InventoryMetadataType = 'categories' | 'weights';
export type InventoryMetadataItem = Category | Weight;
export interface InventoryMetadataPayload {
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryMetadataService {
  private readonly apiUrl = 'http://localhost:8000';

  constructor(private readonly http: HttpClient) {}

  getAll(type: InventoryMetadataType): Observable<InventoryMetadataItem[]> {
    const params = new HttpParams().set('skip', '0').set('limit', '500');
    return this.http.get<InventoryMetadataItem[]>(`${this.apiUrl}/${type}`, { params });
  }

  getById(type: InventoryMetadataType, id: number): Observable<InventoryMetadataItem> {
    return this.http.get<InventoryMetadataItem>(`${this.apiUrl}/${type}/${id}`);
  }

  create(type: InventoryMetadataType, payload: InventoryMetadataPayload): Observable<InventoryMetadataItem> {
    return this.http.post<InventoryMetadataItem>(`${this.apiUrl}/${type}`, payload);
  }

  update(type: InventoryMetadataType, id: number, payload: InventoryMetadataPayload): Observable<InventoryMetadataItem> {
    return this.http.put<InventoryMetadataItem>(`${this.apiUrl}/${type}/${id}`, payload);
  }

  delete(type: InventoryMetadataType, id: number): Observable<InventoryMetadataItem> {
    return this.http.delete<InventoryMetadataItem>(`${this.apiUrl}/${type}/${id}`);
  }
}