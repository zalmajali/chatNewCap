import { TestBed } from '@angular/core/testing';

import { Uploade } from './uploade';

describe('Uploade', () => {
  let service: Uploade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Uploade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
