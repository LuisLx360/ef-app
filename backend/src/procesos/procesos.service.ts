import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class ProcesosService {
  constructor(private readonly db: DbService) {}

  async findByCategoria(id_categoria: number) {
    return this.db.getProcesosByCategoria(id_categoria);
  }

  async findOne(id_proceso: number) {
    const proc = await this.db.getProceso(id_proceso);
    if (!proc) {
      throw new NotFoundException(`Proceso ${id_proceso} no encontrado`);
    }
    return proc;
  }
}