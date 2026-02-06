import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  // ✅ EVALUACIÓN - TODOS acceden (SIN RolesGuard)
  @Get('evaluacion')
  async getCategoriasEvaluacion() {
    return this.categoriasService.findAllForEvaluation();
  }

  @Get(':id/procesos/evaluacion')
  async getProcesosEvaluacion(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findProcesosForEvaluation(id);
  }

  // ✅ Endpoints existentes (con guards)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('OPERADOR', 'SUPERVISOR')
  findAll() {
    return this.categoriasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findOne(id);
  }

  @Get(':id/procesos')
  async findProcesos(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findProcesosByCategoria(id);
  }

  // ✅ Preguntas directas (ELÉCTRICO)
  @Get(':id_categoria/preguntas')
  async findPreguntasDirectas(
    @Param('id_categoria', ParseIntPipe) id_categoria: number
  ) {
    return this.categoriasService.findPreguntasByCategoriaDirecta(id_categoria);
  }

  @Get(':idCategoria/procesos/:idProceso/preguntas')
  async findPreguntas(
    @Param('idCategoria', ParseIntPipe) idCategoria: number,
    @Param('idProceso', ParseIntPipe) idProceso: number
  ) {
    return this.categoriasService.findPreguntasByProceso(idCategoria, idProceso);
  }
}