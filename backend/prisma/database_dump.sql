-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 15 mai 2026 à 03:54
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `najmo_erp`
--

-- --------------------------------------------------------

--
-- Structure de la table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `account_type` enum('CASH','CCP','PAYONEER','PAYPAL','REDOTPAY','BANK','ADS') NOT NULL,
  `currency` enum('DZD','USD','EUR','USDT') NOT NULL,
  `initial_balance` decimal(18,2) DEFAULT 0.00,
  `current_balance` decimal(18,2) DEFAULT 0.00,
  `account_number` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `accounts`
--

INSERT INTO `accounts` (`id`, `name`, `account_type`, `currency`, `initial_balance`, `current_balance`, `account_number`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CCP SAMIR', 'CCP', 'DZD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(2, 'CCP NJ', 'CCP', 'DZD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(3, 'Caisse Espèces', 'CASH', 'DZD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(4, 'Payoneer SAMIR', 'PAYONEER', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(5, 'Payoneer NJ', 'PAYONEER', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(6, 'RedotPay SAMIR', 'REDOTPAY', 'USDT', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(7, 'RedotPay NJ', 'REDOTPAY', 'USDT', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(8, 'conanstoredz', 'PAYPAL', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(9, 'conanstoretiktok', 'PAYPAL', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(10, 'timelapspro20', 'PAYPAL', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(11, 'conanstore4', 'PAYPAL', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(12, 'conanstore5', 'PAYPAL', 'USD', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04'),
(13, 'Carte Ads Meta', 'ADS', 'EUR', 0.00, 0.00, NULL, NULL, 1, '2026-05-13 08:56:04', '2026-05-13 08:56:04');

-- --------------------------------------------------------

--
-- Structure de la table `account_movements`
--

CREATE TABLE `account_movements` (
  `id` bigint(20) NOT NULL,
  `account_id` bigint(20) NOT NULL,
  `operation_id` bigint(20) NOT NULL,
  `movement_type` enum('IN','OUT') NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` enum('DZD','USD','EUR','USDT') NOT NULL,
  `balance_before` decimal(18,2) DEFAULT NULL,
  `balance_after` decimal(18,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(255) NOT NULL,
  `entity_id` bigint(20) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(100) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

CREATE TABLE `clients` (
  `id` bigint(20) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `client_type` enum('NORMAL','VIP','RISK') DEFAULT 'NORMAL',
  `notes` text DEFAULT NULL,
  `total_operations` int(11) DEFAULT 0,
  `total_profit` decimal(18,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `exchange_rates`
--

CREATE TABLE `exchange_rates` (
  `id` bigint(20) NOT NULL,
  `base_currency` enum('DZD','USD','EUR','USDT') NOT NULL,
  `target_currency` enum('DZD','USD','EUR','USDT') NOT NULL,
  `rate` decimal(18,6) NOT NULL,
  `created_by_user_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(20) NOT NULL,
  `category` varchar(255) NOT NULL,
  `account_id` bigint(20) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` enum('DZD','USD','EUR','USDT') NOT NULL,
  `description` text DEFAULT NULL,
  `expense_date` datetime NOT NULL,
  `created_by_user_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `internal_transfers`
--

CREATE TABLE `internal_transfers` (
  `id` bigint(20) NOT NULL,
  `source_account_id` bigint(20) NOT NULL,
  `destination_account_id` bigint(20) NOT NULL,
  `source_amount` decimal(18,2) NOT NULL,
  `destination_amount` decimal(18,2) NOT NULL,
  `exchange_rate` decimal(18,6) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `transfer_date` datetime NOT NULL,
  `created_by_user_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `client_id` bigint(20) NOT NULL,
  `operation_id` bigint(20) DEFAULT NULL,
  `total_amount` decimal(18,2) NOT NULL,
  `paid_amount` decimal(18,2) DEFAULT 0.00,
  `remaining_amount` decimal(18,2) DEFAULT 0.00,
  `currency` enum('DZD','USD','EUR','USDT') DEFAULT 'DZD',
  `status` enum('DRAFT','UNPAID','PARTIAL','PAID','OVERDUE') DEFAULT 'UNPAID',
  `due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `operations`
--

CREATE TABLE `operations` (
  `id` bigint(20) NOT NULL,
  `operation_type` enum('SALE','PURCHASE','TRANSFER','EXPENSE') NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `client_id` bigint(20) DEFAULT NULL,
  `source_account_id` bigint(20) DEFAULT NULL,
  `destination_account_id` bigint(20) DEFAULT NULL,
  `created_by_user_id` bigint(20) NOT NULL,
  `validated_by_user_id` bigint(20) DEFAULT NULL,
  `amount_dzd` decimal(18,2) DEFAULT 0.00,
  `foreign_amount` decimal(18,2) DEFAULT 0.00,
  `foreign_currency` enum('USD','EUR','USDT') DEFAULT NULL,
  `exchange_rate` decimal(18,6) DEFAULT NULL,
  `operation_cost` decimal(18,2) DEFAULT 0.00,
  `profit` decimal(18,2) DEFAULT 0.00,
  `status` enum('PENDING','COMPLETED','CANCELLED') DEFAULT 'COMPLETED',
  `notes` text DEFAULT NULL,
  `attachment_url` text DEFAULT NULL,
  `operation_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL,
  `invoice_id` bigint(20) NOT NULL,
  `account_id` bigint(20) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` enum('DZD','USD','EUR','USDT') NOT NULL,
  `payment_method` enum('CASH','CCP','PAYONEER','PAYPAL','REDOTPAY','BANK_TRANSFER','CRYPTO') NOT NULL,
  `reference_number` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `payment_date` datetime NOT NULL,
  `created_by_user_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('TIKTOK_COINS','BUY_TIKTOK_USD','SELL_USDT','BUY_USDT','ADS_META','SERVICE') NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `name`, `category`, `description`, `is_active`, `created_at`) VALUES
(1, 'TikTok Coins', 'TIKTOK_COINS', NULL, 1, '2026-05-13 08:56:04'),
(2, 'Achat Dollars TikTok', 'BUY_TIKTOK_USD', NULL, 1, '2026-05-13 08:56:04'),
(3, 'Vente USDT', 'SELL_USDT', NULL, 1, '2026-05-13 08:56:04'),
(4, 'Achat USDT', 'BUY_USDT', NULL, 1, '2026-05-13 08:56:04'),
(5, 'Ads Meta', 'ADS_META', NULL, 1, '2026-05-13 08:56:04'),
(6, 'Services', 'SERVICE', NULL, 1, '2026-05-13 08:56:04');

-- --------------------------------------------------------

--
-- Structure de la table `product_account_compatibility`
--

CREATE TABLE `product_account_compatibility` (
  `id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `account_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `keycloak_user_id` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_accounts`
--

CREATE TABLE `user_accounts` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `account_id` bigint(20) NOT NULL,
  `permission_level` enum('OWNER','MANAGER','ACCOUNTANT','VIEWER') DEFAULT 'VIEWER',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_accounts_currency` (`currency`);

--
-- Index pour la table `account_movements`
--
ALTER TABLE `account_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_movements_operation` (`operation_id`),
  ADD KEY `idx_movements_account` (`account_id`);

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_user` (`user_id`),
  ADD KEY `idx_audit_entity` (`entity_type`,`entity_id`);

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_exchange_rate_user` (`created_by_user_id`);

--
-- Index pour la table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_expenses_account` (`account_id`),
  ADD KEY `fk_expenses_user` (`created_by_user_id`);

--
-- Index pour la table `internal_transfers`
--
ALTER TABLE `internal_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transfer_source_account` (`source_account_id`),
  ADD KEY `fk_transfer_destination_account` (`destination_account_id`),
  ADD KEY `fk_transfer_user` (`created_by_user_id`);

--
-- Index pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `fk_invoices_client` (`client_id`),
  ADD KEY `fk_invoices_operation` (`operation_id`),
  ADD KEY `idx_invoices_status` (`status`);

--
-- Index pour la table `operations`
--
ALTER TABLE `operations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_operations_product` (`product_id`),
  ADD KEY `fk_operations_source_account` (`source_account_id`),
  ADD KEY `fk_operations_destination_account` (`destination_account_id`),
  ADD KEY `fk_operations_created_by` (`created_by_user_id`),
  ADD KEY `fk_operations_validated_by` (`validated_by_user_id`),
  ADD KEY `idx_operations_date` (`operation_date`),
  ADD KEY `idx_operations_client` (`client_id`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payments_invoice` (`invoice_id`),
  ADD KEY `fk_payments_account` (`account_id`),
  ADD KEY `fk_payments_created_by` (`created_by_user_id`),
  ADD KEY `idx_payments_date` (`payment_date`);

--
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index pour la table `product_account_compatibility`
--
ALTER TABLE `product_account_compatibility`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_compatibility_product` (`product_id`),
  ADD KEY `fk_product_compatibility_account` (`account_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `keycloak_user_id` (`keycloak_user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`);

--
-- Index pour la table `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_accounts_user` (`user_id`),
  ADD KEY `fk_user_accounts_account` (`account_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `account_movements`
--
ALTER TABLE `account_movements`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `internal_transfers`
--
ALTER TABLE `internal_transfers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `operations`
--
ALTER TABLE `operations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `product_account_compatibility`
--
ALTER TABLE `product_account_compatibility`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user_accounts`
--
ALTER TABLE `user_accounts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `account_movements`
--
ALTER TABLE `account_movements`
  ADD CONSTRAINT `fk_movements_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_movements_operation` FOREIGN KEY (`operation_id`) REFERENCES `operations` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  ADD CONSTRAINT `fk_exchange_rate_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expenses_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_expenses_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `internal_transfers`
--
ALTER TABLE `internal_transfers`
  ADD CONSTRAINT `fk_transfer_destination_account` FOREIGN KEY (`destination_account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_transfer_source_account` FOREIGN KEY (`source_account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_transfer_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  ADD CONSTRAINT `fk_invoices_operation` FOREIGN KEY (`operation_id`) REFERENCES `operations` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `operations`
--
ALTER TABLE `operations`
  ADD CONSTRAINT `fk_operations_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_operations_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_operations_destination_account` FOREIGN KEY (`destination_account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_operations_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_operations_source_account` FOREIGN KEY (`source_account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_operations_validated_by` FOREIGN KEY (`validated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_payments_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `product_account_compatibility`
--
ALTER TABLE `product_account_compatibility`
  ADD CONSTRAINT `fk_product_compatibility_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_compatibility_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD CONSTRAINT `fk_user_accounts_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
