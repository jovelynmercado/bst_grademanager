import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Upload, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Student } from "@shared/schema";

const studentFormSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function Students() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      await apiRequest("POST", "/api/students", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Student created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to create student", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StudentFormValues & { id: string }) => {
      await apiRequest("PATCH", `/api/students/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to update student", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Student deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete student", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    form.reset();
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: StudentFormValues) => {
    if (editingStudent) {
      updateMutation.mutate({ ...data, id: editingStudent.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      key: "studentId",
      header: "Student ID",
      cell: (student: Student) => (
        <span className="font-mono text-sm" data-testid={`text-student-id-${student.id}`}>
          {student.studentId}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (student: Student) => (
        <div className="flex flex-col">
          <span className="font-medium">{student.firstName} {student.lastName}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (student: Student) => (
        <span className="text-muted-foreground">{student.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (student: Student) => (
        <Badge variant={student.isActive ? "default" : "secondary"}>
          {student.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (student: Student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid={`button-student-actions-${student.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid={`menu-item-view-${student.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEdit(student)}
              data-testid={`menu-item-edit-${student.id}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => deleteMutation.mutate(student.id)}
              className="text-destructive"
              data-testid={`menu-item-delete-${student.id}`}
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
        title="Students"
        description="Manage student records and enrollments."
        actions={
          <>
            <Button variant="outline" data-testid="button-upload-csv">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-student">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-students"
          />
        </div>
        <Badge variant="outline" className="font-mono">
          {filteredStudents.length} students
        </Badge>
      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        isLoading={isLoading}
        keyExtractor={(student) => student.id}
        emptyMessage="No students found"
        emptyDescription="Add your first student to get started."
        testIdPrefix="students"
      />

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Update the student's information."
                : "Fill in the student's details to create a new record."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., STU-2024-001"
                        {...field}
                        data-testid="input-student-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                        data-testid="input-email"
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
                    : editingStudent
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
