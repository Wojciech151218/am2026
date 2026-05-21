CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`display_name` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`home_city` text DEFAULT '' NOT NULL,
	`current_latitude` real,
	`current_longitude` real,
	`current_location_label` text,
	`location_tracking_enabled` integer DEFAULT false NOT NULL,
	`updated_at_iso` text NOT NULL,
	`synced_at_iso` text
);
--> statement-breakpoint
CREATE INDEX `users_updated_at_idx` ON `users` (`updated_at_iso`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`visited_at_iso` text NOT NULL,
	`updated_at_iso` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `locations_user_city_idx` ON `locations` (`user_id`,`city`);--> statement-breakpoint
CREATE INDEX `locations_user_visited_idx` ON `locations` (`user_id`,`visited_at_iso`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_a_id` text NOT NULL,
	`user_b_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at_iso` text NOT NULL,
	`updated_at_iso` text NOT NULL,
	FOREIGN KEY (`user_a_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_b_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `friendships_user_a_status_idx` ON `friendships` (`user_a_id`,`status`);--> statement-breakpoint
CREATE INDEX `friendships_user_b_status_idx` ON `friendships` (`user_b_id`,`status`);--> statement-breakpoint
CREATE TABLE `sync_mutations` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at_iso` text NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sync_mutations_status_idx` ON `sync_mutations` (`status`,`created_at_iso`);