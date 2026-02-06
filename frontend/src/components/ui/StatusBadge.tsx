import type { EvaluationStatus } from '../../types/evaluation';

interface StatusBadgeProps {
  status: EvaluationStatus;
}

const STATUS_STYLES: Record<EvaluationStatus, string> = {
  // ✅ Eliminado: 'completed'
  'all': 'bg-gray-100 text-gray-700',           // Todas (gris claro)
  'pending-review': 'bg-orange-100 text-orange-700',  // Pendiente (naranja)
  'in-review': 'bg-yellow-100 text-yellow-700',       // En revisión (amarillo)
  'approved': 'bg-green-100 text-green-700',          // Aprobada (verde)
  'failed': 'bg-red-100 text-red-700',                // Reprobada (rojo)
};

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  'all': 'Todas',
  'pending-review': 'Pendiente',        // Antes era solo 'Pendiente'
  'in-review': 'En revisión',
  'approved': 'Aprobada',
  'failed': 'Reprobada',                // ✅ NUEVO
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status]
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}