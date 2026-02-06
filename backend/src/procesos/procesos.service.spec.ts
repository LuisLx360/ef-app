import { Test, TestingModule } from '@nestjs/testing';
import { ProcesosService } from './procesos.service';

describe('ProcesosService', () => {
  let service: ProcesosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcesosService],
    }).compile();

    service = module.get<ProcesosService>(ProcesosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
