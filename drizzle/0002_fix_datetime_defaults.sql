PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_activities`("id", "user_id", "type", "description", "metadata", "created_at") SELECT "id", "user_id", "type", "description", "metadata", "created_at" FROM `activities`;--> statement-breakpoint
DROP TABLE `activities`;--> statement-breakpoint
ALTER TABLE `__new_activities` RENAME TO `activities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_cloned_voices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`voice_id` text,
	`model` text DEFAULT 'qwen-voice-enrollment' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`demo_audio_url` text,
	`audio_file_path` text,
	`error_message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_cloned_voices`("id", "user_id", "name", "voice_id", "model", "status", "demo_audio_url", "audio_file_path", "error_message", "created_at", "updated_at") SELECT "id", "user_id", "name", "voice_id", "model", "status", "demo_audio_url", "audio_file_path", "error_message", "created_at", "updated_at" FROM `cloned_voices`;--> statement-breakpoint
DROP TABLE `cloned_voices`;--> statement-breakpoint
ALTER TABLE `__new_cloned_voices` RENAME TO `cloned_voices`;--> statement-breakpoint
CREATE UNIQUE INDEX `cloned_voices_voice_id_unique` ON `cloned_voices` (`voice_id`);--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "token", "expires_at", "created_at") SELECT "id", "user_id", "token", "expires_at", "created_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text,
	`avatar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password_hash", "name", "avatar", "created_at", "updated_at") SELECT "id", "email", "password_hash", "name", "avatar", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);