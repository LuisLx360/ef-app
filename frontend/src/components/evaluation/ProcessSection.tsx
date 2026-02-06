import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { QuestionItem } from "./QuestionItem";

// ✅ Exportar la interfaz Question
export interface Question {
  id_pregunta: number;
  titulo: string;
  peso: number;
  respuesta: boolean;
}

interface ProcessSectionProps {
  title: string;
  questions: Question[];
  onToggleQuestion: (questionId: number) => void;
  readOnly?: boolean; // 👈 opcional
}

export function ProcessSection({
  title,
  questions,
  onToggleQuestion,
}: ProcessSectionProps) {
  const completedCount = questions.filter((q) => q.respuesta).length;
  const totalCount = questions.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-600">{title}</CardTitle>
          <span className="text-sm text-gray-600">
            {completedCount} de {totalCount}
          </span>
        </div>
        <Progress value={progressPercentage} className="mt-3 h-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {questions.map((question) => (
            <QuestionItem
              key={question.id_pregunta}
              id={question.id_pregunta}
              question={question.titulo}
              weight={question.peso}
              completed={question.respuesta}
              onToggle={onToggleQuestion}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}