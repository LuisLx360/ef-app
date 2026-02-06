import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

interface QuestionItemProps {
  id: number;
  question: string;
  weight?: number;
  completed: boolean;
  onToggle: (id: number) => void;
}

export function QuestionItem({ 
  id, 
  question, 
  weight, 
  completed, 
  onToggle 
}: QuestionItemProps) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
      <Checkbox
        id={`q-${id}`}
        checked={completed}
        onCheckedChange={() => onToggle(id)}
        className="mt-1 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`q-${id}`}
          className="text-base cursor-pointer leading-relaxed block text-gray-800"
        >
          {question}
        </Label>
        {weight && (
          <span className="inline-block mt-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Peso: {weight}
          </span>
        )}
      </div>
    </div>
  );
}