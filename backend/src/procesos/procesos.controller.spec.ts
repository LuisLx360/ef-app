import { Test, TestingModule } from '@nestjs/testing';
import { ProcesosController } from './procesos.controller';

describe('ProcesosController', () => {
  let controller: ProcesosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcesosController],
    }).compile();

    controller = module.get<ProcesosController>(ProcesosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
