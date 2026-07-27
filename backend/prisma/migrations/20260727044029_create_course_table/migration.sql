-- CreateTable
CREATE TABLE `courses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `categoryId` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `shortDescription` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `thumbnail` VARCHAR(255) NULL,
    `duration` INTEGER NULL,
    `level` VARCHAR(50) NULL,
    `language` VARCHAR(50) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
