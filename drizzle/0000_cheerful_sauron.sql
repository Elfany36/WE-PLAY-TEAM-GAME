CREATE TABLE `players` (
	`token` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`name` text NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`submitted_at` integer,
	FOREIGN KEY (`room_code`) REFERENCES `rooms`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host_token` text NOT NULL,
	`challenge` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`created_at` integer NOT NULL
);
