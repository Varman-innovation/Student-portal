CREATE TABLE `webinar_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`phone` text NOT NULL,
	`upstream_student_id` text NOT NULL,
	`source` text,
	`campaign` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webinar_registrations_phone` ON `webinar_registrations` (`phone`);