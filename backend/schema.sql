-- SeminarHub Relational Database Schema (MySQL)

CREATE DATABASE IF NOT EXISTS `seminar_hub` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `seminar_hub`;

-- 1. Users Table (Stores user profiles and roles)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) PRIMARY KEY, -- Matches Firebase UID or demo identity
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `role` ENUM('Attendee', 'Organizer', 'Admin') NOT NULL DEFAULT 'Attendee',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Seminars Table
CREATE TABLE IF NOT EXISTS `seminars` (
  `id` VARCHAR(255) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `capacity` INT NOT NULL,
  `status` ENUM('Draft', 'Published', 'Closed') NOT NULL DEFAULT 'Draft',
  `organizer_id` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `registered_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Sessions Table (Speaker timelines associated with a seminar)
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(255) PRIMARY KEY,
  `seminar_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `speaker_name` VARCHAR(255) NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  FOREIGN KEY (`seminar_id`) REFERENCES `seminars`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Registrations Table (Links users to booked seminars)
CREATE TABLE IF NOT EXISTS `registrations` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_email` VARCHAR(255) NOT NULL,
  `seminar_id` VARCHAR(255) NOT NULL,
  `seminar_title` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `status` ENUM('registered', 'waitlisted', 'cancelled') NOT NULL DEFAULT 'registered',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `organizer_id` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seminar_id`) REFERENCES `seminars`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Attendances Table (Records actual scan check-ins for sessions)
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` VARCHAR(255) PRIMARY KEY,
  `registration_id` VARCHAR(255) NOT NULL,
  `session_id` VARCHAR(255) NOT NULL,
  `seminar_id` VARCHAR(255) NOT NULL,
  `checked_in_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seminar_id`) REFERENCES `seminars`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Performance Indexes
CREATE INDEX idx_seminars_organizer ON `seminars`(`organizer_id`);
CREATE INDEX idx_sessions_seminar ON `sessions`(`seminar_id`);
CREATE INDEX idx_registrations_user ON `registrations`(`user_id`);
CREATE INDEX idx_registrations_seminar ON `registrations`(`seminar_id`);
CREATE INDEX idx_attendances_session ON `attendances`(`session_id`);
