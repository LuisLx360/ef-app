import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface QuestionItemProps {
  id: number;
  question: string;
  weight?: number;
  completed: boolean;
  noAplica: boolean;
  onToggle: (id: number) => void;
  onNoAplicaToggle?: (id: number) => void;  // ✅ OPCIONAL
}

export function QuestionItem({ 
  id, 
  question, 
  weight, 
  completed, 
  noAplica,
  onToggle,
  onNoAplicaToggle 
}: QuestionItemProps) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 flex-shrink-0 pt-1">
        {/* ✅ CHECKBOX ORIGINAL (Sí/No) */}
        <Checkbox
          id={`q-${id}`}
          checked={completed}
          onCheckedChange={(_checked) => onToggle(id)}
          disabled={noAplica}  // ✅ Deshabilitado si No Aplica
          className="mt-1 flex-shrink-0 border-2 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 hover:data-[state=unchecked]:border-gray-400"
        />
        
        {/* ✅ BOTÓN NO APLICA (Solo cuando aplica) */}
        <Button
          size="sm"
          variant={noAplica ? "secondary" : "ghost"}
          onClick={() => onNoAplicaToggle?.(id)}
          disabled={completed || !onNoAplicaToggle}
          className={`h-9 px-3 text-xs font-medium transition-all ${
            noAplica 
              ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500 shadow-md' 
              : 'border-gray-300 hover:bg-gray-50 hover:border-gray-500'
          } ${completed ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {noAplica ? '⏭️ No Aplica ✓' : '⏭️ No Aplica'}
        </Button>
      </div>
      
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`q-${id}`}
          className={`text-base cursor-pointer leading-relaxed block text-gray-800 ${
            noAplica ? 'opacity-60' : ''
          }`}
        >
          {question}
        </Label>
        {weight && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-gray-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              Peso: {weight}
            </span>
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
              Estado: {noAplica ? 'Excluida' : completed ? 'Aprobada' : 'Pendiente'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


