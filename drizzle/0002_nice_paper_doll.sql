CREATE TABLE `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`schoolId` int NOT NULL,
	`date` timestamp NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL,
	`markedBy` int NOT NULL,
	`remarks` text,
	`syncedAt` timestamp,
	`deviceId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`schoolId` int NOT NULL,
	`academicYear` int NOT NULL,
	`grade` varchar(10) NOT NULL,
	`classSection` varchar(10),
	`medium` enum('sinhala','tamil','english') DEFAULT 'sinhala',
	`status` enum('active','transferred','graduated','dropped_out','suspended') NOT NULL DEFAULT 'active',
	`enrollmentDate` timestamp NOT NULL DEFAULT (now()),
	`leavingDate` timestamp,
	`leavingReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`enrollmentId` int,
	`subjectId` int NOT NULL,
	`academicYear` int NOT NULL,
	`term` enum('term_1','term_2','term_3') NOT NULL,
	`assessmentType` enum('class_test','term_exam','practical','assignment','project','other') NOT NULL,
	`assessmentName` varchar(255),
	`maxMarks` int NOT NULL DEFAULT 100,
	`obtainedMarks` int,
	`gradeSymbol` varchar(5),
	`remarks` text,
	`enteredBy` int NOT NULL,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scholarship_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`studentId` int NOT NULL,
	`schoolId` int NOT NULL,
	`status` enum('applied','under_review','shortlisted','awarded','rejected','withdrawn') NOT NULL DEFAULT 'applied',
	`applicationDate` timestamp NOT NULL DEFAULT (now()),
	`supportingDocuments` json,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewComment` text,
	`awardedAmount` int,
	`awardedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scholarship_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scholarship_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`provider` varchar(255),
	`eligibilityCriteria` text,
	`amount` int,
	`frequency` enum('one_time','monthly','annual') DEFAULT 'annual',
	`academicYear` int,
	`applicationDeadline` timestamp,
	`maxRecipients` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scholarship_programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admissionNumber` varchar(30),
	`fullName` varchar(255) NOT NULL,
	`nameWithInitials` varchar(150),
	`dateOfBirth` timestamp,
	`gender` enum('male','female','other'),
	`nationality` varchar(100) DEFAULT 'Sri Lankan',
	`religion` varchar(100),
	`address` text,
	`phone` varchar(20),
	`email` varchar(320),
	`parentGuardianInfo` json,
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(20),
	`healthRecords` json,
	`previousSchool` varchar(255),
	`profilePictureUrl` text,
	`userId` int,
	`parentUserId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_admissionNumber_unique` UNIQUE(`admissionNumber`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(20),
	`medium` enum('sinhala','tamil','english'),
	`gradeLevel` varchar(10),
	`isCompulsory` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_code_unique` UNIQUE(`code`)
);
