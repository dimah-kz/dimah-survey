CREATE TABLE `private_dimah_survey_settings` (
	`id` text(255) PRIMARY KEY,
	`version` text(255) DEFAULT '1.0.0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `response` (
	`id` text(255) PRIMARY KEY,
	`survey_id` text(255) NOT NULL,
	`respondent_id` text(255),
	`status` text NOT NULL,
	`definition` blob NOT NULL,
	`data` blob NOT NULL,
	`submitted_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `response_survey_fk` FOREIGN KEY (`survey_id`) REFERENCES `survey`(`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT "response_status_check" CHECK("status" in ('draft', 'submitted', 'abandoned'))
);
--> statement-breakpoint
CREATE TABLE `survey` (
	`id` text(255) PRIMARY KEY,
	`slug` text(255) NOT NULL,
	`status` text NOT NULL,
	`draft_json` blob NOT NULL,
	`published_json` blob,
	`published_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT "survey_status_check" CHECK("status" in ('draft', 'active', 'archived'))
);
--> statement-breakpoint
CREATE INDEX `response_survey_id_updated_at_idx` ON `response` (`survey_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `response_respondent_lookup_idx` ON `response` (`survey_id`,`respondent_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `response_one_open_draft` ON `response` (`survey_id`,`respondent_id`) WHERE "response"."status" = 'draft' and "response"."respondent_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `survey_slug_unique` ON `survey` (`slug`);--> statement-breakpoint
CREATE INDEX `survey_status_updated_at_idx` ON `survey` (`status`,`updated_at`);