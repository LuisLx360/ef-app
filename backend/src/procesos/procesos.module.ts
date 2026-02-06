import { Module } from '@nestjs/common';
import { ProcesosService } from './procesos.service';
import { ProcesosController } from './procesos.controller';

@Module({
  providers: [ProcesosService],
  controllers: [ProcesosController]
})
export class ProcesosModule {}
