CREATE TABLE `parent_student_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`studentId` int NOT NULL,
	`relationship` enum('father','mother','guardian','other') NOT NULL DEFAULT 'guardian',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`linkedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_student_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_student_unique` UNIQUE(`parentUserId`,`studentId`)
);
--> statement-breakpoint
CREATE TABLE `report_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`enrollmentId` int,
	`academicYear` int NOT NULL,
	`term` enum('term_1','term_2','term_3') NOT NULL,
	`classTeacherRemarks` text,
	`principalRemarks` text,
	`attendanceRate` int,
	`totalMarks` int,
	`averageMarks` int,
	`gradePointAverage` int,
	`rankInClass` int,
	`generatedBy` int NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_cards_student_year_term_unique` UNIQUE(`studentId`,`academicYear`,`term`)
);
--> statement-breakpoint
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_staff_year_unique` UNIQUE(`staffId`,`year`);