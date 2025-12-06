import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  testId?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, testId }: StatCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-3xl font-semibold" data-testid={testId ? `${testId}-value` : undefined}>
            {value}
          </p>
          {(description || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-chart-2" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
