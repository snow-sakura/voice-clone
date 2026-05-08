CREATE TABLE `cloned_voices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`speaker_id` text,
	`model` text DEFAULT 'V3' NOT NULL,
	`task_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`demo_audio_url` text,
	`audio_file_path` text,
	`error_message` text,
	`created_at` text DEFAULT '(datetime(''now''))' NOT NULL,
	`updated_at` text DEFAULT '(datetime(''now''))' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cloned_voices_speaker_id_unique` ON `cloned_voices` (`speaker_id`);