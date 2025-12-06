import {
  users,
  students,
  subjects,
  enrollments,
  assessments,
  grades,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Subject,
  type InsertSubject,
  type Enrollment,
  type InsertEnrollment,
  type Assessment,
  type InsertAssessment,
  type Grade,
  type InsertGrade,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: "admin" | "teacher" | "student"): Promise<User | undefined>;

  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  searchStudents(query: string): Promise<Student[]>;

  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  getSubjectsByTeacher(teacherId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<boolean>;

  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  getEnrollmentsBySubject(subjectId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(id: string): Promise<boolean>;

  getAssessments(): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentsBySubject(subjectId: string): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: string): Promise<boolean>;

  getGrades(): Promise<Grade[]>;
  getGrade(id: string): Promise<Grade | undefined>;
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getGradesByAssessment(assessmentId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade | undefined>;
  deleteGrade(id: string): Promise<boolean>;

  getDashboardStats(): Promise<{
    totalStudents: number;
    totalSubjects: number;
    totalAssessments: number;
    totalGrades: number;
    averageScore: number;
  }>;

  getRecentGrades(limit?: number): Promise<any[]>;
  getTopPerformers(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: "admin" | "teacher" | "student"): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.isActive, true)).orderBy(students.lastName, students.firstName);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(students)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return !!deleted;
  }

  async searchStudents(query: string): Promise<Student[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.isActive, true),
          or(
            ilike(students.firstName, searchTerm),
            ilike(students.lastName, searchTerm),
            ilike(students.studentId, searchTerm),
            ilike(students.email, searchTerm)
          )
        )
      )
      .orderBy(students.lastName, students.firstName);
  }

  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.isActive, true)).orderBy(subjects.title);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectsByTeacher(teacherId: string): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.teacherId, teacherId), eq(subjects.isActive, true)))
      .orderBy(subjects.title);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [created] = await db.insert(subjects).values(subject).returning();
    return created;
  }

  async updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updated] = await db
      .update(subjects)
      .set({ ...subject, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async deleteSubject(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(subjects)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return !!deleted;
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.isActive, true));
  }

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.isActive, true)));
  }

  async getEnrollmentsBySubject(subjectId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.subjectId, subjectId), eq(enrollments.isActive, true)));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values(enrollment).returning();
    return created;
  }

  async deleteEnrollment(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(enrollments)
      .set({ isActive: false })
      .where(eq(enrollments.id, id))
      .returning();
    return !!deleted;
  }

  async getAssessments(): Promise<Assessment[]> {
    return await db.select().from(assessments).where(eq(assessments.isActive, true)).orderBy(assessments.name);
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async getAssessmentsBySubject(subjectId: string): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.subjectId, subjectId), eq(assessments.isActive, true)))
      .orderBy(assessments.name);
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(assessments).values(assessment).returning();
    return created;
  }

  async updateAssessment(id: string, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updated] = await db
      .update(assessments)
      .set({ ...assessment, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async deleteAssessment(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(assessments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return !!deleted;
  }

  async getGrades(): Promise<Grade[]> {
    return await db.select().from(grades).orderBy(desc(grades.gradedAt));
  }

  async getGrade(id: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return await db
      .select()
      .from(grades)
      .where(eq(grades.studentId, studentId))
      .orderBy(desc(grades.gradedAt));
  }

  async getGradesByAssessment(assessmentId: string): Promise<Grade[]> {
    return await db
      .select()
      .from(grades)
      .where(eq(grades.assessmentId, assessmentId))
      .orderBy(desc(grades.gradedAt));
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [created] = await db.insert(grades).values(grade).returning();
    return created;
  }

  async updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade | undefined> {
    const [updated] = await db
      .update(grades)
      .set({ ...grade, updatedAt: new Date() })
      .where(eq(grades.id, id))
      .returning();
    return updated;
  }

  async deleteGrade(id: string): Promise<boolean> {
    const result = await db.delete(grades).where(eq(grades.id, id)).returning();
    return result.length > 0;
  }

  async getDashboardStats(): Promise<{
    totalStudents: number;
    totalSubjects: number;
    totalAssessments: number;
    totalGrades: number;
    averageScore: number;
  }> {
    const [studentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(eq(students.isActive, true));

    const [subjectCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subjects)
      .where(eq(subjects.isActive, true));

    const [assessmentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessments)
      .where(eq(assessments.isActive, true));

    const [gradeStats] = await db
      .select({
        count: sql<number>`count(*)::int`,
        avgScore: sql<number>`coalesce(avg(${grades.score}::numeric), 0)::float`,
      })
      .from(grades);

    return {
      totalStudents: studentCount?.count || 0,
      totalSubjects: subjectCount?.count || 0,
      totalAssessments: assessmentCount?.count || 0,
      totalGrades: gradeStats?.count || 0,
      averageScore: gradeStats?.avgScore || 0,
    };
  }

  async getRecentGrades(limit: number = 10): Promise<any[]> {
    const recentGrades = await db
      .select({
        id: grades.id,
        score: grades.score,
        status: grades.status,
        remarks: grades.remarks,
        gradedAt: grades.gradedAt,
        student: {
          id: students.id,
          studentId: students.studentId,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
        },
        assessment: {
          id: assessments.id,
          name: assessments.name,
          category: assessments.category,
          maxScore: assessments.maxScore,
          weight: assessments.weight,
          subject: {
            id: subjects.id,
            code: subjects.code,
            title: subjects.title,
          },
        },
      })
      .from(grades)
      .innerJoin(students, eq(grades.studentId, students.id))
      .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
      .innerJoin(subjects, eq(assessments.subjectId, subjects.id))
      .orderBy(desc(grades.gradedAt))
      .limit(limit);

    return recentGrades;
  }

  async getTopPerformers(limit: number = 5): Promise<any[]> {
    const performers = await db
      .select({
        student: {
          id: students.id,
          studentId: students.studentId,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
        },
        averageScore: sql<number>`avg(${grades.score}::numeric)::float`,
      })
      .from(grades)
      .innerJoin(students, eq(grades.studentId, students.id))
      .groupBy(students.id, students.studentId, students.firstName, students.lastName, students.email)
      .orderBy(desc(sql`avg(${grades.score}::numeric)`))
      .limit(limit);

    return performers;
  }
}

export const storage = new DatabaseStorage();
