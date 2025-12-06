import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Upload, Save, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Grade, Student, Assessment, Subject } from "@shared/schema";

const gradeFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  assessmentId: z.string().min(1, "Assessment is required"),
  score: z.string().min(1, "Score is required"),
  remarks: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeWithDetails extends Grade {
  student: Student;
  assessment: Assessment & { subject: Subject };
}

export default function Grades() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: grades = [], isLoading } = useQuery<GradeWithDetails[]>({
    queryKey: ["/api/grades"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: assessments = [] } = useQuery<(Assessment & { subject: Subject })[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      studentId: "",
      assessmentId: "",
      score: "",
      remarks: "",
    },
  });

  const selectedAssessment = assessments.find(a => a.id === form.watch("assessmentId"));

  const createMutation = useMutation({
    mutationFn: async (data: GradeFormValues) => {
      await apiRequest("POST", "/api/grades", {
        ...data,
        score: data.score,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Grade recorded successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to record grade", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  const handleSubmit = (data: GradeFormValues) => {
    createMutation.mutate(data);
  };

  const filteredGrades = grades.filter((grade) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      grade.student.firstName.toLowerCase().includes(query) ||
      grade.student.lastName.toLowerCase().includes(query) ||
      grade.student.studentId.toLowerCase().includes(query) ||
      grade.assessment.name.toLowerCase().includes(query);

    const matchesSubject =
      subjectFilter === "all" || grade.assessment.subject.id === subjectFilter;

    return matchesSearch && matchesSubject;
  });

  const columns = [
    {
      key: "student",
      header: "Student",
      cell: (item: GradeWithDetails) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.student.firstName} {item.student.lastName}</span>
          <span className="text-xs text-muted-foreground font-mono">{item.student.studentId}</span>
        </div>
      ),
    },
    {
      key: "assessment",
      header: "Assessment",
      cell: (item: GradeWithDetails) => (
        <div className="flex flex-col">
          <span>{item.assessment.name}</span>
          <span className="text-xs text-muted-foreground">
            {item.assessment.subject.code} - {item.assessment.subject.title}
          </span>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      cell: (item: GradeWithDetails) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{item.score}/{item.assessment.maxScore}</span>
          <GradeBadge
            score={Number(item.score)}
            maxScore={Number(item.assessment.maxScore)}
            size="sm"
          />
        </div>
      ),
    },
    {
      key: "weight",
      header: "Weight",
      cell: (item: GradeWithDetails) => (
        <span className="font-mono text-muted-foreground">{item.assessment.weight}%</span>
      ),
    },
    {
      key: "weighted",
      header: "Weighted Score",
      cell: (item: GradeWithDetails) => {
        const percentage = (Number(item.score) / Number(item.assessment.maxScore)) * 100;
        const weighted = (percentage * Number(item.assessment.weight)) / 100;
        return <span className="font-mono">{weighted.toFixed(2)}%</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (item: GradeWithDetails) => (
        <Badge
          variant={item.status === "approved" ? "default" : "secondary"}
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Grades"
        description="Record and manage student grades for all assessments."
        actions={
          <>
            <Button variant="outline" data-testid="button-upload-grades">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-grade">
              <Plus className="h-4 w-4 mr-2" />
              Record Grade
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search grades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-grades"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-subject-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.code} - {subject.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="font-mono">
          {filteredGrades.length} grades
        </Badge>
      </div>

      <DataTable
        columns={columns}
        data={filteredGrades}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No grades found"
        emptyDescription="Start by recording grades for student assessments."
        testIdPrefix="grades"
      />

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Grade</DialogTitle>
            <DialogDescription>
              Enter the grade for a student's assessment.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-student">
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.studentId} - {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assessment">
                          <SelectValue placeholder="Select an assessment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assessments.map((assessment) => (
                          <SelectItem key={assessment.id} value={assessment.id}>
                            {assessment.subject.code} - {assessment.name} (Max: {assessment.maxScore})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Score {selectedAssessment && `(Max: ${selectedAssessment.maxScore})`}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={selectedAssessment ? Number(selectedAssessment.maxScore) : 100}
                        step="0.01"
                        placeholder="Enter score"
                        {...field}
                        data-testid="input-score"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Any comments about this grade..."
                        {...field}
                        data-testid="input-remarks"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? "Saving..." : "Save Grade"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
