export interface MatrizEvaluacionPreguntaDto {
  id: number;
  texto: string;
  orden: number;
}

export interface MatrizEvaluacionOperadorDto {
  idEvaluacion: number;
  idEmpleado: number;
  nombre: string;
  resultadoInicial: number;
  resultadoFinal: number;
  respuestas: Record<number, boolean>;
}

export interface MatrizEvaluacionDto {
  guiaId: number;
  guiaNombre: string;
  procesoId: number;
  procesoNombre: string;
  preguntas: MatrizEvaluacionPreguntaDto[];
  operadores: MatrizEvaluacionOperadorDto[];
}
