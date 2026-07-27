-- CreateTable
CREATE TABLE `learning_contents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sectionId` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `contentType` VARCHAR(50) NOT NULL,
    `contentUrl` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `duration` INTEGER NULL,
    `contentOrder` INTEGER NOT NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `learning_contents_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `learning_contents` ADD CONSTRAINT `learning_contents_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `course_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
