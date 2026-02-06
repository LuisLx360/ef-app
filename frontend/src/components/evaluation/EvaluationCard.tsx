// src/components/evaluation/EvaluationCard.tsx
import type { EvaluationUI } from '../../types/evaluation';
import { StatusBadge } from '../ui/StatusBadge';

interface EvaluationCardProps {
  evaluation: EvaluationUI;
  onClick: (id: number) => void;
}

export default function EvaluationCard({
  evaluation,
  onClick,
}: EvaluationCardProps) {
  return (
    <div
      onClick={() => onClick(evaluation.id)}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900">{evaluation.name}</h3>

          {/* 🔹 Nombre del evaluador */}
          {evaluation.userName && (
            <p className="text-xs text-gray-500">Por: {evaluation.userName}</p>
          )}

          {/* Fecha */}
          <p className="text-xs text-gray-400">
            {(() => {
              const d = new Date(evaluation.date);
              if (isNaN(d.getTime())) return "Fecha inválida";
              return d.toLocaleDateString('es-ES');
            })()}
          </p>
        </div>

        <StatusBadge status={evaluation.status} />
      </div>

      <div className="mt-4 text-xs text-gray-400">Ver detalles →</div>
    </div>
  );
}
