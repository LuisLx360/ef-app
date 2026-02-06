// src/evaluaciones/evaluaciones-excel.service.ts
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
  respuestas: Array<{
    idPregunta: number;
    titulo: string;
    respuesta: boolean;
    comentarios?: string;
  }>;
}

@Injectable()
export class EvaluacionesExcelService {
  constructor(private readonly dbService: DbService) {}

  /* ======================================================
     EXPORTAR EVALUACIÓN
  ====================================================== */
  async exportarEvaluacion(idEvaluacion: number): Promise<{ buffer: Buffer; filename: string }> {
    const evaluacionRaw = await this.dbService.getEvaluacionCompleta(idEvaluacion);
    if (!evaluacionRaw) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    const empleado = await this.dbService.getEmpleadoById(evaluacionRaw.idEmpleado!);
    const nombreEmpleado =
      empleado?.empleado?.replace(/[^a-zA-Z0-9\s]/g, '_') || 'Sin_Empleado';
    const fecha = evaluacionRaw.fechaEvaluacion
      ? new Date(evaluacionRaw.fechaEvaluacion).toISOString().split('T')[0]
      : '1900-01-01';

    const data: EvaluacionExcelData = {
      idEvaluacion: evaluacionRaw.idEvaluacion,
      nombreEmpleado,
      nombreEvaluador: evaluacionRaw.evaluador ?? 'Sin evaluador',
      categoria: evaluacionRaw.categoria ?? 'Sin categoría',
      proceso: evaluacionRaw.proceso ?? undefined,
      fechaEvaluacion: fecha,
      respuestas: evaluacionRaw.respuestas.map((r) => ({
        idPregunta: r.idPregunta,
        titulo: r.titulo,
        respuesta: r.respuesta,
        comentarios: r.comentarios ?? undefined,
      })),
    };

    const buffer = await this.generarExcel(data, evaluacionRaw.area || 'packaging');
    const filename = `${nombreEmpleado}_${fecha}.xlsx`;
    return { buffer, filename };
  }

  /* ======================================================
     GENERAR EXCEL - Solo la hoja objetivo se llena
  ====================================================== */
  private async generarExcel(data: EvaluacionExcelData, area: string): Promise<Buffer> {
    const workbook = new Workbook();

    const hojas = this.generarNombresHojas(area);
    const worksheets: { [key: string]: Worksheet } = {};

    for (const nombre of hojas) {
      worksheets[nombre] = workbook.addWorksheet(nombre);
    }

    const hojaTarget = this.obtenerHojaPorCategoria(data.categoria, area);
    const worksheet = worksheets[hojaTarget];

    this.configurarHojaBase(worksheet, data);
    this.llenarDatosEvaluacion(worksheet, data);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /* ======================================================
     NOMBRES DE HOJAS POR ÁREA REAL
  ====================================================== */
  private generarNombresHojas(area: string): string[] {
    const tipoArea = area === 'electrico' ? 'Electrica' : 'Packaging';
    return [`L6 ${tipoArea}`, `L7 ${tipoArea}`, `L8 ${tipoArea}`];
  }

  /* ======================================================
     HOJA SEGÚN CATEGORÍA
  ====================================================== */
  private obtenerHojaPorCategoria(categoria: string, area: string): string {
    const tipoArea = area === 'electrico' ? 'Electrica' : 'Packaging';
    if (categoria.includes('L6')) return `L6 ${tipoArea}`;
    if (categoria.includes('L7')) return `L7 ${tipoArea}`;
    if (categoria.includes('L8')) return `L8 ${tipoArea}`;
    return `L6 ${tipoArea}`;
  }

  /* ======================================================
     CONFIGURACIÓN BASE DE LA HOJA
  ====================================================== */
  private configurarHojaBase(worksheet: Worksheet, data: EvaluacionExcelData) {
    worksheet.views = [{ state: 'frozen', ySplit: 4 }];
    worksheet.columns = [
      { width: 2.5 },
      { width: 26 },
      { width: 90 },
      { width: 10 },
      { width: 12 },
      { width: 30 },
    ];
    this.crearHeaderSuperior(worksheet, data);
  }

  /* ======================================================
     HEADER SUPERIOR
  ====================================================== */
  private crearHeaderSuperior(worksheet: Worksheet, data: EvaluacionExcelData) {
    worksheet.mergeCells('B1:F1');
    const row1 = worksheet.getRow(1);
    row1.getCell('B').value = `Guía Técnica ${data.categoria}`;
    row1.getCell('B').font = { bold: true, size: 16 };
    row1.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' };

    const row2 = worksheet.getRow(2);
    row2.getCell('B').value = data.proceso ? `Proceso: ${data.proceso}` : '';
    row2.getCell('D').value = `Evaluado: ${data.nombreEmpleado}`;
    row2.getCell('B').font = { bold: true };
    row2.getCell('D').font = { bold: true };

    const row3 = worksheet.getRow(3);
    row3.getCell('B').value = `Evaluador: ${data.nombreEvaluador}`;
    row3.getCell('D').value = `Fecha: ${data.fechaEvaluacion}`;
    row3.getCell('B').alignment = { horizontal: 'left' };
    row3.getCell('D').alignment = { horizontal: 'left' };

    const headerRow = worksheet.getRow(4);
    headerRow.values = [null, 'TEMA', 'PREGUNTA', 'RESULTADO (1/0)', '%', 'OBSERVACIONES'];
    headerRow.eachCell({ includeEmpty: true }, (cell, i) => {
      if (i >= 2) {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = this.bordesCompletos();
      }
    });
  }

  /* ======================================================
     DATOS DE LA EVALUACIÓN
  ====================================================== */
  private llenarDatosEvaluacion(worksheet: Worksheet, data: EvaluacionExcelData) {
    let fila = 5;
    const totalPreguntas = data.respuestas.length;

    for (const r of data.respuestas) {
      const row = worksheet.getRow(fila);
      const valor = r.respuesta ? 1 : 0;

      row.getCell('B').value = data.proceso || data.categoria;
      row.getCell('C').value = r.titulo;
      row.getCell('D').value = valor;
      row.getCell('E').value = { formula: `=D${fila}` }; // mismo valor pero en formato de porcentaje después
      row.getCell('F').value = r.comentarios || '';

      row.getCell('D').numFmt = '0';
      row.getCell('E').numFmt = '0%';

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = this.bordesCompletos();
      });

      fila++;
    }

    this.agregarFormulasFinales(worksheet, fila, totalPreguntas);
  }

  /* ======================================================
     FORMULAS FINALES DE COMPETENCIA
  ====================================================== */
  private agregarFormulasFinales(worksheet: Worksheet, fila: number, total: number) {
    const primeraFila = 5;
    const ultimaFila = fila - 1;
    const filaResumen = fila + 1;

    const promedioRow = worksheet.getRow(filaResumen);
    promedioRow.getCell('C').value = 'PROMEDIO COMPETENCIA';
    promedioRow.getCell('C').font = { bold: true, size: 12 };

    const rango = `D${primeraFila}:D${ultimaFila}`;
    promedioRow.getCell('D').value = { formula: `=AVERAGE(${rango})` };
    promedioRow.getCell('D').numFmt = '0.00%';

    promedioRow.getCell('F').value = {
      formula: `"COMPETENCIAS [1] Competente [0] No competente " & IF(D${filaResumen}>=0.8,"≧80% COMPETENTE","<80% NO COMPETENTE")`,
    };
    promedioRow.getCell('F').alignment = { wrapText: true };
  }

  /* ======================================================
     BORDES
  ====================================================== */
  private bordesCompletos(): Partial<any> {
    return {
      top: { style: 'thin' as BorderStyle },
      left: { style: 'thin' as BorderStyle },
      bottom: { style: 'thin' as BorderStyle },
      right: { style: 'thin' as BorderStyle },
    };
  }
}
