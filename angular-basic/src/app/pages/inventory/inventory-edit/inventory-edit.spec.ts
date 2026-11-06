import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

import { InventoryEdit } from './inventory-edit';
import { InventoryService } from '../../../services/inventory.service';

describe('InventoryEdit', () => {
  let component: InventoryEdit;
  let fixture: ComponentFixture<InventoryEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryEdit],
      providers: [
        { provide: NZ_MODAL_DATA, useValue: { itemId: 1 } },
        { provide: NzModalRef, useValue: { close: vi.fn() } },
        { provide: NzMessageService, useValue: { error: vi.fn(), success: vi.fn() } },
        {
          provide: InventoryService,
          useValue: {
            getById: () =>
              of({
                id: 1,
                name: 'Rice',
                shortname: null,
                quantity: 2,
                category_id: 1,
                weight_id: 1
              }),
            getCategories: () => of([{ id: 1, name: 'Food', description: null }]),
            getWeights: () => of([{ id: 1, name: 'Kilogram', description: null }]),
            update: vi.fn()
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
