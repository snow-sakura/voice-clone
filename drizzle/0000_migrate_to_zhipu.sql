CREATE TABLE `cloned_voices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`voice_id` text,
	`model` text DEFAULT 'glm-tts-clone' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`demo_audio_url` text,
	`audio_file_path` text,
	`error_message` text,
	`created_at` text DEFAULT '(datetime(''now''))' NOT NULL,
	`updated_at` text DEFAULT '(datetime(''now''))' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cloned_voices_voice_id_unique` ON `cloned_voices` (`voice_id`);