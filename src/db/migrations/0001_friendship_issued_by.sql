ALTER TABLE `friendships` ADD `issued_by_id` text REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade;
--> statement-breakpoint
UPDATE `friendships` SET `issued_by_id` = `user_a_id` WHERE `issued_by_id` IS NULL;
