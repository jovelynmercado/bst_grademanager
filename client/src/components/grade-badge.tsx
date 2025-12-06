import { Badge } from "@/components/ui/badge";

interface GradeBadgeProps {
  score: number;
  maxScore: number;
  showPercentage?: boolean;
  size?: "sm" | "default";
}

export function GradeBadge({ score, maxScore, showPercentage = true, size = "default" }: GradeBadgeProps) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  const getGradeColor = () => {
    if (percentage >= 90) return "bg-chart-2 text-white";
    if (percentage >= 80) return "bg-chart-1 text-white";
    if (percentage >= 70) return "bg-chart-3 text-black";
    if (percentage >= 60) return "bg-orange-500 text-white";
    return "bg-destructive text-destructive-foreground";
  };

  const getLetterGrade = () => {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  };

  return (
    <Badge
      className={`${getGradeColor()} ${size === "sm" ? "text-xs px-2 py-0.5" : ""}`}
      variant="secondary"
    >
      {showPercentage
        ? `${percentage.toFixed(1)}%`
        : getLetterGrade()}
    </Badge>
  );
}
