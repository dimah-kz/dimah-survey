CREATE TABLE `dimah_survey_version` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`survey_id` text(255) NOT NULL,
	`definition` blob NOT NULL,
	`content_hash` text(64) NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `dimah_survey_version_survey_fk` FOREIGN KEY (`survey_id`) REFERENCES `dimah_survey`(`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
);
--> statement-breakpoint
INSERT INTO `dimah_survey_version` (`id`, `survey_id`, `definition`, `content_hash`, `created_at`)
SELECT lower(hex(randomblob(16))), `survey_id`, `definition`, substr(hex(`definition`), 1, 64), cast((julianday('now') - 2440587.5)*86400000 as integer)
FROM `dimah_response`
GROUP BY `survey_id`, `definition`;
--> statement-breakpoint
INSERT INTO `dimah_survey_version` (`id`, `survey_id`, `definition`, `content_hash`, `created_at`)
SELECT lower(hex(randomblob(16))), `id`, `published_json`, substr(hex(`published_json`), 1, 64), coalesce(`published_at`, cast((julianday('now') - 2440587.5)*86400000 as integer))
FROM `dimah_survey`
WHERE `published_json` IS NOT NULL
AND NOT EXISTS (
	SELECT 1 FROM `dimah_survey_version` AS `version`
	WHERE `version`.`survey_id` = `dimah_survey`.`id`
	AND `version`.`definition` = `dimah_survey`.`published_json`
);
--> statement-breakpoint
ALTER TABLE `dimah_response` ADD `version_id` text(255);
--> statement-breakpoint
UPDATE `dimah_response`
SET `version_id` = (
	SELECT `version`.`id` FROM `dimah_survey_version` AS `version`
	WHERE `version`.`survey_id` = `dimah_response`.`survey_id`
	AND `version`.`definition` = `dimah_response`.`definition`
);
--> statement-breakpoint
ALTER TABLE `dimah_survey` ADD `published_version_id` text(255);
--> statement-breakpoint
UPDATE `dimah_survey`
SET `published_version_id` = (
	SELECT `version`.`id` FROM `dimah_survey_version` AS `version`
	WHERE `version`.`survey_id` = `dimah_survey`.`id`
	AND `version`.`definition` = `dimah_survey`.`published_json`
)
WHERE `published_json` IS NOT NULL;
--> statement-breakpoint
CREATE TABLE `dimah_response_next` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`survey_id` text(255) NOT NULL,
	`respondent_id` text(255),
	`status` text NOT NULL,
	`version_id` text(255) NOT NULL,
	`data` blob NOT NULL,
	`submitted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `dimah_response_survey_fk` FOREIGN KEY (`survey_id`) REFERENCES `dimah_survey`(`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT `dimah_response_version_fk` FOREIGN KEY (`version_id`) REFERENCES `dimah_survey_version`(`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT "dimah_response_status_check" CHECK("status" in ('draft', 'submitted', 'abandoned'))
);
--> statement-breakpoint
INSERT INTO `dimah_response_next` (`id`, `survey_id`, `respondent_id`, `status`, `version_id`, `data`, `submitted_at`, `created_at`, `updated_at`)
SELECT `id`, `survey_id`, `respondent_id`, `status`, `version_id`, `data`, `submitted_at`, `created_at`, `updated_at`
FROM `dimah_response`;
--> statement-breakpoint
DROP TABLE `dimah_response`;
--> statement-breakpoint
ALTER TABLE `dimah_response_next` RENAME TO `dimah_response`;
--> statement-breakpoint
CREATE TABLE `dimah_survey_next` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`slug` text(255) NOT NULL,
	`status` text NOT NULL,
	`draft_json` blob NOT NULL,
	`published_version_id` text(255),
	`published_at` integer,
	`settings` blob NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "dimah_survey_status_check" CHECK("status" in ('draft', 'active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `dimah_survey_next` (`id`, `slug`, `status`, `draft_json`, `published_version_id`, `published_at`, `settings`, `created_at`, `updated_at`)
SELECT `id`, `slug`, `status`, `draft_json`, `published_version_id`, `published_at`, `settings`, `created_at`, `updated_at`
FROM `dimah_survey`;
--> statement-breakpoint
DROP TABLE `dimah_survey`;
--> statement-breakpoint
ALTER TABLE `dimah_survey_next` RENAME TO `dimah_survey`;
--> statement-breakpoint
CREATE UNIQUE INDEX `dimah_survey_slug_unique` ON `dimah_survey` (`slug`);
--> statement-breakpoint
CREATE INDEX `dimah_survey_status_updated_at_idx` ON `dimah_survey` (`status`,`updated_at`);
--> statement-breakpoint
CREATE INDEX `dimah_survey_version_survey_id_created_at_idx` ON `dimah_survey_version` (`survey_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `dimah_response_survey_id_updated_at_idx` ON `dimah_response` (`survey_id`,`updated_at`);
--> statement-breakpoint
CREATE INDEX `dimah_response_respondent_lookup_idx` ON `dimah_response` (`survey_id`,`respondent_id`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `dimah_response_one_open_draft` ON `dimah_response` (`survey_id`,`respondent_id`) WHERE "dimah_response"."status" = 'draft' and "dimah_response"."respondent_id" is not null;
