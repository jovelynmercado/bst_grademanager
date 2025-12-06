-- grade_manager_mysql.sql
-- Creates DB and tables for the BST-Based Student Grade Management System
-- Charset uses utf8mb4, InnoDB for transactions.

DROP DATABASE IF EXISTS `grade_manager`;
CREATE DATABASE `grade_manager` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `grade_manager`;

-- Users table (admins, teachers, students)
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `password_hash` VARCHAR(255),
  `temp_password` VARCHAR(255),
  `first_name` VARCHAR(120),
  `last_name` VARCHAR(120),
  `profile_image_url` VARCHAR(512),
  `role` ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students table
CREATE TABLE `students` (
  `id` CHAR(36) NOT NULL,
  `student_id` VARCHAR(100) NOT NULL,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `user_id` CHAR(36),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_students_student_id` (`student_id`),
  UNIQUE KEY `UQ_students_email` (`email`),
  KEY `IDX_student_student_id` (`student_id`),
  KEY `IDX_student_email` (`email`),
  CONSTRAINT `FK_students_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects table
CREATE TABLE `subjects` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `teacher_id` CHAR(36),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_subjects_code` (`code`),
  KEY `IDX_subject_code` (`code`),
  CONSTRAINT `FK_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enrollments table
CREATE TABLE `enrollments` (
  `id` CHAR(36) NOT NULL,
  `student_id` CHAR(36) NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `enrolled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `IDX_enrollment_student` (`student_id`),
  KEY `IDX_enrollment_subject` (`subject_id`),
  CONSTRAINT `FK_enrollment_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_enrollment_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assessments table
CREATE TABLE `assessments` (
  `id` CHAR(36) NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` ENUM('quiz','exam','project','assignment','participation') NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL,
  `max_score` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `due_date` DATETIME,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_assessment_subject` (`subject_id`),
  CONSTRAINT `FK_assessment_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grades table
CREATE TABLE `grades` (
  `id` CHAR(36) NOT NULL,
  `student_id` CHAR(36) NOT NULL,
  `assessment_id` CHAR(36) NOT NULL,
  `score` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending','submitted','approved') NOT NULL DEFAULT 'submitted',
  `remarks` TEXT,
  `graded_by` CHAR(36),
  `graded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_grade_student` (`student_id`),
  KEY `IDX_grade_assessment` (`assessment_id`),
  KEY `IDX_grade_score` (`score`),
  CONSTRAINT `FK_grade_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_grade_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_grade_grader` FOREIGN KEY (`graded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grade history for versioning
CREATE TABLE `grade_history` (
  `id` CHAR(36) NOT NULL,
  `grade_id` CHAR(36) NOT NULL,
  `previous_score` DECIMAL(10,2),
  `new_score` DECIMAL(10,2),
  `changed_by` CHAR(36),
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `note` TEXT,
  PRIMARY KEY (`id`),
  KEY `IDX_history_grade` (`grade_id`),
  CONSTRAINT `FK_history_grade` FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Terms table (for archiving)
CREATE TABLE `terms` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `start_date` DATE,
  `end_date` DATE,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity logs
CREATE TABLE `activity_logs` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `action` VARCHAR(255) NOT NULL,
  `entity` VARCHAR(255),
  `entity_id` VARCHAR(255),
  `details` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_activity_user` (`user_id`),
  CONSTRAINT `FK_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Simple indexes on commonly queried fields
CREATE INDEX IDX_students_studentid ON students (`student_id`);
CREATE INDEX IDX_subjects_code ON subjects (`code`);
CREATE INDEX IDX_assessments_subject ON assessments (`subject_id`);
CREATE INDEX IDX_grades_student ON grades (`student_id`);
CREATE INDEX IDX_grades_assessment ON grades (`assessment_id`);

-- Sample seed data (replace temp_password and set real password hashes later)
-- Admin
INSERT INTO `users` (`id`, `email`, `temp_password`, `first_name`, `last_name`, `role`)
VALUES (UUID(), 'admin@gmail.com', 'admin123', 'Site','Admin', 'admin');

-- Teacher (optional)
INSERT INTO `users` (`id`, `email`, `temp_password`, `first_name`, `last_name`, `role`)
VALUES (UUID(), 'teacher@example.com', 'teacher123', 'Jane','Teacher', 'teacher');

-- Student (domain @hcdc.edu.ph)
INSERT INTO `users` (`id`, `email`, `temp_password`, `first_name`, `last_name`, `role`)
VALUES (UUID(), 'student1@hcdc.edu.ph', 'student123', 'John','Student', 'student');

-- create a student row linked to that user
INSERT INTO `students` (`id`, `student_id`, `first_name`, `last_name`, `email`, `user_id`)
VALUES (UUID(), 'S2025002', 'John', 'Student', 'student1@hcdc.edu.ph',
  (SELECT id FROM users WHERE email='student1@hcdc.edu.ph' LIMIT 1)
);

-- Example subject and assessment
INSERT INTO `subjects` (`id`, `code`, `title`, `description`, `teacher_id`)
VALUES (UUID(), 'MATH101', 'Calculus I', 'Intro to calculus',
  (SELECT id FROM users WHERE email='teacher@example.com' LIMIT 1)
);

INSERT INTO `assessments` (`id`, `subject_id`, `name`, `category`, `weight`, `max_score`)
VALUES (UUID(),
  (SELECT id FROM subjects WHERE code='MATH101' LIMIT 1),
  'Midterm Exam', 'exam', 40.00, 100.00
);

-- Example grade row
INSERT INTO `grades` (`id`, `student_id`, `assessment_id`, `score`, `status`, `graded_by`)
VALUES (UUID(),
  (SELECT id FROM students WHERE student_id='S2025002' LIMIT 1),
  (SELECT id FROM assessments WHERE name='Midterm Exam' LIMIT 1),
  85.00, 'submitted',
  (SELECT id FROM users WHERE email='teacher@example.com' LIMIT 1)
);

-- End of file
-- grade_manager_mysql.sql
-- Creates DB and tables for the BST-Based Student Grade Management System
-- Charset uses utf8mb4, InnoDB for transactions.

DROP DATABASE IF EXISTS `grade_manager`;
CREATE DATABASE `grade_manager` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `grade_manager`;

-- Users table (admins, teachers, students)
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) UNIQUE,
  `password_hash` VARCHAR(255),
  `temp_password` VARCHAR(255), -- optional temporary plaintext (delete later)
  `first_name` VARCHAR(120),
  `last_name` VARCHAR(120),
  `profile_image_url` VARCHAR(512),
  `role` ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students table
CREATE TABLE `students` (
  `id` CHAR(36) NOT NULL,
  `student_id` VARCHAR(100) NOT NULL,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `user_id` CHAR(36),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_students_student_id` (`student_id`),
  UNIQUE KEY `UQ_students_email` (`email`),
  KEY `IDX_student_student_id` (`student_id`),
  KEY `IDX_student_email` (`email`),
  CONSTRAINT `FK_students_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects table
CREATE TABLE `subjects` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `teacher_id` CHAR(36),
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_subjects_code` (`code`),
  KEY `IDX_subject_code` (`code`),
  CONSTRAINT `FK_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enrollments table
CREATE TABLE `enrollments` (
  `id` CHAR(36) NOT NULL,
  `student_id` CHAR(36) NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `enrolled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `IDX_enrollment_student` (`student_id`),
  KEY `IDX_enrollment_subject` (`subject_id`),
  CONSTRAINT `FK_enrollment_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_enrollment_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assessments table
CREATE TABLE `assessments` (
  `id` CHAR(36) NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` ENUM('quiz','exam','project','assignment','participation') NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL,
  `max_score` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `due_date` DATETIME,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_assessment_subject` (`subject_id`),
  CONSTRAINT `FK_assessment_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grades table
CREATE TABLE `grades` (
  `id` CHAR(36) NOT NULL,
  `student_id` CHAR(36) NOT NULL,
  `assessment_id` CHAR(36) NOT NULL,
  `score` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending','submitted','approved') NOT NULL DEFAULT 'submitted',
  `remarks` TEXT,
  `graded_by` CHAR(36),
  `graded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_grade_student` (`student_id`),
  KEY `IDX_grade_assessment` (`assessment_id`),
  KEY `IDX_grade_score` (`score`),
  CONSTRAINT `FK_grade_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_grade_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_grade_grader` FOREIGN KEY (`graded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grade history for versioning
CREATE TABLE `grade_history` (
  `id` CHAR(36) NOT NULL,
  `grade_id` CHAR(36) NOT NULL,
  `previous_score` DECIMAL(10,2),
  `new_score` DECIMAL(10,2),
  `changed_by` CHAR(36),
  `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `note` TEXT,
  PRIMARY KEY (`id`),
  KEY `IDX_history_grade` (`grade_id`),
  CONSTRAINT `FK_history_grade` FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Terms table (for archiving)
CREATE TABLE `terms` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `start_date` DATE,
  `end_date` DATE,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity logs
CREATE TABLE `activity_logs` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `action` VARCHAR(255) NOT NULL,
  `entity` VARCHAR(255),
  `entity_id` VARCHAR(255),
  `details` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_activity_user` (`user_id`),
  CONSTRAINT `FK_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Simple indexes on commonly queried fields
CREATE INDEX IDX_students_studentid ON students (`student_id`);
CREATE INDEX IDX_subjects_code ON subjects (`code`);
CREATE INDEX IDX_assessments_subject ON assessments (`subject_id`);
CREATE INDEX IDX_grades_student ON grades (`student_id`);
CREATE INDEX IDX_grades_assessment ON grades (`assessment_id`);

-- Sample seed data (replace temp_password and set real password hashes later)
INSERT INTO `users` (`id`, `email`, `temp_password`, `first_name`, `last_name`, `role`)
VALUES (UUID(), 'admin@example.com', 'admin123', 'Site','Admin', 'admin');

INSERT INTO `users` (`id`, `email`, `temp_password`, `first_name`, `last_name`, `role`)
VALUES (UUID(), 'teacher@example.com', 'teacher123', 'Jane','Teacher', 'teacher');

-- seed a student user and student record
INSERT INTO `users` (`id`, `email`, `temp_password`, `first_name`, `last_name`, `role`)
VALUES (UUID(), 'student1@example.com', 'student123', 'John','Student', 'student');

-- create a student row linked to that user (we need to fetch the user's id)
INSERT INTO `students` (`id`, `student_id`, `first_name`, `last_name`, `email`, `user_id`)
VALUES (UUID(), 'S2025001', 'John', 'Student', 'student1@example.com',
  (SELECT id FROM users WHERE email='student1@example.com' LIMIT 1)
);

-- Example subject and assessment
INSERT INTO `subjects` (`id`, `code`, `title`, `description`, `teacher_id`)
VALUES (UUID(), 'MATH101', 'Calculus I', 'Intro to calculus',
  (SELECT id FROM users WHERE email='teacher@example.com' LIMIT 1)
);

INSERT INTO `assessments` (`id`, `subject_id`, `name`, `category`, `weight`, `max_score`)
VALUES (UUID(),
  (SELECT id FROM subjects WHERE code='MATH101' LIMIT 1),
  'Midterm Exam', 'exam', 40.00, 100.00
);

-- Example grade row
INSERT INTO `grades` (`id`, `student_id`, `assessment_id`, `score`, `status`, `graded_by`)
VALUES (UUID(),
  (SELECT id FROM students WHERE student_id='S2025001' LIMIT 1),
  (SELECT id FROM assessments WHERE name='Midterm Exam' LIMIT 1),
  85.00, 'submitted',
  (SELECT id FROM users WHERE email='teacher@example.com' LIMIT 1)
);

-- End of file