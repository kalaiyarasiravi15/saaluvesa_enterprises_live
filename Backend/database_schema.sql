-- ====================================================================
-- Saaluvesa Enterprises - Complete Database Schema & Migration SQL
-- Target Database: stsforce_saaluvesadata
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- STEP 1: Create Tables (PascalCase for Linux Webuzo MySQL)
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `AdminUsers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'admin',
  `refresh_token` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `website_link` VARCHAR(255) NULL,
  `image` TEXT NULL,
  `images` TEXT NULL DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ContactSubmissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NULL,
  `address` TEXT NULL,
  `postal_code` VARCHAR(255) NULL,
  `requirement_details` TEXT NOT NULL,
  `status` ENUM('New', 'Responded') DEFAULT 'New',
  `source_product_id` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` ENUM('contact_submission') NOT NULL DEFAULT 'contact_submission',
  `title` VARCHAR(255) NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `contact_submission_id` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SiteSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` TEXT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ExportDocuments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `invoice_no` VARCHAR(255) NOT NULL UNIQUE,
  `sender_name` VARCHAR(255) NULL,
  `sender_email` VARCHAR(255) NULL,
  `sender_address` TEXT NULL,
  `additional_company_details` TEXT NULL,
  `sender_contact` VARCHAR(255) NULL,
  `sender_tax_id` VARCHAR(255) NULL,
  `shipment_date` DATE NULL,
  `shipment_ref_no` VARCHAR(255) NULL,
  `reason_for_export` VARCHAR(255) NULL,
  `type_of_export` VARCHAR(255) NULL,
  `export_license_no` VARCHAR(255) NULL,
  `import_license_no` VARCHAR(255) NULL,
  `incoterms` VARCHAR(255) NULL,
  `currency_code` VARCHAR(255) DEFAULT 'USD',
  `payment_method` VARCHAR(255) NULL,
  `importer_name` VARCHAR(255) NOT NULL,
  `importer_address` TEXT NULL,
  `importer_contact` VARCHAR(255) NULL,
  `importer_email` VARCHAR(255) NULL,
  `importer_tax_id` VARCHAR(255) NULL,
  `receiver_name` VARCHAR(255) NULL,
  `receiver_email` VARCHAR(255) NULL,
  `receiver_address` TEXT NULL,
  `receiver_contact` VARCHAR(255) NULL,
  `receiver_tax_id` VARCHAR(255) NULL,
  `letter_of_credit_no` VARCHAR(255) NULL,
  `customer_po_no` VARCHAR(255) NULL,
  `po_date` DATE NULL,
  `file_number` VARCHAR(255) NULL,
  `mode_of_transportation` VARCHAR(255) NULL,
  `transportation_terms` VARCHAR(255) NULL,
  `awb_bl_no` VARCHAR(255) NULL,
  `no_of_packages` INT NULL,
  `package_description` TEXT NULL,
  `total_gross_weight_unit` VARCHAR(255) NULL,
  `hs_code` VARCHAR(255) NULL,
  `country_of_origin` VARCHAR(255) NULL,
  `other_information_compliance_details` TEXT NULL,
  `signatory_name` VARCHAR(255) NULL,
  `signatory_designation` VARCHAR(255) NULL,
  `total_goods_value` DECIMAL(14,2) DEFAULT 0.00,
  `tax_type` VARCHAR(255) DEFAULT NULL,
  `tax_rate` DECIMAL(6,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) DEFAULT 0.00,
  `tax2_type` VARCHAR(255) DEFAULT NULL,
  `tax2_rate` DECIMAL(6,2) DEFAULT 0.00,
  `tax2_amount` DECIMAL(14,2) DEFAULT 0.00,
  `final_total_amount` DECIMAL(14,2) DEFAULT 0.00,
  `total_amount_words` TEXT NULL,
  `total_net_weight_kg` DECIMAL(14,3) DEFAULT 0.000,
  `total_net_weight_lbs` DECIMAL(14,3) DEFAULT 0.000,
  `status` ENUM('Draft', 'Generated', 'Closed') DEFAULT 'Draft',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ExportDocumentItems` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `export_document_id` INT NULL,
  `hs_code` VARCHAR(255) NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `country_of_origin` VARCHAR(255) NULL,
  `qty` DECIMAL(12,3) NOT NULL,
  `uom` VARCHAR(255) NULL,
  `unit_value` DECIMAL(14,2) NOT NULL,
  `extra_price` DECIMAL(14,2) DEFAULT 0.00,
  `sub_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `unit_net_weight` DECIMAL(14,3) DEFAULT 0.000,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_items_export_document_id` (`export_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ExportDocumentAudits` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `export_document_id` INT NULL,
  `edited_by` INT NULL,
  `edited_field` VARCHAR(255) NOT NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `edited_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audits_export_document_id` (`export_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Labels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `sections` JSON NOT NULL,
  `schema_version` INT NOT NULL DEFAULT 1,
  `revision` INT NOT NULL DEFAULT 1,
  `created_by` INT NOT NULL,
  `updated_by` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- STEP 3: Seed Default Admin User & Settings
-- --------------------------------------------------------------------

-- Admin user (email: admin@saaluvesa.com / password: Admin@2026)
INSERT INTO `AdminUsers` (`id`, `email`, `password_hash`, `role`, `createdAt`, `updatedAt`)
VALUES (1, 'admin@saaluvesa.com', '$2a$12$YNQvh7sSVcToOyXmxxtej.Iq/BvyV69wbV1wWvg1CA/4UPH.F0/jO', 'admin', NOW(), NOW())
ON DUPLICATE KEY UPDATE `email` = 'admin@saaluvesa.com';

-- Default Site Settings
INSERT INTO `SiteSettings` (`key`, `value`, `createdAt`, `updatedAt`)
VALUES 
  ('office_name', 'SAALUVESA ENTERPRISES PRIVATE LIMITED', NOW(), NOW()),
  ('office_address', 'Dr.No.18/76, Thiru.Ve.Ka. St, Punjai Puliampatti, SATHYAMANGALAM, ERODE, TAMIL NADU. -638459', NOW(), NOW()),
  ('gst_number', '33ABRCS3304A1ZR', NOW(), NOW()),
  ('iec_number', 'ABRCS3304A', NOW(), NOW()),
  ('contact_email', 'contact@saaluvesa.com', NOW(), NOW()),
  ('live_support_number', '', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Default Products
INSERT INTO `Products` (`name`, `description`, `website_link`, `image`, `display_order`, `is_active`, `slug`, `createdAt`, `updatedAt`)
VALUES 
  ('Custom-printed t-shirts', 'Tailored designs for families, groups, businesses, events and organizations, printed in DTF or DTG on premium cotton.', 'https://castbull.co.in/', '/uploads/product_custom.jpg', 0, 1, 'custom-tshirts', NOW(), NOW()),
  ('Plain cotton t-shirts', 'Bulk-ready blanks sourced from verified manufacturers, available across sizes and colors for retail or export.', 'https://castbull.co.in/', '/uploads/product_plain.jpg', 0, 1, 'plain-tshirts', NOW(), NOW()),
  ('Personalized apparel & merch', 'Flexible sourcing and printing scaled from single-piece orders to large export consignments.', 'https://castbull.co.in/', '/uploads/product_merch.jpg', 0, 1, 'personalized-merch', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
