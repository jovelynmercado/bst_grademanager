import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "teacher", "student"]);
export const assessmentCategoryEnum = pgEnum("assessment_category", ["quiz", "exam", "project", "assignment", "participation"]);
export const gradeStatusEnum = pgEnum("grade_status", ["pending", "submitted", "approved"]);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("student").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_student_student_id").on(table.studentId),
  index("IDX_student_email").on(table.email),
]);

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_subject_code").on(table.code),
]);

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
  index("IDX_enrollment_student").on(table.studentId),
  index("IDX_enrollment_subject").on(table.subjectId),
]);

// Assessments table
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  name: varchar("name").notNull(),
  category: assessmentCategoryEnum("category").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_assessment_subject").on(table.subjectId),
]);

// Grades table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  assessmentId: varchar("assessment_id").references(() => assessments.id).notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(),
  status: gradeStatusEnum("status").default("submitted").notNull(),
  remarks: text("remarks"),
  gradedBy: varchar("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_grade_student").on(table.studentId),
  index("IDX_grade_assessment").on(table.assessmentId),
  index("IDX_grade_score").on(table.score),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  taughtSubjects: many(subjects),
  gradedGrades: many(grades),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  grades: many(grades),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  teacher: one(users, {
    fields: [subjects.teacherId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  assessments: many(assessments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [enrollments.subjectId],
    references: [subjects.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [assessments.subjectId],
    references: [subjects.id],
  }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
  assessment: one(assessments, {
    fields: [grades.assessmentId],
    references: [assessments.id],
  }),
  grader: one(users, {
    fields: [grades.gradedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  gradedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

// Extended types for frontend
export type StudentWithGrades = Student & {
  grades: (Grade & { assessment: Assessment })[];
  enrollments: (Enrollment & { subject: Subject })[];
};

export type SubjectWithDetails = Subject & {
  teacher: User | null;
  assessments: Assessment[];
  enrollments: (Enrollment & { student: Student })[];
};

export type AssessmentWithGrades = Assessment & {
  subject: Subject;
  grades: (Grade & { student: Student })[];
};

export type GradeWithDetails = Grade & {
  student: Student;
  assessment: Assessment & { subject: Subject };
};

// BST Types for visualization
export type BSTNode<T> = {
  value: T;
  key: number | string;
  left: BSTNode<T> | null;
  right: BSTNode<T> | null;
  depth: number;
  position: { x: number; y: number };
};

export type BSTOperation = {
  type: "insert" | "search" | "delete" | "traverse";
  key: number | string;
  path: (number | string)[];
  comparisons: string[];
  result: "found" | "not_found" | "inserted" | "deleted" | "traversed";
};

export type BSTVisualizationData = {
  root: BSTNode<any> | null;
  operations: BSTOperation[];
  traversalOrder: (number | string)[];
  nodeCount: number;
  height: number;
};
