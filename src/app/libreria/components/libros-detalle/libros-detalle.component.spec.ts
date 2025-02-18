import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibrosDetalleComponent } from './libros-detalle.component';

describe('LibrosDetalleComponent', () => {
  let component: LibrosDetalleComponent;
  let fixture: ComponentFixture<LibrosDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibrosDetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LibrosDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
