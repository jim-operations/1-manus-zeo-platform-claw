CREATE TABLE `announcement_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcement_reads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` enum('general','urgent','circular','event','holiday','exam','training','other') NOT NULL DEFAULT 'general',
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`authorId` int NOT NULL,
	`targetAudience` json,
	`targetSchoolIds` json,
	`attachmentUrl` text,
	`isPublished` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`expiresAt` timestamp,
	`isPinned` boolean NOT NULL DEFAULT false,
	`readCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(20),
	`description` text,
	`headId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `leave_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`year` int NOT NULL,
	`casualTotal` int NOT NULL DEFAULT 7,
	`casualUsed` int NOT NULL DEFAULT 0,
	`sickTotal` int NOT NULL DEFAULT 21,
	`sickUsed` int NOT NULL DEFAULT 0,
	`annualTotal` int NOT NULL DEFAULT 14,
	`annualUsed` int NOT NULL DEFAULT 0,
	`dutyTotal` int NOT NULL DEFAULT 0,
	`dutyUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`leaveType` enum('casual','sick','annual','maternity','paternity','duty','study','no_pay','other') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`numberOfDays` int NOT NULL,
	`reason` text,
	`status` enum('draft','pending','approved_by_principal','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`appliedAt` timestamp,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewerComment` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`approverComment` text,
	`documentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(255),
	`createdBy` int NOT NULL,
	`isGroup` boolean NOT NULL DEFAULT false,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`attachmentUrl` text,
	`isEdited` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` enum('info','success','warning','error','leave_update','transfer_update','announcement','message','system') NOT NULL DEFAULT 'info',
	`channel` enum('in_app','email','sms','push') NOT NULL DEFAULT 'in_app',
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_development` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`programName` varchar(255) NOT NULL,
	`programType` enum('workshop','seminar','conference','course','certification','other') NOT NULL,
	`provider` varchar(255),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`durationHours` int,
	`certificateUrl` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professional_development_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(20),
	`type` enum('1AB','1C','2','3'),
	`address` text,
	`district` varchar(100),
	`division` varchar(100),
	`principalId` int,
	`studentCount` int DEFAULT 0,
	`teacherCount` int DEFAULT 0,
	`phone` varchar(20),
	`email` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `service_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`eventType` enum('appointment','transfer','promotion','confirmation','increment','disciplinary','training','award','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`effectiveDate` timestamp NOT NULL,
	`endDate` timestamp,
	`fromSchoolId` int,
	`toSchoolId` int,
	`fromDesignation` varchar(255),
	`toDesignation` varchar(255),
	`documentUrl` text,
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nic` varchar(20),
	`fullName` varchar(255) NOT NULL,
	`initials` varchar(100),
	`dateOfBirth` timestamp,
	`gender` enum('male','female','other'),
	`maritalStatus` enum('single','married','divorced','widowed'),
	`address` text,
	`phone` varchar(20),
	`personalEmail` varchar(320),
	`designation` varchar(255),
	`subjectSpecialization` varchar(255),
	`qualifications` json,
	`schoolId` int,
	`departmentId` int,
	`appointmentDate` timestamp,
	`confirmationDate` timestamp,
	`retirementDate` timestamp,
	`salaryStep` varchar(20),
	`epfNumber` varchar(20),
	`etfNumber` varchar(20),
	`bankName` varchar(100),
	`bankBranch` varchar(100),
	`bankAccountNumber` varchar(50),
	`emergencyContactName` varchar(255),
	`emergencyContactPhone` varchar(20),
	`profilePictureUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_profiles_nic_unique` UNIQUE(`nic`)
);
--> statement-breakpoint
CREATE TABLE `thread_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`userId` int NOT NULL,
	`lastReadAt` timestamp,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `thread_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transfer_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`currentSchoolId` int NOT NULL,
	`requestedSchoolId` int,
	`reason` text,
	`status` enum('draft','pending','recommended_by_principal','reviewed_by_branch','approved','rejected','completed') NOT NULL DEFAULT 'draft',
	`workflowState` varchar(50) DEFAULT 'initiated',
	`principalRecommendation` text,
	`principalRecommendedAt` timestamp,
	`branchReview` text,
	`branchReviewedAt` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`approverComment` text,
	`effectiveDate` timestamp,
	`documentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transfer_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('zonal_director','deputy_director','branch_head','isa','principal','teacher','parent','student','admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `departmentId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` enum('en','si','ta') DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;