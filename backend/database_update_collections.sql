-- Crear tabla de invitaciones pendientes por email
CREATE TABLE `collection_invitations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `collectionId` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role` ENUM('CREATOR', 'EDITOR', 'VIEWER') NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `collection_invitations_collectionId_email_key` (`collectionId`, `email`),
  CONSTRAINT `collection_invitations_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `collections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
