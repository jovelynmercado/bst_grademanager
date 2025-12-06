import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { BinarySearchTree, buildBSTFromStudents } from "./bst";
import {
  insertStudentSchema,
  insertSubjectSchema,
  insertEnrollmentSchema,
  insertAssessmentSchema,
  insertGradeSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      const recentGrades = await storage.getRecentGrades(10);
      const topPerformers = await storage.getTopPerformers(5);

      res.json({
        ...stats,
        recentGrades,
        topPerformers,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      let studentsList;
      if (search && typeof search === "string") {
        studentsList = await storage.searchStudents(search);
      } else {
        studentsList = await storage.getStudents();
      }
      res.json(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req, res) => {
    try {
      const validated = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validated);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.patch("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const validated = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, validated);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteStudent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  app.get("/api/subjects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let subjectsList;
      if (user?.role === "teacher") {
        subjectsList = await storage.getSubjectsByTeacher(userId);
      } else {
        subjectsList = await storage.getSubjects();
      }
      res.json(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.post("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const validated = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validated);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.patch("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const validated = insertSubjectSchema.partial().parse(req.body);
      const subject = await storage.updateSubject(req.params.id, validated);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating subject:", error);
      res.status(500).json({ message: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteSubject(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const { studentId, subjectId } = req.query;
      let enrollmentsList;
      
      if (studentId && typeof studentId === "string") {
        enrollmentsList = await storage.getEnrollmentsByStudent(studentId);
      } else if (subjectId && typeof subjectId === "string") {
        enrollmentsList = await storage.getEnrollmentsBySubject(subjectId);
      } else {
        enrollmentsList = await storage.getEnrollments();
      }
      res.json(enrollmentsList);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const validated = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(validated);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.delete("/api/enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteEnrollment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  app.get("/api/assessments", isAuthenticated, async (req, res) => {
    try {
      const { subjectId } = req.query;
      let assessmentsList;
      
      if (subjectId && typeof subjectId === "string") {
        assessmentsList = await storage.getAssessmentsBySubject(subjectId);
      } else {
        assessmentsList = await storage.getAssessments();
      }
      res.json(assessmentsList);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get("/api/assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.post("/api/assessments", isAuthenticated, async (req, res) => {
    try {
      const validated = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(validated);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.patch("/api/assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const validated = insertAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateAssessment(req.params.id, validated);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.delete("/api/assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteAssessment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ message: "Failed to delete assessment" });
    }
  });

  app.get("/api/grades", isAuthenticated, async (req, res) => {
    try {
      const { studentId, assessmentId } = req.query;
      let gradesList;
      
      if (studentId && typeof studentId === "string") {
        gradesList = await storage.getGradesByStudent(studentId);
      } else if (assessmentId && typeof assessmentId === "string") {
        gradesList = await storage.getGradesByAssessment(assessmentId);
      } else {
        gradesList = await storage.getGrades();
      }
      res.json(gradesList);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.get("/api/grades/:id", isAuthenticated, async (req, res) => {
    try {
      const grade = await storage.getGrade(req.params.id);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.json(grade);
    } catch (error) {
      console.error("Error fetching grade:", error);
      res.status(500).json({ message: "Failed to fetch grade" });
    }
  });

  app.post("/api/grades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertGradeSchema.parse({
        ...req.body,
        gradedBy: userId,
      });
      const grade = await storage.createGrade(validated);
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  app.patch("/api/grades/:id", isAuthenticated, async (req, res) => {
    try {
      const validated = insertGradeSchema.partial().parse(req.body);
      const grade = await storage.updateGrade(req.params.id, validated);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating grade:", error);
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.delete("/api/grades/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteGrade(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Grade not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting grade:", error);
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

  app.post("/api/bst/build", isAuthenticated, async (req, res) => {
    try {
      const { keyType } = req.body;
      const studentsList = await storage.getStudents();
      
      const bst = buildBSTFromStudents(
        studentsList.map(s => ({
          id: s.id,
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
        })),
        keyType || "studentId"
      );

      res.json(bst.toVisualizationData());
    } catch (error) {
      console.error("Error building BST:", error);
      res.status(500).json({ message: "Failed to build BST" });
    }
  });

  app.post("/api/bst/search", isAuthenticated, async (req, res) => {
    try {
      const { key, keyType } = req.body;
      const studentsList = await storage.getStudents();
      
      const bst = buildBSTFromStudents(
        studentsList.map(s => ({
          id: s.id,
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
        })),
        keyType || "studentId"
      );

      const result = bst.search(key);
      res.json({
        ...bst.toVisualizationData(),
        searchResult: result.node,
        lastOperation: result.operation,
      });
    } catch (error) {
      console.error("Error searching BST:", error);
      res.status(500).json({ message: "Failed to search BST" });
    }
  });

  app.post("/api/bst/traverse", isAuthenticated, async (req, res) => {
    try {
      const { type, keyType } = req.body;
      const studentsList = await storage.getStudents();
      
      const bst = buildBSTFromStudents(
        studentsList.map(s => ({
          id: s.id,
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
        })),
        keyType || "studentId"
      );

      let result;
      switch (type) {
        case "preorder":
          result = bst.preorderTraversal();
          break;
        case "postorder":
          result = bst.postorderTraversal();
          break;
        case "inorder":
        default:
          result = bst.inorderTraversal();
          break;
      }

      res.json({
        ...bst.toVisualizationData(),
        traversalOrder: result.order,
        lastOperation: result.operation,
      });
    } catch (error) {
      console.error("Error traversing BST:", error);
      res.status(500).json({ message: "Failed to traverse BST" });
    }
  });

  app.get("/api/analytics/grade-distribution", isAuthenticated, async (req, res) => {
    try {
      const allGrades = await storage.getRecentGrades(1000);
      
      const distribution = {
        "90-100": 0,
        "80-89": 0,
        "70-79": 0,
        "60-69": 0,
        "Below 60": 0,
      };

      for (const grade of allGrades) {
        const percentage = (Number(grade.score) / Number(grade.assessment.maxScore)) * 100;
        if (percentage >= 90) distribution["90-100"]++;
        else if (percentage >= 80) distribution["80-89"]++;
        else if (percentage >= 70) distribution["70-79"]++;
        else if (percentage >= 60) distribution["60-69"]++;
        else distribution["Below 60"]++;
      }

      res.json(Object.entries(distribution).map(([range, count]) => ({
        range,
        count,
      })));
    } catch (error) {
      console.error("Error fetching grade distribution:", error);
      res.status(500).json({ message: "Failed to fetch grade distribution" });
    }
  });

  app.get("/api/analytics/subject-performance", isAuthenticated, async (req, res) => {
    try {
      const allGrades = await storage.getRecentGrades(1000);
      
      const subjectStats: Record<string, { total: number; count: number; maxTotal: number }> = {};

      for (const grade of allGrades) {
        const subjectTitle = grade.assessment.subject.title;
        if (!subjectStats[subjectTitle]) {
          subjectStats[subjectTitle] = { total: 0, count: 0, maxTotal: 0 };
        }
        subjectStats[subjectTitle].total += Number(grade.score);
        subjectStats[subjectTitle].maxTotal += Number(grade.assessment.maxScore);
        subjectStats[subjectTitle].count++;
      }

      res.json(
        Object.entries(subjectStats).map(([subject, stats]) => ({
          subject,
          averagePercentage: stats.maxTotal > 0 ? (stats.total / stats.maxTotal) * 100 : 0,
          gradeCount: stats.count,
        }))
      );
    } catch (error) {
      console.error("Error fetching subject performance:", error);
      res.status(500).json({ message: "Failed to fetch subject performance" });
    }
  });

  app.get("/api/analytics/assessment-stats", isAuthenticated, async (req, res) => {
    try {
      const allGrades = await storage.getRecentGrades(1000);
      
      const assessmentStats: Record<string, { scores: number[]; maxScore: number; name: string }> = {};

      for (const grade of allGrades) {
        const assessmentId = grade.assessment.id;
        if (!assessmentStats[assessmentId]) {
          assessmentStats[assessmentId] = {
            scores: [],
            maxScore: Number(grade.assessment.maxScore),
            name: grade.assessment.name,
          };
        }
        assessmentStats[assessmentId].scores.push(Number(grade.score));
      }

      res.json(
        Object.entries(assessmentStats).map(([id, stats]) => {
          const avg = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
          const min = Math.min(...stats.scores);
          const max = Math.max(...stats.scores);
          return {
            id,
            name: stats.name,
            average: avg,
            min,
            max,
            maxScore: stats.maxScore,
            submissions: stats.scores.length,
          };
        })
      );
    } catch (error) {
      console.error("Error fetching assessment stats:", error);
      res.status(500).json({ message: "Failed to fetch assessment stats" });
    }
  });

  return httpServer;
}
