export interface EvaluationApi {
  idEvaluacion: number;
  fechaEvaluacion: string;
  categoria: string;
  estado: 'pendiente' | 'en_revision' | 'aprobada' | 'reprobada'; // ✅ NUEVO
}

export type EvaluationStatus = 
  | 'all'
  | 'pending-review'
  | 'in-review'
  | 'approved'
  | 'failed'; // ✅ Reemplaza 'completed'

export interface EvaluationUI {
  id: number;
  name: string;
  date: string;
  status: EvaluationStatus;
  userName?: string;
}

const statusMap: Record<EvaluationApi['estado'], EvaluationStatus> = {
  pendiente: 'pending-review',
  en_revision: 'in-review',
  aprobada: 'approved',
  reprobada: 'failed', // ✅ NUEVO
};

export function mapEvaluation(api: EvaluationApi & { nombreEmpleado?: string }): EvaluationUI {
  return {
    id: api.idEvaluacion,
    name: api.categoria,
    date: api.fechaEvaluacion,
    status: statusMap[api.estado],
    userName: api.nombreEmpleado,
  };
}


export interface RespuestaApi {
  idPregunta: number;
  respuesta: boolean;
  comentarios?: string;
}

export interface EvaluacionDetalleApi {
  idEvaluacion: number;
  fechaEvaluacion: string;
  estado: 'pendiente' | 'completada' | 'aprobada';
  observaciones?: string;
  respuestas: RespuestaApi[];
}