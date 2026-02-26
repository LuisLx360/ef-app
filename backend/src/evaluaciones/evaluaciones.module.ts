import { Module } from '@nestjs/common';
import { EvaluacionesController } from './evaluaciones.controller';
import { DbService } from '../db/db.service';
import { EvaluacionesExcelService } from './evaluaciones-excel.service';
import { EvaluacionesService } from './evaluaciones.service';

@Module({
  controllers: [EvaluacionesController],
  providers: [DbService, EvaluacionesExcelService, EvaluacionesService ],
})
export class EvaluacionesModule {}