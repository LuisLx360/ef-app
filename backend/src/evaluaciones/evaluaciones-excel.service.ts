import { Injectable, NotFoundException } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import { DbService } from '../db/db.service';
import type { BorderStyle } from 'exceljs';

export interface EvaluacionExcelData {
  idEvaluacion: number;
  nombreEmpleado: string;
  nombreEvaluador: string;
  categoria: string;
  proceso?: string;
  fechaEvaluacion: string;
  porcentaje_original: string;
  porcentaje_actual: string;
  total_aplicables: number;
  total_no_aplica: number;
  area: string;
  respuestas: Array<{
    idPregunta: number;
    titulo: string;
    respuesta: boolean;
    no_aplica: boolean;
    peso: number;
    comentarios?: string;
  }>;
}

@Injectable()
export class EvaluacionesExcelService {
  constructor(private readonly dbService: DbService) {}

  /**
   * EXPORTACIÓN INDIVIDUAL (Formato detallado con celdas combinadas)
   */
  async exportarEvaluacion(idEvaluacion: number): Promise<{ buffer: Buffer; filename: string }> {
    const evaluacionRaw = await this.dbService.getEvaluacionCompleta(idEvaluacion);
    if (!evaluacionRaw) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    const empleado = await this.dbService.getEmpleadoById(evaluacionRaw.idEmpleado!);
    const nombreEmpleado = empleado?.empleado?.replace(/[^a-zA-Z0-9\s]/g, '_') || 'Sin_Empleado';
    const fecha = evaluacionRaw.fechaEvaluacion
      ? new Date(evaluacionRaw.fechaEvaluacion).toISOString().split('T')[0]
      : '1900-01-01';

    const respuestasConNoAplica = evaluacionRaw.respuestas.map(r => ({
      ...r,
      no_aplica: r.no_aplica ?? false
    }));
    
    const total_aplicables = respuestasConNoAplica.filter(r => !r.no_aplica).length;
    const total_no_aplica = respuestasConNoAplica.filter(r => r.no_aplica).length;

    const data: EvaluacionExcelData = {
      idEvaluacion: evaluacionRaw.idEvaluacion,
      nombreEmpleado,
      nombreEvaluador: evaluacionRaw.evaluador ?? 'Sin evaluador',
      categoria: evaluacionRaw.categoria ?? 'Sin categoría',
      proceso: evaluacionRaw.proceso ?? undefined,
      fechaEvaluacion: fecha,
      porcentaje_original: `${evaluacionRaw.porcentaje_original}%`,
      porcentaje_actual: `${evaluacionRaw.porcentaje_actual}%`,
      total_aplicables,
      total_no_aplica,
      area: evaluacionRaw.area || 'packaging',
      respuestas: evaluacionRaw.respuestas.map((r) => ({
        idPregunta: r.idPregunta,
        titulo: r.titulo,
        respuesta: r.respuesta,
        no_aplica: Boolean(r.no_aplica),
        peso: r.peso ?? 1,
        comentarios: r.comentarios ?? undefined,
      })),
    };

    const buffer = await this.generarExcel(data);
    const filename = `Evaluacion_${nombreEmpleado}_${data.categoria.replace(/[^a-zA-Z0-9]/g, '_')}_${fecha}.xlsx`;
    return { buffer, filename };
  }

  /**
   * EXPORTACIÓN RESUMEN GENERAL (Formato tabla plana solicitado)
   */
  async exportarResumenEvaluaciones(): Promise<{ buffer: Buffer; filename: string }> {
  // 1. Obtener datos desde DbService
  const evaluacionesRaw = await this.dbService.getEvaluacionesResumenParaExcel();

  // 2. Mapear datos al formato de tabla (AGREGAR ID y equipo)
  const data = evaluacionesRaw.map((ev: any) => ({
    id_empleado: ev.id_empleado || '',           // 👈 NUEVO
    equipo_autonomo: ev.equipo_autonomo || '',   // 👈 NUEVO
    operador: ev.operador || 'Sin Operador',
    autoevaluacion: Number(ev.autoevaluacion_pct || 0) / 100,
    estado: ev.estado?.toUpperCase() || 'PENDIENTE',
    evaluador: ev.nombre_evaluador,
    nota_evaluador: Number(ev.supervisor_pct || 0) / 100,
    area: ev.area || 'General',
    categoria: ev.categoria || '',
    proceso: ev.proceso || '',
    fecha: ev.fecha_evaluacion
      ? new Date(ev.fecha_evaluacion).toLocaleDateString('es-PE', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })
      : ''
  }));

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Resumen Evaluaciones');
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // 3. NUEVAS COLUMNAS (ID y Equipo DESPUÉS de Operador)
  sheet.columns = [
    { header: 'ID Empleado', key: 'id_empleado', width: 12 },
    { header: 'Operador', key: 'operador', width: 35 },
    { header: 'Equipo Autónomo', key: 'equipo_autonomo', width: 20 }, // 👈 NUEVO
    { header: 'Autoevaluación %', key: 'autoevaluacion', width: 18, style: { numFmt: '0.00%' } },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Evaluador', key: 'evaluador', width: 35 }, 
    { header: 'Nota Evaluador %', key: 'nota_evaluador', width: 18, style: { numFmt: '0.00%' } },
    { header: 'Área', key: 'area', width: 15 },
    { header: 'Categoría', key: 'categoria', width: 30 },
    { header: 'Proceso', key: 'proceso', width: 35 },
    { header: 'Fecha', key: 'fecha', width: 20 },
  ];

  sheet.addRows(data);

  // 4. Estilos de encabezado (sin cambios)
  const header = sheet.getRow(1);
  header.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = this.bordesCompletos();
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return { 
    buffer: Buffer.from(buffer), 
    filename: `Resumen_Evaluaciones_${new Date().toISOString().slice(0, 10)}.xlsx` 
  };
}


  // --- MÉTODOS PRIVADOS PARA EXPORTACIÓN INDIVIDUAL ---

  private async generarExcel(data: EvaluacionExcelData): Promise<Buffer> {
    const workbook = new Workbook();
    const nombreHoja = this.obtenerHojaPorCategoria(data.categoria, data.area);
    const worksheet = workbook.addWorksheet(nombreHoja);

    this.configurarHojaBase(worksheet, data);
    this.llenarDatosEvaluacion(worksheet, data);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private obtenerHojaPorCategoria(categoria: string, area: string): string {
    const tipoArea = area.toLowerCase() === 'electrico' ? 'Electrica' : 'Packaging';
    if (categoria.includes('L6')) return `L6 ${tipoArea}`;
    if (categoria.includes('L7')) return `L7 ${tipoArea}`;
    if (categoria.includes('L8')) return `L8 ${tipoArea}`;
    return `Evaluacion ${tipoArea}`;
  }

  private configurarHojaBase(worksheet: Worksheet, data: EvaluacionExcelData) {
    worksheet.views = [{ state: 'frozen', ySplit: 6 }];
    worksheet.columns = [
      { width: 2.5 }, { width: 26 }, { width: 85 }, { width: 12 },
      { width: 10 }, { width: 10 }, { width: 12 }, { width: 30 },
    ];
    this.crearHeaderSuperior(worksheet, data);
  }

  private crearHeaderSuperior(worksheet: Worksheet, data: EvaluacionExcelData) {
    worksheet.mergeCells('B1:H1');
    const row1 = worksheet.getRow(1);
    row1.getCell('B').value = data.categoria;
    row1.getCell('B').font = { bold: true, size: 16 };
    row1.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' };

    const row2 = worksheet.getRow(2);
    row2.getCell('B').value = data.proceso ? `Proceso: ${data.proceso}` : '';
    row2.getCell('D').value = `Evaluado: ${data.nombreEmpleado}`;
    row2.getCell('F').value = `Total aplicables: ${data.total_aplicables} | No aplica: ${data.total_no_aplica}`;

    const row3 = worksheet.getRow(3);
    row3.getCell('B').value = `Evaluador: ${data.nombreEvaluador}`;
    row3.getCell('D').value = `Fecha: ${data.fechaEvaluacion}`;
    row3.getCell('F').value = `Autoevaluación: ${data.porcentaje_original}`;

    const row4 = worksheet.getRow(4);
    row4.getCell('F').value = `Resultado final: ${data.porcentaje_actual}`;

    const headerRow = worksheet.getRow(6);
    headerRow.values = [null, 'TEMA', 'PREGUNTA', 'APLICA', 'PESO', 'RESULTADO', '%', 'OBSERVACIONES'];

    headerRow.eachCell({ includeEmpty: true }, (cell, i) => {
      if (i >= 2) {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = this.bordesCompletos();
      }
    });
  }

  private llenarDatosEvaluacion(worksheet: Worksheet, data: EvaluacionExcelData) {
    let fila = 7;
    for (const r of data.respuestas) {
      const row = worksheet.getRow(fila);
      const valor = r.respuesta && !r.no_aplica ? 1 : 0;
      const aplicaTexto = r.no_aplica ? 'No' : 'Sí';

      row.getCell('B').value = data.proceso || data.categoria;
      row.getCell('C').value = r.titulo;
      row.getCell('D').value = aplicaTexto;
      row.getCell('E').value = r.peso;
      row.getCell('F').value = valor;
      row.getCell('G').value = { formula: `IF(D${fila}="No",0,F${fila})` };
      row.getCell('G').numFmt = '0%';
      row.getCell('H').value = r.comentarios || '';

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = this.bordesCompletos();
      });
      fila++;
    }
    this.agregarResumenManual(worksheet, fila, data);
  }

  private agregarResumenManual(worksheet: Worksheet, fila: number, data: EvaluacionExcelData) {
    const filaResumen = fila + 1;
    const ultimaFilaDatos = fila - 1;
    const resumenRow = worksheet.getRow(filaResumen);
    resumenRow.getCell('C').value = 'PROMEDIO COMPETENCIA (PONDERADO)';
    resumenRow.getCell('G').value = { formula: `IFERROR(SUM(G7:G${ultimaFilaDatos}) / COUNTIF(D7:D${ultimaFilaDatos},"Sí"), 0)` };
    resumenRow.getCell('G').numFmt = '0.00%';
    resumenRow.eachCell(c => c.font = { bold: true });
  }

  private bordesCompletos(): Partial<any> {
    return {
      top: { style: 'thin' as BorderStyle },
      left: { style: 'thin' as BorderStyle },
      bottom: { style: 'thin' as BorderStyle },
      right: { style: 'thin' as BorderStyle },
    };
  }
}










