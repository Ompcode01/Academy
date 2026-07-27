/*
  Warnings:

  - A unique constraint covering the columns `[departmentName]` on the table `departments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `user_accounts_username_idx` ON `user_accounts`;

-- AlterTable
ALTER TABLE `employees` MODIFY `joiningDate` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `departments_departmentName_key` ON `departments`(`departmentName`);

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assignedBy_fkey` FOREIGN KEY (`assignedBy`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
