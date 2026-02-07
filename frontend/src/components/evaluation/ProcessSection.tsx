import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { QuestionItem } from "./QuestionItem";

// ✅ Interfaz YA ACTUALIZADA ✓
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
  onNoAplicaToggle?: (questionId: number) => void;  // ✅ NUEVO PROP
  readOnly?: boolean;
}

export function ProcessSection({
  title,
  questions,
  onToggleQuestion,
  onNoAplicaToggle,  // ✅ NUEVO
}: ProcessSectionProps) {
  // 🔥 CÁLCULO ACTUALIZADO con "No Aplica"
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
            {completedCount} de {totalCount} {/* Ya filtra No Aplica */}
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
              noAplica={question.noAplica}      // ✅ NUEVO PROP
              onToggle={onToggleQuestion}
              onNoAplicaToggle={onNoAplicaToggle}  // ✅ NUEVO PROP
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
