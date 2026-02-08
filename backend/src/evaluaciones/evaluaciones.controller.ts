import { 
  Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe,
  UseGuards, NotFoundException, HttpStatus, HttpCode, Req, Res
} from '@nestjs/common';
import type { Response } from 'express';
import { DbService } from '../db/db.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { EvaluacionesExcelService } from './evaluaciones-excel.service';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { UpdateRespuestasDto } from './dto/update-respuestas.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('evaluaciones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EvaluacionesController {
  constructor(
    private readonly dbService: DbService,
    private readonly excelService: EvaluacionesExcelService
  ) {}

  // ✅ SUPERVISOR SOLO - Mantiene RolesGuard
  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPERVISOR', 'EVALUADOR')
  @ApiBearerAuth('JWT-auth')
  async getAllEvaluaciones() {
    return await this.dbService.getAllEvaluaciones();
  }

  // ✅ SUPERVISOR SOLO - Mantiene RolesGuard  
  @Get('exportar/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPERVISOR', 'EVALUADOR')
  @ApiBearerAuth('JWT-auth')
  async exportarEvaluacion(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.excelService.exportarEvaluacion(id);
    res.status(HttpStatus.OK)
      .set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })
      .send(buffer);
  }

  // ✅ ✅ USUARIO NORMAL - QUITAR RolesGuard
  @Get('empleado/:idEmpleado')
  @ApiBearerAuth('JWT-auth')
  async getEvaluacionesByEmpleado(@Param('idEmpleado') idEmpleado: string) {
    return await this.dbService.getEvaluacionesByEmpleado(idEmpleado);
  }

  // ✅ ✅ USUARIO NORMAL - QUITAR RolesGuard
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  async createEvaluacion(@Body() data: any) {
    return await this.dbService.createEvaluacionWithRespuestas(data);
  }

  // ✅ ✅ USUARIO NORMAL - QUITAR RolesGuard (para ver sus evaluaciones)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  async getEvaluacionCompleta(@Param('id', ParseIntPipe) id: number) {
    const evaluacion = await this.dbService.getEvaluacionCompleta(id);
    if (!evaluacion) throw new NotFoundException('Evaluación no encontrada');
    return evaluacion;
  }

  // ✅ SUPERVISOR SOLO - Mantiene RolesGuard
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERVISOR', 'EVALUADOR')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  async updateEstado(@Param('id', ParseIntPipe) id: number, @Body() updateEstadoDto: UpdateEstadoDto, @Req() req) {
    const usuarioActual = req.user;
    const evaluadorNombre = `${usuarioActual.nombre || usuarioActual.empleado} (${usuarioActual.nivel_acceso})`;
    const updated = await this.dbService.updateEvaluacionEstadoConEvaluador(
      id, updateEstadoDto.estado, evaluadorNombre
    );
    if (!updated) throw new NotFoundException('Evaluación no encontrada');
    return updated;
  }

  // ✅ SUPERVISOR SOLO - Mantiene RolesGuard
  @Patch(':id/respuestas')
  @UseGuards(RolesGuard)
  @Roles('SUPERVISOR', 'EVALUADOR')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  async updateRespuestas(@Param('id', ParseIntPipe) id: number, @Body() updateRespuestasDto: UpdateRespuestasDto, @Req() req) {
    const usuarioActual = req.user;
    const evaluadorNombre = `${usuarioActual.nombre || usuarioActual.empleado} (${usuarioActual.nivel_acceso})`;
    const result = await this.dbService.guardarCambiosEvaluador(id, updateRespuestasDto.respuestas, evaluadorNombre);
    return { message: 'Respuestas actualizadas correctamente', ...result };
  }

  // ✅ SUPERVISOR SOLO - Mantiene RolesGuard
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERVISOR', 'EVALUADOR')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  async deleteEvaluacion(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.dbService.deleteEvaluacionCompleta(id);
    if (!deleted) throw new NotFoundException('Evaluación no encontrada');
    return { message: 'Evaluación eliminada correctamente' };
  }
}
