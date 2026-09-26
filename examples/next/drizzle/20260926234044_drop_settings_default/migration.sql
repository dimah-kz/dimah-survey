PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_survey` (
	`id` text(255) PRIMARY KEY,
	`slug` text(255) NOT NULL,
	`status` text NOT NULL,
	`draft_json` blob NOT NULL,
	`published_json` blob,
	`published_at` integer,
	`settings` blob NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT "survey_status_check" CHECK("status" in ('draft', 'active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_survey`(`id`, `slug`, `status`, `draft_json`, `published_json`, `published_at`, `settings`, `created_at`, `updated_at`) SELECT `id`, `slug`, `status`, `draft_json`, `published_json`, `published_at`, `settings`, `created_at`, `updated_at` FROM `survey`;--> statement-breakpoint
DROP TABLE `survey`;--> statement-breakpoint
ALTER TABLE `__new_survey` RENAME TO `survey`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `survey_slug_unique` ON `survey` (`slug`);--> statement-breakpoint
CREATE INDEX `survey_status_updated_at_idx` ON `survey` (`status`,`updated_at`);