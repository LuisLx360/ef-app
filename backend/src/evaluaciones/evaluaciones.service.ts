import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateEvaluacionDto } from './dto/create-evaluacion.dto';

@Injectable()
export class EvaluacionesService {
  constructor(private db: DbService) {}

  // Crear evaluación
  async create(dto: CreateEvaluacionDto) {
    return this.db.createEvaluacionWithRespuestas(dto);
  }

  // Historial de un empleado
  async getEvaluacionesByEmpleado(idEmpleado: string) {
    return this.db.getEvaluacionesByEmpleado(idEmpleado);
  }

  // Lista todas las evaluaciones
  async getAllEvaluaciones() {
    return this.db.getAllEvaluaciones();
  }

  // Detalle de evaluación
  async getEvaluacionById(id: number) {
    return this.db.getEvaluacionCompleta(id);
  }

  // ✅ NUEVO: Cambiar estado CON evaluador del supervisor
  async actualizarEstadoConEvaluador(
    idEvaluacion: number, 
    estado: string, 
    evaluador: string
  ) {
    return this.db.updateEvaluacionEstadoConEvaluador(idEvaluacion, estado, evaluador);
  }
}

