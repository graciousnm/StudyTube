DELETE FROM `notes` WHERE `id` NOT IN (SELECT MAX(`id`) FROM `notes` GROUP BY `lesson_id`);--> statement-breakpoint
DROP INDEX `notes_lesson_id_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `notes_lesson_id_uq` ON `notes` (`lesson_id`);