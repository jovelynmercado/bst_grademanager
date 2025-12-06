import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, Users, TrendingUp, TrendingDown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { GradeBadge } from "@/components/grade-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";
import type { Subject, Student } from "@shared/schema";

interface AnalyticsData {
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  subjectPerformance: { subject: string; average: number; highest: number; lowest: number }[];
  categoryBreakdown: { category: string; count: number }[];
  topPerformers: { student: Student; average: number; rank: number }[];
  lowPerformers: { student: Student; average: number; rank: number }[];
  overallStats: {
    averageScore: number;
    medianScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  };
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Analytics() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", selectedSubject],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const topPerformersColumns = [
    {
      key: "rank",
      header: "#",
      cell: (item: AnalyticsData["topPerformers"][0]) => (
        <div className="flex items-center gap-2">
          {item.rank <= 3 ? (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              item.rank === 1 ? "bg-yellow-500 text-white" :
              item.rank === 2 ? "bg-gray-400 text-white" :
              "bg-amber-700 text-white"
            }`}>
              {item.rank}
            </div>
          ) : (
            <span className="font-mono text-muted-foreground">{item.rank}</span>
          )}
        </div>
      ),
      className: "w-12",
    },
    {
      key: "student",
      header: "Student",
      cell: (item: AnalyticsData["topPerformers"][0]) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.student.firstName} {item.student.lastName}</span>
          <span className="text-xs text-muted-foreground font-mono">{item.student.studentId}</span>
        </div>
      ),
    },
    {
      key: "average",
      header: "Average",
      cell: (item: AnalyticsData["topPerformers"][0]) => (
        <GradeBadge score={item.average} maxScore={100} />
      ),
      className: "text-right",
    },
  ];

  const lowPerformersColumns = [
    {
      key: "rank",
      header: "#",
      cell: (item: AnalyticsData["lowPerformers"][0]) => (
        <span className="font-mono text-muted-foreground">{item.rank}</span>
      ),
      className: "w-12",
    },
    {
      key: "student",
      header: "Student",
      cell: (item: AnalyticsData["lowPerformers"][0]) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.student.firstName} {item.student.lastName}</span>
          <span className="text-xs text-muted-foreground font-mono">{item.student.studentId}</span>
        </div>
      ),
    },
    {
      key: "average",
      header: "Average",
      cell: (item: AnalyticsData["lowPerformers"][0]) => (
        <GradeBadge score={item.average} maxScore={100} />
      ),
      className: "text-right",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Analytics" description="Grade distribution and performance insights." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        description="Grade distribution and performance insights."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]" data-testid="select-subject-filter">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-semibold" data-testid="text-average-score">
              {analytics?.overallStats?.averageScore?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Median Score</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-semibold" data-testid="text-median-score">
              {analytics?.overallStats?.medianScore?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Highest Score</p>
              <Award className="h-4 w-4 text-chart-2" />
            </div>
            <p className="text-3xl font-semibold text-chart-2" data-testid="text-highest-score">
              {analytics?.overallStats?.highestScore?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Lowest Score</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-3xl font-semibold text-destructive" data-testid="text-lowest-score">
              {analytics?.overallStats?.lowestScore?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-semibold" data-testid="text-pass-rate">
              {analytics?.overallStats?.passRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.gradeDistribution && analytics.gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="grade" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No grade data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Assessment Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="category"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analytics.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
            <Badge variant="outline" className="font-mono">
              <TrendingUp className="h-3 w-3 mr-1" />
              Top 10
            </Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={topPerformersColumns}
              data={analytics?.topPerformers || []}
              keyExtractor={(item) => item.student.id}
              emptyMessage="No data available"
              emptyDescription="Record grades to see top performers."
              testIdPrefix="top-performers"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-medium">Needs Attention</CardTitle>
            <Badge variant="outline" className="font-mono">
              <TrendingDown className="h-3 w-3 mr-1" />
              Below 60%
            </Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={lowPerformersColumns}
              data={analytics?.lowPerformers || []}
              keyExtractor={(item) => item.student.id}
              emptyMessage="No struggling students"
              emptyDescription="All students are performing well!"
              testIdPrefix="low-performers"
            />
          </CardContent>
        </Card>
      </div>

      {analytics?.subjectPerformance && analytics.subjectPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Subject Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="average" name="Average" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highest" name="Highest" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowest" name="Lowest" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
