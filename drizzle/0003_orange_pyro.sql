CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int,
	`academicYear` varchar(9) NOT NULL,
	`totalAllocation` int NOT NULL,
	`remainingBalance` int NOT NULL,
	`status` enum('draft','pending_approval','approved','closed') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improvementPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL,
	`inspectionId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`recommendations` json NOT NULL,
	`status` enum('draft','active','completed','overdue') NOT NULL DEFAULT 'draft',
	`startDate` timestamp,
	`targetDate` timestamp,
	`completedDate` timestamp,
	`overallProgress` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `improvementPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspectionTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('curriculum','infrastructure','safety','administration','teaching_quality','general') NOT NULL,
	`formSchema` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspectionTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL,
	`templateId` int NOT NULL,
	`supervisorId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`completedDate` timestamp,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`formData` json,
	`overallScore` int,
	`summary` text,
	`recommendations` text,
	`principalAcknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseRequisitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int,
	`budgetId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`items` json NOT NULL,
	`totalEstimatedCost` int NOT NULL,
	`justification` text,
	`status` enum('draft','submitted','under_review','approved','rejected','bid_invited','bid_evaluated','awarded','completed','cancelled') NOT NULL DEFAULT 'draft',
	`vendorId` int,
	`actualCost` int,
	`submittedBy` int NOT NULL,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewComment` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseRequisitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salaryRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`grossPay` int NOT NULL,
	`epfDeduction` int NOT NULL DEFAULT 0,
	`etfDeduction` int NOT NULL DEFAULT 0,
	`taxDeduction` int NOT NULL DEFAULT 0,
	`otherDeductions` int NOT NULL DEFAULT 0,
	`netPay` int NOT NULL,
	`payslipUrl` text,
	`status` enum('draft','processed','paid') NOT NULL DEFAULT 'draft',
	`processedBy` int,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salaryRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schoolScorecards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolId` int NOT NULL,
	`academicYear` varchar(9) NOT NULL,
	`overallScore` int NOT NULL,
	`componentScores` json NOT NULL,
	`inspectionCount` int NOT NULL DEFAULT 0,
	`improvementPlanCount` int NOT NULL DEFAULT 0,
	`rank` int,
	`notes` text,
	`generatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schoolScorecards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int NOT NULL,
	`type` enum('income','expenditure') NOT NULL,
	`category` enum('salary','stationery','maintenance','utilities','transport','equipment','training','grants','fees','donations','other') NOT NULL,
	`amount` int NOT NULL,
	`description` text NOT NULL,
	`referenceNumber` varchar(64),
	`receiptUrl` text,
	`transactionDate` timestamp NOT NULL,
	`recordedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`registrationNumber` varchar(64),
	`contactPerson` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`category` enum('stationery','equipment','furniture','construction','services','food','transport','other') NOT NULL,
	`rating` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
