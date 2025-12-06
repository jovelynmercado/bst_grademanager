import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, BookOpen, Users } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subject, User } from "@shared/schema";

const subjectFormSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

interface SubjectWithStats extends Subject {
  teacher?: User | null;
  enrollmentCount: number;
  assessmentCount: number;
}

export default function Subjects() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const { data: subjects = [], isLoading } = useQuery<SubjectWithStats[]>({
    queryKey: ["/api/subjects"],
  });

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SubjectFormValues) => {
      await apiRequest("POST", "/api/subjects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Subject created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to create subject", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SubjectFormValues & { id: string }) => {
      await apiRequest("PATCH", `/api/subjects/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Subject updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to update subject", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Subject deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete subject", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    form.reset();
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    form.reset({
      code: subject.code,
      title: subject.title,
      description: subject.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: SubjectFormValues) => {
    if (editingSubject) {
      updateMutation.mutate({ ...data, id: editingSubject.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const query = searchQuery.toLowerCase();
    return (
      subject.code.toLowerCase().includes(query) ||
      subject.title.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Subjects" description="Manage subjects and courses." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded" />
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
        title="Subjects"
        description="Manage subjects and courses."
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-subject">
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-subjects"
          />
        </div>
        <Badge variant="outline" className="font-mono">
          {filteredSubjects.length} subjects
        </Badge>
      </div>

      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No subjects found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first subject to get started.
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-first-subject"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover-elevate" data-testid={`card-subject-${subject.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <Badge variant="outline" className="font-mono mb-2">
                    {subject.code}
                  </Badge>
                  <CardTitle className="text-lg font-medium truncate">
                    {subject.title}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-subject-actions-${subject.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEdit(subject)}
                      data-testid={`menu-item-edit-${subject.id}`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteMutation.mutate(subject.id)}
                      className="text-destructive"
                      data-testid={`menu-item-delete-${subject.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {subject.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {subject.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{subject.enrollmentCount || 0} students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{subject.assessmentCount || 0} assessments</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? "Update the subject's information."
                : "Fill in the subject details to create a new course."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CS101"
                        {...field}
                        data-testid="input-subject-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Introduction to Computer Science"
                        {...field}
                        data-testid="input-subject-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the subject..."
                        className="resize-none"
                        {...field}
                        data-testid="input-subject-description"
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
                    : editingSubject
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
