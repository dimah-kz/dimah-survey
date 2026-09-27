ALTER TABLE `response` RENAME TO `dimah_response`;--> statement-breakpoint
ALTER TABLE `survey` RENAME TO `dimah_survey`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_dimah_response` (
	`id` text(255) PRIMARY KEY,
	`survey_id` text(255) NOT NULL,
	`respondent_id` text(255),
	`status` text NOT NULL,
	`definition` blob NOT NULL,
	`data` blob NOT NULL,
	`submitted_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `dimah_response_survey_fk` FOREIGN KEY (`survey_id`) REFERENCES `dimah_survey`(`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT "dimah_response_status_check" CHECK("status" in ('draft', 'submitted', 'abandoned'))
);
--> statement-breakpoint
INSERT INTO `__new_dimah_response`(`id`, `survey_id`, `respondent_id`, `status`, `definition`, `data`, `submitted_at`, `created_at`, `updated_at`) SELECT `id`, `survey_id`, `respondent_id`, `status`, `definition`, `data`, `submitted_at`, `created_at`, `updated_at` FROM `dimah_response`;--> statement-breakpoint
DROP TABLE `dimah_response`;--> statement-breakpoint
ALTER TABLE `__new_dimah_response` RENAME TO `dimah_response`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_dimah_survey` (
	`id` text(255) PRIMARY KEY,
	`slug` text(255) NOT NULL,
	`status` text NOT NULL,
	`draft_json` blob NOT NULL,
	`published_json` blob,
	`published_at` integer,
	`settings` blob NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT "dimah_survey_status_check" CHECK("status" in ('draft', 'active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_dimah_survey`(`id`, `slug`, `status`, `draft_json`, `published_json`, `published_at`, `settings`, `created_at`, `updated_at`) SELECT `id`, `slug`, `status`, `draft_json`, `published_json`, `published_at`, `settings`, `created_at`, `updated_at` FROM `dimah_survey`;--> statement-breakpoint
DROP TABLE `dimah_survey`;--> statement-breakpoint
ALTER TABLE `__new_dimah_survey` RENAME TO `dimah_survey`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `response_survey_id_updated_at_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `response_respondent_lookup_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `response_one_open_draft`;--> statement-breakpoint
DROP INDEX IF EXISTS `survey_slug_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `survey_status_updated_at_idx`;--> statement-breakpoint
CREATE INDEX `dimah_response_survey_id_updated_at_idx` ON `dimah_response` (`survey_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `dimah_response_respondent_lookup_idx` ON `dimah_response` (`survey_id`,`respondent_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `dimah_response_one_open_draft` ON `dimah_response` (`survey_id`,`respondent_id`) WHERE "dimah_response"."status" = 'draft' and "dimah_response"."respondent_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `dimah_survey_slug_unique` ON `dimah_survey` (`slug`);--> statement-breakpoint
CREATE INDEX `dimah_survey_status_updated_at_idx` ON `dimah_survey` (`status`,`updated_at`);