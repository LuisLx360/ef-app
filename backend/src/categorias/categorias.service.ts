import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class CategoriasService {
  constructor(private db: DbService) {}

  async findAll() {
    return this.db.getCategorias();
  }

  async findOne(id: number) {
    const result = await this.db.getCategoria(id);
    return result || null;
  }

  async findProcesosByCategoria(id: number) {
    return this.db.getProcesosByCategoria(id);
  }

  // ✅ NUEVO: Para EVALUACIÓN - Usa los mismos métodos existentes
  async findAllForEvaluation() {
    // ✅ MISMO método que findAll() - TODAS las categorías
    return this.db.getCategorias();
  }

  async findProcesosForEvaluation(id_categoria: number) {
    // ✅ MISMO método que findProcesosByCategoria() - TODOS los procesos
    return this.db.getProcesosByCategoria(id_categoria);
  }

  // ✅ Preguntas directas por categoría (ELÉCTRICO)
  async findPreguntasByCategoriaDirecta(id_categoria: number) {
    return this.db.getPreguntasByCategoriaDirecta(id_categoria);
  }

  async findPreguntasByProceso(idCategoria: number, idProceso: number) {
    return this.db.getPreguntasByProceso(idProceso);
  }
}

