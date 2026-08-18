-- Remembers which wizard step an unfinished course was abandoned on, so a
-- cancelled or half-finished creation can be resumed from where it left off.
ALTER TABLE `courses` ADD COLUMN `draftStep` INTEGER NULL;
