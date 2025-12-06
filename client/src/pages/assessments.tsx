import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ClipboardList, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Assessment, Subject } from "@shared/schema";
import { format } from "date-fns";

const assessmentFormSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  name: z.string().min(1, "Name is required"),
  category: z.enum(["quiz", "exam", "project", "assignment", "participation"]),
  weight: z.string().min(1, "Weight is required"),
  maxScore: z.string().min(1, "Max score is required"),
  description: z.string().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

interface AssessmentWithSubject extends Assessment {
  subject: Subject;
  gradeCount?: number;
}

const categoryLabels: Record<string, string> = {
  quiz: "Quiz",
  exam: "Exam",
  project: "Project",
  assignment: "Assignment",
  participation: "Participation",
};

const categoryColors: Record<string, string> = {
  quiz: "bg-chart-1 text-white",
  exam: "bg-chart-5 text-white",
  project: "bg-chart-2 text-white",
  assignment: "bg-chart-3 text-black",
  participation: "bg-chart-4 text-white",
};

export default function Assessments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  const { data: assessments = [], isLoading } = useQuery<AssessmentWithSubject[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      subjectId: "",
      name: "",
      category: "quiz",
      weight: "",
      maxScore: "100",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AssessmentFormValues) => {
      await apiRequest("POST", "/api/assessments", {
        ...data,
        weight: data.weight,
        maxScore: data.maxScore,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Assessment created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to create assessment", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AssessmentFormValues & { id: string }) => {
      await apiRequest("PATCH", `/api/assessments/${data.id}`, {
        ...data,
        weight: data.weight,
        maxScore: data.maxScore,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({ title: "Assessment updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to update assessment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assessments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Assessment deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete assessment", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAssessment(null);
    form.reset();
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    form.reset({
      subjectId: assessment.subjectId,
      name: assessment.name,
      category: assessment.category,
      weight: String(assessment.weight),
      maxScore: String(assessment.maxScore),
      description: assessment.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: AssessmentFormValues) => {
    if (editingAssessment) {
      updateMutation.mutate({ ...data, id: editingAssessment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const query = searchQuery.toLowerCase();
    return (
      assessment.name.toLowerCase().includes(query) ||
      assessment.subject.title.toLowerCase().includes(query) ||
      assessment.subject.code.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      key: "name",
      header: "Assessment",
      cell: (item: AssessmentWithSubject) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-muted-foreground">
            {item.subject.code} - {item.subject.title}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: AssessmentWithSubject) => (
        <Badge className={categoryColors[item.category]} variant="secondary">
          {categoryLabels[item.category]}
        </Badge>
      ),
    },
    {
      key: "weight",
      header: "Weight",
      cell: (item: AssessmentWithSubject) => (
        <span className="font-mono">{item.weight}%</span>
      ),
    },
    {
      key: "maxScore",
      header: "Max Score",
      cell: (item: AssessmentWithSubject) => (
        <span className="font-mono">{item.maxScore}</span>
      ),
    },
    {
      key: "grades",
      header: "Grades",
      cell: (item: AssessmentWithSubject) => (
        <Badge variant="outline" className="font-mono">
          {item.gradeCount || 0}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (item: AssessmentWithSubject) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">
            {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (item: AssessmentWithSubject) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid={`button-assessment-actions-${item.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleEdit(item)}
              data-testid={`menu-item-edit-${item.id}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => deleteMutation.mutate(item.id)}
              className="text-destructive"
              data-testid={`menu-item-delete-${item.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Assessments"
        description="Create and manage assessments for each subject."
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-assessment">
            <Plus className="h-4 w-4 mr-2" />
            Add Assessment
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-assessments"
          />
        </div>
        <Badge variant="outline" className="font-mono">
          {filteredAssessments.length} assessments
        </Badge>
      </div>

      <DataTable
        columns={columns}
        data={filteredAssessments}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No assessments found"
        emptyDescription="Create your first assessment to start grading students."
        testIdPrefix="assessments"
      />

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAssessment ? "Edit Assessment" : "Add New Assessment"}
            </DialogTitle>
            <DialogDescription>
              {editingAssessment
                ? "Update the assessment details."
                : "Create a new assessment for a subject."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code} - {subject.title}
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Midterm Exam"
                        {...field}
                        data-testid="input-assessment-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="participation">Participation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g., 20"
                          {...field}
                          data-testid="input-weight"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 100"
                          {...field}
                          data-testid="input-max-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the assessment..."
                        className="resize-none"
                        {...field}
                        data-testid="input-description"
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingAssessment
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
