-- ============================================================
-- E-DEEN APP - COMPLETE DATABASE SCHEMA
-- ============================================================
-- Description: Complete SQL schema for E-Deen Islamic app
-- Database: MySQL 8.0+
-- Created: 2026-08-21
-- ============================================================

-- Drop tables if exists (for fresh installation)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `habit_completions`;
DROP TABLE IF EXISTS `habits`;
DROP TABLE IF EXISTS `journal_entries`;
DROP TABLE IF EXISTS `reminders`;
DROP TABLE IF EXISTS `user_settings`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `otps`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=not verified, 1=verified',
  `device_token` VARCHAR(500) NULL COMMENT 'FCM token for push notifications',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_is_verified` (`is_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OTP TABLE (Email Verification & Password Reset)
-- ============================================================
CREATE TABLE `otps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `otp` VARCHAR(6) NOT NULL COMMENT '6-digit OTP code',
  `type` ENUM('registration', 'password_reset') NOT NULL DEFAULT 'registration',
  `is_used` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=not used, 1=used',
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_otp_type` (`otp`, `type`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASSWORD RESETS TABLE
-- ============================================================
CREATE TABLE `password_resets` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER SETTINGS TABLE
-- ============================================================
CREATE TABLE `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `prayer_calculation_method` VARCHAR(50) NULL DEFAULT 'MWL' COMMENT 'Prayer time calculation method',
  `prayer_notifications_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `reminder_notifications_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `habit_notifications_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `location_latitude` DECIMAL(10, 8) NULL,
  `location_longitude` DECIMAL(11, 8) NULL,
  `location_name` VARCHAR(255) NULL,
  `timezone` VARCHAR(100) NULL DEFAULT 'UTC',
  `language` VARCHAR(10) NULL DEFAULT 'en',
  `theme` ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'light',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `unique_user_settings` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- HABITS TABLE
-- ============================================================
CREATE TABLE `habits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL COMMENT 'Icon identifier',
  `color` VARCHAR(20) NULL DEFAULT '#F48FB1' COMMENT 'Hex color code',
  `frequency` ENUM('daily', '7_days', '14_days', '21_days', '40_days', '66_days', '90_days') NOT NULL DEFAULT 'daily',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL COMMENT 'Calculated based on frequency',
  `notification_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `notification_time` TIME NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- HABIT COMPLETIONS TABLE
-- ============================================================
CREATE TABLE `habit_completions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `habit_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `completion_date` DATE NOT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `unique_habit_completion` (`habit_id`, `user_id`, `completion_date`),
  INDEX `idx_habit_id` (`habit_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_completion_date` (`completion_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- JOURNAL ENTRIES TABLE
-- ============================================================
CREATE TABLE `journal_entries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NULL,
  `content` LONGTEXT NOT NULL,
  `mood` VARCHAR(50) NULL COMMENT 'Emoji or mood identifier',
  `entry_date` DATE NOT NULL,
  `entry_time` TIME NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_entry_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REMINDERS TABLE
-- ============================================================
CREATE TABLE `reminders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `reminder_type` ENUM('one_time', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'one_time',
  `reminder_date` DATE NULL,
  `reminder_time` TIME NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `repeat_days` JSON NULL COMMENT 'For weekly reminders: [0,1,2,3,4,5,6]',
  `notification_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_reminder_date` (`reminder_date`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Sample User (password: "password123")
INSERT INTO `users` (`name`, `email`, `password`, `is_verified`, `email_verified_at`) VALUES
('Test User', 'test@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW());

-- Sample User Settings
INSERT INTO `user_settings` (`user_id`, `prayer_calculation_method`, `location_name`, `timezone`) VALUES
(1, 'MWL', 'New York', 'America/New_York');

-- ============================================================
-- INDEXES AND OPTIMIZATION
-- ============================================================
-- Additional indexes for better query performance

-- Users table optimization
ALTER TABLE `users` ADD INDEX `idx_created_at` (`created_at`);

-- Habits table optimization  
ALTER TABLE `habits` ADD INDEX `idx_user_active` (`user_id`, `is_active`);
ALTER TABLE `habits` ADD INDEX `idx_frequency` (`frequency`);

-- Habit completions optimization
ALTER TABLE `habit_completions` ADD INDEX `idx_user_date` (`user_id`, `completion_date`);

-- Journal entries optimization
ALTER TABLE `journal_entries` ADD INDEX `idx_user_date` (`user_id`, `entry_date`);

-- Reminders optimization
ALTER TABLE `reminders` ADD INDEX `idx_user_active` (`user_id`, `is_active`);
ALTER TABLE `reminders` ADD INDEX `idx_completed` (`is_completed`);

-- ============================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================

-- Table Comments
ALTER TABLE `users` COMMENT = 'User accounts and authentication';
ALTER TABLE `otps` COMMENT = 'OTP codes for email verification and password reset';
ALTER TABLE `password_resets` COMMENT = 'Password reset tokens';
ALTER TABLE `user_settings` COMMENT = 'User preferences and settings';
ALTER TABLE `habits` COMMENT = 'User habits and their configurations';
ALTER TABLE `habit_completions` COMMENT = 'Daily habit completion records';
ALTER TABLE `journal_entries` COMMENT = 'User journal/diary entries';
ALTER TABLE `reminders` COMMENT = 'User reminders and tasks';

-- ============================================================
-- END OF SCHEMA
-- ============================================================
