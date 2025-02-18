import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibrosListadoComponent } from './libros-listado.component';

describe('LibrosListadoComponent', () => {
  let component: LibrosListadoComponent;
  let fixture: ComponentFixture<LibrosListadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibrosListadoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LibrosListadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
