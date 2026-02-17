// ProcessSection.tsx - MANTENIENDO DISEÑO ORIGINAL + cambio mínimo móvil
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { QuestionItem } from "./QuestionItem";

export interface Question {
  id_pregunta: number;
  titulo: string;
  peso: number;
  respuesta: boolean;
  noAplica: boolean;
}

interface ProcessSectionProps {
  title: string;
  questions: Question[];
  onToggleQuestion: (questionId: number) => void;
  onNoAplicaToggle?: (questionId: number) => void;
  readOnly?: boolean;
}

export function ProcessSection({
  title,
  questions,
  onToggleQuestion,
  onNoAplicaToggle,
}: ProcessSectionProps) {
  const applicableQuestions = questions.filter((q) => !q.noAplica);
  const completedCount = applicableQuestions.filter((q) => q.respuesta).length;
  const totalCount = applicableQuestions.length;
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
      <CardContent className="p-4 sm:p-6">
        {/* ÚNICO CAMBIO: Padding responsive + espaciado móvil */}
        <div className="space-y-3 sm:space-y-4">
          {questions.map((question) => (
            <QuestionItem
              key={question.id_pregunta}
              id={question.id_pregunta}
              question={question.titulo}
              weight={question.peso}
              completed={question.respuesta}
              noAplica={question.noAplica}
              onToggle={onToggleQuestion}
              onNoAplicaToggle={onNoAplicaToggle}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

