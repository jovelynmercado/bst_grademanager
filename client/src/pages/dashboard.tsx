import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, FileText, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { GradeBadge } from "@/components/grade-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { Student, Grade, Subject, Assessment } from "@shared/schema";

interface DashboardStats {
  totalStudents: number;
  totalSubjects: number;
  totalAssessments: number;
  totalGrades: number;
  averageScore: number;
  recentGrades: (Grade & { student: Student; assessment: Assessment & { subject: Subject } })[];
  topPerformers: { student: Student; averageScore: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const recentGradesColumns = [
    {
      key: "student",
      header: "Student",
      cell: (item: DashboardStats["recentGrades"][0]) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.student.firstName} {item.student.lastName}</span>
          <span className="text-xs text-muted-foreground font-mono">{item.student.studentId}</span>
        </div>
      ),
    },
    {
      key: "assessment",
      header: "Assessment",
      cell: (item: DashboardStats["recentGrades"][0]) => (
        <div className="flex flex-col">
          <span>{item.assessment.name}</span>
          <span className="text-xs text-muted-foreground">{item.assessment.subject.title}</span>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      cell: (item: DashboardStats["recentGrades"][0]) => (
        <GradeBadge
          score={Number(item.score)}
          maxScore={Number(item.assessment.maxScore)}
        />
      ),
      className: "text-right",
    },
  ];

  const topPerformersColumns = [
    {
      key: "rank",
      header: "#",
      cell: (_: DashboardStats["topPerformers"][0], index: number) => (
        <span className="font-mono text-muted-foreground">{index + 1}</span>
      ),
      className: "w-12",
    },
    {
      key: "student",
      header: "Student",
      cell: (item: DashboardStats["topPerformers"][0]) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.student.firstName} {item.student.lastName}</span>
          <span className="text-xs text-muted-foreground font-mono">{item.student.studentId}</span>
        </div>
      ),
    },
    {
      key: "average",
      header: "Average",
      cell: (item: DashboardStats["topPerformers"][0]) => (
        <Badge variant="secondary" className="font-mono">
          {item.averageScore.toFixed(1)}%
        </Badge>
      ),
      className: "text-right",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title={`${getGreeting()}, ${user?.firstName || "User"}`}
        description="Here's an overview of your grade management system."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          description="Enrolled students"
          testId="stat-students"
        />
        <StatCard
          title="Subjects"
          value={stats?.totalSubjects || 0}
          icon={BookOpen}
          description="Active subjects"
          testId="stat-subjects"
        />
        <StatCard
          title="Assessments"
          value={stats?.totalAssessments || 0}
          icon={ClipboardList}
          description="Total assessments"
          testId="stat-assessments"
        />
        <StatCard
          title="Grades Recorded"
          value={stats?.totalGrades || 0}
          icon={FileText}
          description="Grade entries"
          testId="stat-grades"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-medium">Recent Grades</CardTitle>
            <Badge variant="outline" className="font-mono">
              <TrendingUp className="h-3 w-3 mr-1" />
              Latest
            </Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentGradesColumns}
              data={stats?.recentGrades || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No grades recorded"
              emptyDescription="Start by adding assessments and recording grades."
              testIdPrefix="recent-grades"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
            <Badge variant="outline" className="font-mono">
              <TrendingDown className="h-3 w-3 mr-1 rotate-180" />
              Rankings
            </Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={topPerformersColumns}
              data={stats?.topPerformers || []}
              keyExtractor={(item) => item.student.id}
              emptyMessage="No rankings yet"
              emptyDescription="Rankings will appear once grades are recorded."
              testIdPrefix="top-performers"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Average Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="text-2xl font-semibold" data-testid="text-average-score">
                {stats?.averageScore?.toFixed(1) || "0"}%
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Overall average score across all assessments
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                  <span className="text-xs text-muted-foreground">Excellent (90%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-1" />
                  <span className="text-xs text-muted-foreground">Good (80-89%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-3" />
                  <span className="text-xs text-muted-foreground">Average (70-79%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
