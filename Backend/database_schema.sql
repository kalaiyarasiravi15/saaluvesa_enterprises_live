-- ====================================================================
-- Saaluvesa Enterprises - Complete Production Database Dump & Schema
-- Target Database: sts_saaluvesa_db
-- Generated for Webuzo cPanel Linux MySQL Deployment (PascalCase)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------------------
-- Table structure for table `AdminUsers`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `AdminUsers`;
CREATE TABLE `AdminUsers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','staff') NOT NULL DEFAULT 'admin',
  `refresh_token` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `AdminUsers` (1 rows)
INSERT INTO `AdminUsers` (`id`, `email`, `password_hash`, `role`, `refresh_token`, `createdAt`, `updatedAt`) VALUES
(1, 'admin@saaluvesa.com', '$2a$12$v9MW7Ib9xKQmVAeMLeBOjOe4fzL8391N/yohPfGqHqihyN8E6EQoy', 'admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkyODI0Mzc5LCJleHAiOjE3OTM0MjkxNzl9.irQiV2cqW2AfObokQeH_Ao32G0eaRrDZRVnc-Uy0FMM', '2026-09-28 01:25:08', '2026-10-24 01:16:19');

-- --------------------------------------------------------------------
-- Table structure for table `Products`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Products`;
CREATE TABLE `Products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `website_link` varchar(255) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `images` text DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `Products` (3 rows)
INSERT INTO `Products` (`id`, `name`, `description`, `website_link`, `image`, `images`, `display_order`, `is_active`, `slug`, `createdAt`, `updatedAt`) VALUES
(6, 'ELEGANT SAREES FOR YOUR SUSTAINED SALES', 'CONTACT US FOR THE SAMPLE PRICE LIST\r\nWe have Multi-Currency and Multi Language Invoicing and Labelling System\r\nUpon receipt of your sample order enquiry and bulk order enquiry, a detailed Proforma Invoice (PI) including product pricing, shipping terms, payment terms, and delivery details will be provided for your review.\r\n\r\nWe focus only on Lab Test Certifications Beyond Labels and Tags (such as Silk Mark, Handloom Mark, GI Tag etc) We prioritise accredited laboratory testing and scientific quality verification to demonstrate material authenticity, product safety, and international compliance. Our commitment is to evidence-based quality assurance supported by recognised testing laboratories and transparent documentation.\r\n\r\nSHIPMENT POLICY - The Exporter committed to fair and prompt resolution of all verified quality and quantity claims. Where non-conforming goods are identified, the Exporter will work collaboratively with the Importer to determine the most appropriate commercial remedy with the objective of maintaining uninterrupted supply and long-term partnership.\r\n\r\nLet\'s move patiently with more discussions and corrections and Only with Affordable Shipment Values at first level.', 'contact', '/uploads/1791392427303-d2490e040f68.png', '["/uploads/1791392427303-d2490e040f68.png"]', 1, 1, 'elegant-sarees-for-your-sustained-sales', '2026-10-07 11:30:27', '2026-10-13 00:58:03'),
(7, 'SOUTH INDIAN WOOD PRESSED BLACK SESAME OIL AND COCONUT OIL FOR YOUR SUSTAINED SALES', 'CONTACT US FOR THE SAMPLE PRICE LIST\r\nWe have Multi-Currency and Multi Language Invoicing and Labelling System\r\nUpon receipt of your sample order enquiry and bulk order enquiry, a detailed Proforma Invoice (PI) including product pricing, shipping terms, payment terms, and delivery details will be provided for your review.\r\n\r\nPACKING METHOD - We strictly choose glass packaging with integrated glass handles because it is eco-friendly, reusable, recyclable, and ideal for preserving the natural goodness of our oils.\r\n\r\nLAB TESTING- We prioritise accredited laboratory testing and scientific quality verification to demonstrate material authenticity, product safety, and international compliance. Our commitment is to evidence-based quality assurance supported by recognised testing laboratories and transparent documentation.\r\n\r\nSHIPMENT POLICY - The Exporter committed to fair and prompt resolution of all verified quality and quantity claims. Where non-conforming goods are identified, the Exporter will work collaboratively with the Importer to determine the most appropriate commercial remedy with the objective of maintaining uninterrupted supply and long-term partnership.\r\n\r\nLet\'s move patiently with more discussions and corrections and Only with Affordable Shipment Values at first level.', 'contact', '/uploads/1791458748320-e890510fd944.png', '["/uploads/1791458748320-e890510fd944.png"]', 2, 1, 'south-indian-wood-pressed-black-sesame-oil-and-coconut-oil-t', '2026-10-08 04:28:42', '2026-10-20 01:07:41'),
(8, 'POLO T SHIRTS (PLAIN AND CUSTOM PRINTED)', 'CONTACT US FOR THE SAMPLE PRICE LIST\r\nSAALUVESA specializes in sourcing and exporting Plain and Custom printed polo T-shirts for importers, wholesalers, distributors, retailers, corporate buyers, schools, clubs, and promotional merchandise companies worldwide.\r\nWe offer customized designs, private labelling, logo printing, bulk sourcing, competitive export pricing, and flexible order quantities. \r\nWe prioritise accredited laboratory testing and scientific quality verification to demonstrate material authenticity, product safety, and international compliance. Our commitment is to evidence-based quality assurance supported by recognised testing laboratories and transparent documentation.\r\nSHIPMENT POLICY - The Exporter committed to fair and prompt resolution of all verified quality and quantity claims. Where non-conforming goods are identified, the Exporter will work collaboratively with the Importer to determine the most appropriate commercial remedy with the objective of maintaining uninterrupted supply and long-term partnership.\r\nLet\'s move patiently with more discussions and corrections and Only with Affordable Shipment Values at first level.\r\nContact us today to discuss your requirements and receive a quotation for your first sample order and next bulk order.', 'contact', '/uploads/1791809045943-ff1bbcb75c38.png', '["/uploads/1791809045943-ff1bbcb75c38.png"]', 3, 1, 'polo-t-shirts-plain-and-custom-printed', '2026-10-12 07:14:06', '2026-10-20 01:16:45');

-- --------------------------------------------------------------------
-- Table structure for table `ContactSubmissions`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ContactSubmissions`;
CREATE TABLE `ContactSubmissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `postal_code` varchar(255) DEFAULT NULL,
  `requirement_details` text NOT NULL,
  `status` enum('New','Responded') DEFAULT 'New',
  `source_product_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `ContactSubmissions` (1 rows)
INSERT INTO `ContactSubmissions` (`id`, `name`, `email`, `phone`, `address`, `postal_code`, `requirement_details`, `status`, `source_product_id`, `createdAt`, `updatedAt`) VALUES
(46, 'kalaiyarasi', 'kalaiyarasiravi2005@gmail.com', NULL, 'Nanjaikalakurichi', '639002', 'wdwdefdeeeds', 'Responded', NULL, '2026-08-25 04:30:23', '2026-08-25 04:57:15');

-- --------------------------------------------------------------------
-- Table structure for table `Notifications`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Notifications`;
CREATE TABLE `Notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('contact_submission') NOT NULL DEFAULT 'contact_submission',
  `title` varchar(255) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `contact_submission_id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `Notifications` (1 rows)
INSERT INTO `Notifications` (`id`, `type`, `title`, `is_read`, `contact_submission_id`, `createdAt`) VALUES
(1, 'contact_submission', 'New enquiry from SANJEEVE P V', 1, 1, '2026-09-28 03:29:00');

-- --------------------------------------------------------------------
-- Table structure for table `SiteSettings`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `SiteSettings`;
CREATE TABLE `SiteSettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `SiteSettings` (7 rows)
INSERT INTO `SiteSettings` (`id`, `key`, `value`, `createdAt`, `updatedAt`) VALUES
(1, 'office_name', 'SAALUVESA ENTERPRISES PRIVATE LIMITED', '2026-09-28 02:52:21', '2026-09-28 02:52:21'),
(2, 'office_address', 'Dr.No.18/76, Thiru.Ve.Ka. St, Punjai Puliampatti, SATHYAMANGALAM, ERODE, TAMIL NADU. -638459', '2026-09-28 02:52:21', '2026-09-28 02:52:21'),
(3, 'gst_number', '33ABRCS3304A1ZR', '2026-09-28 02:52:21', '2026-09-28 02:52:21'),
(4, 'iec_number', 'ABRCS3304A', '2026-09-28 02:52:21', '2026-09-28 02:52:21'),
(5, 'contact_email', 'contact@saaluvesa.com', '2026-09-28 02:52:21', '2026-09-28 02:52:21'),
(6, 'live_support_number', '', '2026-09-28 02:52:21', '2026-09-28 02:52:21'),
(7, 'home_banner', '{"eyebrow":"WELCOME TO SAALUVESA ENTERPRISES PRIVATE LIMITED","headline":"INDIAN EXPORTS","headline_highlight":"FOR GLOBAL MARKETS","sub":"We specialise in exporting T-Shirts, Sarees, Sesame Oil, and Coconut Oil to international buyers worldwide. From fashionable apparel and elegant traditional sarees to pure, naturally processed sesame oils and coconut oils","notice_text_before":"we deliver products that meet global quality standards with reliable sourcing, competitive pricing, and timely shipments. ","notice_link_url":"/contact","notice_link_text":"Contact Us","notice_text_after":"     today for bulk orders, private labelling, samples, and export enquiries.","links":[{"id":"default-1","type":"/contact","url":"/contact","text":"Contact Us"}],"badge1_num":"100%","badge1_label":"Tailor-Made Solutions","badge2_num":"Global","badge2_label":"Export & Delivery","image_url":""}', '2026-10-01 02:20:01', '2026-10-03 08:19:09');

-- --------------------------------------------------------------------
-- Table structure for table `ExportDocuments`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ExportDocuments`;
CREATE TABLE `ExportDocuments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(255) NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_email` varchar(255) DEFAULT NULL,
  `sender_address` text DEFAULT NULL,
  `additional_company_details` text DEFAULT NULL,
  `sender_contact` varchar(255) DEFAULT NULL,
  `sender_tax_id` varchar(255) DEFAULT NULL,
  `shipment_date` date DEFAULT NULL,
  `shipment_ref_no` varchar(255) DEFAULT NULL,
  `reason_for_export` varchar(255) DEFAULT NULL,
  `type_of_export` varchar(255) DEFAULT NULL,
  `export_license_no` varchar(255) DEFAULT NULL,
  `import_license_no` varchar(255) DEFAULT NULL,
  `incoterms` varchar(255) DEFAULT NULL,
  `currency_code` varchar(255) DEFAULT 'USD',
  `payment_method` varchar(255) DEFAULT NULL,
  `importer_name` varchar(255) NOT NULL,
  `importer_address` text DEFAULT NULL,
  `importer_contact` varchar(255) DEFAULT NULL,
  `importer_email` varchar(255) DEFAULT NULL,
  `importer_tax_id` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `receiver_email` varchar(255) DEFAULT NULL,
  `receiver_address` text DEFAULT NULL,
  `receiver_contact` varchar(255) DEFAULT NULL,
  `receiver_tax_id` varchar(255) DEFAULT NULL,
  `letter_of_credit_no` varchar(255) DEFAULT NULL,
  `customer_po_no` varchar(255) DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `file_number` varchar(255) DEFAULT NULL,
  `mode_of_transportation` varchar(255) DEFAULT NULL,
  `transportation_terms` varchar(255) DEFAULT NULL,
  `awb_bl_no` varchar(255) DEFAULT NULL,
  `no_of_packages` int(11) DEFAULT NULL,
  `package_description` text DEFAULT NULL,
  `total_gross_weight_unit` varchar(255) DEFAULT NULL,
  `hs_code` varchar(255) DEFAULT NULL,
  `country_of_origin` varchar(255) DEFAULT NULL,
  `other_information_compliance_details` text DEFAULT NULL,
  `signatory_name` varchar(255) DEFAULT NULL,
  `signatory_designation` varchar(255) DEFAULT NULL,
  `total_goods_value` decimal(14,2) DEFAULT 0.00,
  `tax_type` varchar(255) DEFAULT NULL,
  `tax_rate` decimal(6,2) DEFAULT 0.00,
  `tax_amount` decimal(14,2) DEFAULT 0.00,
  `tax2_type` varchar(255) DEFAULT NULL,
  `tax2_rate` decimal(6,2) DEFAULT 0.00,
  `tax2_amount` decimal(14,2) DEFAULT 0.00,
  `final_total_amount` decimal(14,2) DEFAULT 0.00,
  `total_amount_words` text DEFAULT NULL,
  `total_net_weight_kg` decimal(14,3) DEFAULT 0.000,
  `total_net_weight_lbs` decimal(14,3) DEFAULT 0.000,
  `status` enum('Draft','Generated','Closed') DEFAULT 'Draft',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `ExportDocuments` (1 rows)
INSERT INTO `ExportDocuments` (`id`, `invoice_no`, `sender_name`, `sender_email`, `sender_address`, `additional_company_details`, `sender_contact`, `sender_tax_id`, `shipment_date`, `shipment_ref_no`, `reason_for_export`, `type_of_export`, `export_license_no`, `import_license_no`, `incoterms`, `currency_code`, `payment_method`, `importer_name`, `importer_address`, `importer_contact`, `importer_email`, `importer_tax_id`, `receiver_name`, `receiver_email`, `receiver_address`, `receiver_contact`, `receiver_tax_id`, `letter_of_credit_no`, `customer_po_no`, `po_date`, `file_number`, `mode_of_transportation`, `transportation_terms`, `awb_bl_no`, `no_of_packages`, `package_description`, `total_gross_weight_unit`, `hs_code`, `country_of_origin`, `other_information_compliance_details`, `signatory_name`, `signatory_designation`, `total_goods_value`, `tax_type`, `tax_rate`, `tax_amount`, `tax2_type`, `tax2_rate`, `tax2_amount`, `final_total_amount`, `total_amount_words`, `total_net_weight_kg`, `total_net_weight_lbs`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'PI-2026-480', 'Saaluvesa Enterprises Private Limited', 'info@saaluvesa.com', 'Dr.No.18/76, Thiru.Ve.Ka. St, Punjai Puliampatti, SATHYAMANGALAM, ERODE, TAMIL NADU. -638459', 'C.I.N : U46900TZ2025PTC36041 | ROC COIMBATORE - REG. NO : 036041\nGST - 33ABRCS3304A1ZR | Import Export code - ABRCS3304A | ICEGATE ID - ABRCS3304APIE000', '+91 94884 10884', '33ABRCS3304A1ZR', '2026-10-01 18:30:00', '', 'Commercial', 'Permanent', 'abrcs3304a', 'eori', 'DAP', 'INR', 'Bank Transfer', 'camiseta', '', '', NULL, '', '', NULL, '', '', '', 'paid in advance not available', '12345', '2026-10-06 18:30:00', '2', 'AIR', 'Shipment Type: LCL/FCL Delivery Terms: CIF Rotterdam, Netherlands (Incoterms® 2020) Freight: Prepaid Country of Origin: India Port of Loading: Chennai, India Port of Discharge: Rotterdam, Netherlands', '', 1, 'one box', 'GRAMS', '61091000', 'India', 'Good Condition. Export cargo properly packaged and verified.', 'Saaluvesa Enterprises Private Limited', 'Authorized Signatory', '500.00', 'VAT', '21.00', '105.00', NULL, '0.00', '0.00', '605.00', 'INR SIX HUNDRED FIVE ONLY', '0.200', '0.441', 'Generated', '2026-10-02 08:16:23', '2026-10-09 04:29:37');

-- --------------------------------------------------------------------
-- Table structure for table `ExportDocumentItems`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ExportDocumentItems`;
CREATE TABLE `ExportDocumentItems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `export_document_id` int(11) DEFAULT NULL,
  `hs_code` varchar(255) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `country_of_origin` varchar(255) DEFAULT NULL,
  `qty` decimal(12,3) NOT NULL,
  `uom` varchar(255) DEFAULT NULL,
  `unit_value` decimal(14,2) NOT NULL,
  `extra_price` decimal(14,2) DEFAULT 0.00,
  `sub_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `unit_net_weight` decimal(14,3) DEFAULT 0.000,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_items_export_document_id` (`export_document_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `ExportDocumentItems` (1 rows)
INSERT INTO `ExportDocumentItems` (`id`, `export_document_id`, `hs_code`, `product_name`, `country_of_origin`, `qty`, `uom`, `unit_value`, `extra_price`, `sub_total`, `unit_net_weight`, `createdAt`, `updatedAt`) VALUES
(8, 1, NULL, 't shirt', NULL, '1.000', 'PCS', '500.00', '0.00', '500.00', '0.200', '2026-10-09 04:29:37', '2026-10-09 04:29:37');

-- --------------------------------------------------------------------
-- Table structure for table `ExportDocumentAudits`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `ExportDocumentAudits`;
CREATE TABLE `ExportDocumentAudits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `export_document_id` int(11) DEFAULT NULL,
  `edited_by` int(11) DEFAULT NULL,
  `edited_field` varchar(255) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `edited_at` datetime DEFAULT current_timestamp(),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audits_export_document_id` (`export_document_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `ExportDocumentAudits` (34 rows)
INSERT INTO `ExportDocumentAudits` (`id`, `export_document_id`, `edited_by`, `edited_field`, `old_value`, `new_value`, `edited_at`, `createdAt`) VALUES
(1, 1, 1, 'currency_code', 'EUR', 'INR', '2026-10-07 03:53:28', '2026-10-07 03:53:28'),
(2, 1, 1, 'tax_type', 'GST', 'VAT', '2026-10-07 03:53:28', '2026-10-07 03:53:28'),
(3, 1, 1, 'tax_rate', '18.00', '21', '2026-10-07 03:53:28', '2026-10-07 03:53:28'),
(4, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-07 03:53:28', '2026-10-07 03:53:28'),
(5, 1, 1, 'line_items', '[{"id":1,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"100.000","uom":"PCS","unit_value":"10.00","extra_price":"0.00","sub_total":"1000.00","unit_net_weight":"0.030","createdAt":"2026-10-02T13:46:24.000Z","updatedAt":"2026-10-02T13:46:24.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1","unit_value":30000,"unit_net_weight":1,"uom":"PCS","extra_price":"0.00"}]', '2026-10-07 03:53:28', '2026-10-07 03:53:28'),
(6, 1, 1, 'total_gross_weight_unit', 'GRAMS', 'KILOGRAMS', '2026-10-07 03:54:28', '2026-10-07 03:54:28'),
(7, 1, 1, 'tax_rate', '21.00', '21', '2026-10-07 03:54:28', '2026-10-07 03:54:28'),
(8, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-07 03:54:28', '2026-10-07 03:54:28'),
(9, 1, 1, 'line_items', '[{"id":2,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"1.000","uom":"PCS","unit_value":"30000.00","extra_price":"0.00","sub_total":"30000.00","unit_net_weight":"1.000","createdAt":"2026-10-07T09:23:28.000Z","updatedAt":"2026-10-07T09:23:28.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1","unit_value":30000,"unit_net_weight":1,"uom":"PCS","extra_price":"0.00"}]', '2026-10-07 03:54:28', '2026-10-07 03:54:28'),
(10, 1, 1, 'package_description', 'Apparel and Textiles in corrugated boxes', 'one box', '2026-10-07 03:55:20', '2026-10-07 03:55:20'),
(11, 1, 1, 'tax_rate', '21.00', '21', '2026-10-07 03:55:20', '2026-10-07 03:55:20'),
(12, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-07 03:55:20', '2026-10-07 03:55:20'),
(13, 1, 1, 'line_items', '[{"id":3,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"1.000","uom":"PCS","unit_value":"30000.00","extra_price":"0.00","sub_total":"30000.00","unit_net_weight":"1.000","createdAt":"2026-10-07T09:24:28.000Z","updatedAt":"2026-10-07T09:24:28.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1","unit_value":30000,"unit_net_weight":1,"uom":"PCS","extra_price":"0.00"}]', '2026-10-07 03:55:20', '2026-10-07 03:55:20'),
(14, 1, 1, 'export_license_no', '', 'abrcs3304a', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(15, 1, 1, 'import_license_no', '', 'eori', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(16, 1, 1, 'letter_of_credit_no', '', 'paid in advance not available', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(17, 1, 1, 'customer_po_no', '', '12345', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(18, 1, 1, 'po_date', '', '2026-10-07', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(19, 1, 1, 'file_number', '', '2', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(20, 1, 1, 'tax_rate', '21.00', '21', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(21, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(22, 1, 1, 'line_items', '[{"id":4,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"1.000","uom":"PCS","unit_value":"30000.00","extra_price":"0.00","sub_total":"30000.00","unit_net_weight":"1.000","createdAt":"2026-10-07T09:25:20.000Z","updatedAt":"2026-10-07T09:25:20.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1","unit_value":30000,"unit_net_weight":1,"uom":"PCS","extra_price":"0.00"}]', '2026-10-07 03:59:35', '2026-10-07 03:59:35'),
(23, 1, 1, 'tax_rate', '21.00', '21', '2026-10-08 01:19:04', '2026-10-08 01:19:04'),
(24, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-08 01:19:04', '2026-10-08 01:19:04'),
(25, 1, 1, 'line_items', '[{"id":5,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"1.000","uom":"PCS","unit_value":"30000.00","extra_price":"0.00","sub_total":"30000.00","unit_net_weight":"1.000","createdAt":"2026-10-07T09:29:35.000Z","updatedAt":"2026-10-07T09:29:35.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1.000","unit_value":500,"unit_net_weight":0.2,"uom":"PCS","extra_price":"0.00"}]', '2026-10-08 01:19:04', '2026-10-08 01:19:04'),
(26, 1, 1, 'total_gross_weight_unit', 'KILOGRAMS', 'GRAMS', '2026-10-08 01:19:21', '2026-10-08 01:19:21'),
(27, 1, 1, 'tax_rate', '21.00', '21', '2026-10-08 01:19:21', '2026-10-08 01:19:21'),
(28, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-08 01:19:21', '2026-10-08 01:19:21'),
(29, 1, 1, 'line_items', '[{"id":6,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"1.000","uom":"PCS","unit_value":"500.00","extra_price":"0.00","sub_total":"500.00","unit_net_weight":"0.200","createdAt":"2026-10-08T06:49:04.000Z","updatedAt":"2026-10-08T06:49:04.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1.000","unit_value":500,"unit_net_weight":0.2,"uom":"PCS","extra_price":"0.00"}]', '2026-10-08 01:19:21', '2026-10-08 01:19:21'),
(30, 1, 1, 'mode_of_transportation', 'Air', 'AIR', '2026-10-09 04:29:37', '2026-10-09 04:29:37'),
(31, 1, 1, 'transportation_terms', 'EXW', 'Shipment Type: LCL/FCL Delivery Terms: CIF Rotterdam, Netherlands (Incoterms® 2020) Freight: Prepaid Country of Origin: India Port of Loading: Chennai, India Port of Discharge: Rotterdam, Netherlands', '2026-10-09 04:29:37', '2026-10-09 04:29:37'),
(32, 1, 1, 'tax_rate', '21.00', '21', '2026-10-09 04:29:37', '2026-10-09 04:29:37'),
(33, 1, 1, 'tax2_rate', '0.00', '0', '2026-10-09 04:29:37', '2026-10-09 04:29:37'),
(34, 1, 1, 'line_items', '[{"id":7,"hs_code":null,"product_name":"t shirt","country_of_origin":null,"qty":"1.000","uom":"PCS","unit_value":"500.00","extra_price":"0.00","sub_total":"500.00","unit_net_weight":"0.200","createdAt":"2026-10-08T06:49:21.000Z","updatedAt":"2026-10-08T06:49:21.000Z","export_document_id":1}]', '[{"product_name":"t shirt","qty":"1.000","unit_value":500,"unit_net_weight":0.2,"uom":"PCS","extra_price":"0.00"}]', '2026-10-09 04:29:37', '2026-10-09 04:29:37');

-- --------------------------------------------------------------------
-- Table structure for table `Labels`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `Labels`;
CREATE TABLE `Labels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`sections`)),
  `schema_version` int(11) NOT NULL DEFAULT 1,
  `revision` int(11) NOT NULL DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `Labels` (1 rows)
INSERT INTO `Labels` (`id`, `title`, `sections`, `schema_version`, `revision`, `created_by`, `updated_by`, `createdAt`, `updatedAt`) VALUES
(1, 'SAALUVESA ENTERPRISES PVT LTD', '[{"id":"2a7eef7e-9ee2-4794-a86e-097c1ce0d0ee","heading":"SAALUVESA","fontSizePx":60,"subHeading":"SAALUVESA","subFontSizePx":36,"logoPath":"/uploads/label-287bbaa8-ba9e-4624-bfbe-15c1230b0c92.webp","rightLogoPath":"/uploads/label-2b2b7012-07d6-436b-b9a2-44b857104756.webp","rows":[{"id":"52ea73d8-9926-4df1-8c04-38e29b5a7d84","key":"EORI NO (example)","value":"EU123456789000 (example)"},{"id":"638f1fcb-de50-48c8-b36a-34b418ab493c","key":"PPWR NO (example)","value":"EU/2026/12345 - EU12345 (example)"},{"id":"5cc42dc7-8215-42a7-b302-f149b41f26de","key":"ANY FIELD","value":"ANY DETAIL"},{"id":"471163db-dabd-4d59-ad17-7b913ff221c6","key":"ANY FIELD","value":"ANY DETAIL"}]}]', 1, 3, 1, 1, '2026-10-09 23:58:37', '2026-10-10 00:56:34');

SET FOREIGN_KEY_CHECKS = 1;
