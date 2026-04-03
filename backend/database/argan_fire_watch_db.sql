-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 03, 2026 at 03:29 PM
-- Server version: 8.0.45
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `argan_fire_watch`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_ajouter_mesure` (IN `p_id_capteur` INT, IN `p_temperature` DECIMAL(5,2), IN `p_humidite` DECIMAL(5,2), IN `p_vent` DECIMAL(6,2))   BEGIN
    INSERT INTO mesures(
        id_capteur,
        temperature_c,
        humidite_pct,
        vitesse_vent_kmh
    )
    VALUES(
        p_id_capteur,
        p_temperature,
        p_humidite,
        p_vent
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_alertes_zone` (IN `p_id_zone` INT)   BEGIN
    SELECT
        id_alerte,
        niveau_gravite,
        message,
        date_creation,
        statut
    FROM alertes
    WHERE id_zone = p_id_zone
    AND statut != 'RESOLUE'
    ORDER BY date_creation DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_calcul_propagation` (IN `p_temperature` DECIMAL(5,2), IN `p_humidite` DECIMAL(5,2), IN `p_vent` DECIMAL(6,2), IN `p_direction` VARCHAR(20), OUT `p_prob` INT, OUT `p_niveau` VARCHAR(20))   BEGIN
    DECLARE v_prob DECIMAL(6,2) DEFAULT 0;
    DECLARE v_chergui DECIMAL(3,1) DEFAULT 1.0;

    -- Chergui wind multiplies risk by 2.5
    IF UPPER(IFNULL(p_direction, '')) = 'CHERGUI' THEN
        SET v_chergui = 2.5;
    END IF;

    -- Temperature (50%)
    SET v_prob = v_prob + LEAST(p_temperature * 0.5, 50);

    -- Wind (30%)
    SET v_prob = v_prob + LEAST(p_vent * 0.3, 30);

    -- Humidity inverse (20%)
    SET v_prob = v_prob + LEAST((100 - p_humidite) * 0.2, 20);

    -- Apply Chergui factor
    SET v_prob = LEAST(ROUND(v_prob * v_chergui), 100);
    SET p_prob = v_prob;

    -- Set level
    SET p_niveau = CASE
        WHEN v_prob >= 70 THEN 'CRITIQUE'
        WHEN v_prob >= 40 THEN 'ATTENTION'
        ELSE 'INFO'
    END;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cloturer_incendie` (IN `p_id_incendie` INT, IN `p_superficie` DECIMAL(10,2))   BEGIN
    UPDATE incendies
    SET
        date_fin = NOW(),
        statut_incendie = 'ETEINT',
        superficie_brulee_ha = p_superficie
    WHERE id_incendie = p_id_incendie;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_creer_cooperative` (IN `p_nom` VARCHAR(200), IN `p_email` VARCHAR(150), IN `p_tel` VARCHAR(20), IN `p_responsable` INT)   BEGIN
    INSERT INTO cooperatives(
        nom_cooperative,
        email_contact,
        telephone,
        id_responsable
    )
    VALUES(
        p_nom,
        p_email,
        p_tel,
        p_responsable
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_declarer_incendie` (IN `p_id_alerte` INT, IN `p_id_zone` INT)   BEGIN
    INSERT INTO incendies(
        date_debut,
        statut_incendie,
        id_zone,
        id_alerte
    )
    VALUES(
        NOW(),
        'EN_COURS',
        p_id_zone,
        p_id_alerte
    );
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `alertes`
--

CREATE TABLE `alertes` (
  `id_alerte` int UNSIGNED NOT NULL,
  `type_alerte` enum('AUTOMATIQUE','MANUELLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AUTOMATIQUE',
  `niveau_gravite` enum('INFO','ATTENTION','CRITIQUE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('OUVERTE','EN_COURS','RESOLUE','ANNULEE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OUVERTE',
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_resolution` datetime DEFAULT NULL,
  `id_mesure` bigint UNSIGNED DEFAULT NULL,
  `id_zone` int UNSIGNED NOT NULL,
  `probabilite_propagation` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alertes`
--

INSERT INTO `alertes` (`id_alerte`, `type_alerte`, `niveau_gravite`, `message`, `statut`, `date_creation`, `date_resolution`, `id_mesure`, `id_zone`, `probabilite_propagation`) VALUES
(1, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 55.00°C | Direction vent: Chergui | Propagation: 100%', 'RESOLUE', '2026-03-23 13:33:04', NULL, 3, 1, 100),
(2, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 55.50°C | Direction vent: N | Propagation: 55%', 'OUVERTE', '2026-03-26 19:53:04', NULL, 4, 1, 55),
(3, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.00°C | Direction vent: N | Propagation: 56%', 'RESOLUE', '2026-03-26 20:21:26', NULL, 5, 1, 56),
(4, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.00°C | Direction vent: N | Propagation: 56%', 'RESOLUE', '2026-03-26 20:29:44', NULL, 6, 1, 56),
(5, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.00°C | Direction vent: N | Propagation: 56%', 'RESOLUE', '2026-03-26 20:35:05', NULL, 7, 1, 56),
(6, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.00°C | Direction vent: N | Propagation: 56%', 'RESOLUE', '2026-03-26 21:14:43', NULL, 8, 1, 56),
(7, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.00°C | Direction vent: N | Propagation: 56%', 'RESOLUE', '2026-03-26 21:42:35', NULL, 9, 1, 56),
(8, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.00°C | Direction vent: N | Propagation: 56%', 'RESOLUE', '2026-03-26 21:44:07', NULL, 10, 1, 56),
(9, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 58.00°C | Direction vent: N | Propagation: 64%', 'RESOLUE', '2026-03-26 22:22:10', NULL, 21, 6, 64),
(11, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 51.20°C | Direction vent: N | Propagation: 50%', 'RESOLUE', '2026-04-01 03:47:00', NULL, 34, 6, 50),
(12, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 51.68°C | Direction vent: N | Propagation: 33%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 04:58:48', 40, 10, 33),
(13, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 51.64°C | Direction vent: N | Propagation: 43%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 04:57:39', 44, 11, 43),
(14, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 50.76°C | Direction vent: N | Propagation: 47%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 05:28:31', 45, 11, 47),
(17, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 55.35°C | Direction vent: N | Propagation: 48%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 04:57:44', 51, 1, 48),
(18, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 51.36°C | Direction vent: N | Propagation: 41%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 04:57:46', 52, 6, 41),
(19, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 56.30°C | Direction vent: N | Propagation: 40%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 04:57:47', 61, 11, 40),
(22, 'AUTOMATIQUE', 'CRITIQUE', '🔥 ALERTE INCENDIE - Temp: 55.12°C | Direction vent: N | Propagation: 52%', 'RESOLUE', '2026-04-01 03:51:08', '2026-04-01 04:57:49', 67, 11, 52);

--
-- Triggers `alertes`
--
DELIMITER $$
CREATE TRIGGER `trg_notification_pompiers` AFTER INSERT ON `alertes` FOR EACH ROW BEGIN

    IF NEW.niveau_gravite = 'CRITIQUE' THEN

        -- Notify POMPIER role users
        INSERT IGNORE INTO alertes_utilisateurs (id_alerte, id_utilisateur)
        SELECT NEW.id_alerte, u.id_utilisateur
        FROM utilisateurs u
        INNER JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
        INNER JOIN roles r ON ur.id_role = r.id_role
        WHERE r.libelle = 'POMPIER'
        AND u.statut = 'ACTIF';

        -- Also notify admin users
        INSERT IGNORE INTO alertes_utilisateurs (id_alerte, id_utilisateur)
        SELECT NEW.id_alerte, u.id_utilisateur
        FROM utilisateurs u
        INNER JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
        INNER JOIN roles r ON ur.id_role = r.id_role
        WHERE r.libelle = 'admin'
        AND u.statut = 'ACTIF';

    END IF;

END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `alertes_utilisateurs`
--

CREATE TABLE `alertes_utilisateurs` (
  `id_alerte` int UNSIGNED NOT NULL,
  `id_utilisateur` int UNSIGNED NOT NULL,
  `date_notification` datetime DEFAULT CURRENT_TIMESTAMP,
  `envoye` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alertes_utilisateurs`
--

INSERT INTO `alertes_utilisateurs` (`id_alerte`, `id_utilisateur`, `date_notification`, `envoye`) VALUES
(2, 8, '2026-03-26 20:53:04', 0),
(3, 8, '2026-03-26 21:21:26', 0),
(3, 9, '2026-03-26 21:21:26', 0),
(4, 8, '2026-03-26 21:29:44', 0),
(4, 9, '2026-03-26 21:29:44', 0),
(5, 8, '2026-03-26 21:35:05', 0),
(5, 9, '2026-03-26 21:35:05', 0),
(6, 8, '2026-03-26 22:14:43', 0),
(6, 9, '2026-03-26 22:14:43', 0),
(7, 8, '2026-03-26 22:42:35', 0),
(7, 9, '2026-03-26 22:42:35', 0),
(8, 8, '2026-03-26 22:44:07', 0),
(8, 9, '2026-03-26 22:44:07', 0),
(9, 8, '2026-03-26 23:22:10', 0),
(9, 9, '2026-03-26 23:22:10', 0),
(11, 8, '2026-04-01 04:47:00', 0),
(11, 9, '2026-04-01 04:47:00', 0),
(11, 14, '2026-04-01 04:47:00', 0),
(11, 15, '2026-04-01 04:47:00', 0),
(12, 8, '2026-04-01 04:51:08', 0),
(12, 9, '2026-04-01 04:51:08', 0),
(12, 14, '2026-04-01 04:51:08', 0),
(12, 15, '2026-04-01 04:51:08', 0),
(13, 8, '2026-04-01 04:51:08', 0),
(13, 9, '2026-04-01 04:51:08', 0),
(13, 14, '2026-04-01 04:51:08', 0),
(13, 15, '2026-04-01 04:51:08', 0),
(14, 8, '2026-04-01 04:51:08', 0),
(14, 9, '2026-04-01 04:51:08', 0),
(14, 14, '2026-04-01 04:51:08', 0),
(14, 15, '2026-04-01 04:51:08', 0),
(17, 8, '2026-04-01 04:51:08', 0),
(17, 9, '2026-04-01 04:51:08', 0),
(17, 14, '2026-04-01 04:51:08', 0),
(17, 15, '2026-04-01 04:51:08', 0),
(18, 8, '2026-04-01 04:51:08', 0),
(18, 9, '2026-04-01 04:51:08', 0),
(18, 14, '2026-04-01 04:51:08', 0),
(18, 15, '2026-04-01 04:51:08', 0),
(19, 8, '2026-04-01 04:51:08', 0),
(19, 9, '2026-04-01 04:51:08', 0),
(19, 14, '2026-04-01 04:51:08', 0),
(19, 15, '2026-04-01 04:51:08', 0),
(22, 8, '2026-04-01 04:51:08', 0),
(22, 9, '2026-04-01 04:51:08', 0),
(22, 14, '2026-04-01 04:51:08', 0),
(22, 15, '2026-04-01 04:51:08', 0);

-- --------------------------------------------------------

--
-- Table structure for table `capteurs`
--

CREATE TABLE `capteurs` (
  `id_capteur` int UNSIGNED NOT NULL,
  `reference_serie` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_capteur` enum('TEMPERATURE','MULTI','VENT','HUMIDITE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MULTI',
  `modele` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(9,6) NOT NULL,
  `longitude` decimal(9,6) NOT NULL,
  `altitude_m` decimal(7,2) DEFAULT NULL,
  `statut` enum('ACTIF','INACTIF','EN_MAINTENANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIF',
  `date_installation` date NOT NULL,
  `date_derniere_maj` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_zone` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `capteurs`
--

INSERT INTO `capteurs` (`id_capteur`, `reference_serie`, `type_capteur`, `modele`, `latitude`, `longitude`, `altitude_m`, `statut`, `date_installation`, `date_derniere_maj`, `id_zone`) VALUES
(1, 'CAP-TEST-001', 'MULTI', NULL, 30.427800, -9.598100, NULL, 'ACTIF', '2026-03-23', '2026-03-23 13:32:53', 1),
(3, 'ENS_MULT_02', 'MULTI', 'ArganSense-X', 30.425000, -9.580000, 140.00, 'ACTIF', '2026-03-26', '2026-03-26 22:22:07', 6),
(4, 'ENS_VENT_03', 'VENT', 'WindMaster', 30.428000, -9.585000, 110.00, 'ACTIF', '2026-03-26', '2026-03-26 22:22:07', 6),
(17, 'AUTO-10-1-1774746577', 'MULTI', 'Corner-Station', 30.594882, -8.472691, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:09:37', 10),
(18, 'AUTO-10-2-1774746577', 'MULTI', 'Corner-Station', 30.595178, -8.461790, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:09:37', 10),
(19, 'AUTO-10-3-1774746577', 'MULTI', 'Corner-Station', 30.589487, -8.461704, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:09:37', 10),
(20, 'AUTO-10-4-1774746577', 'MULTI', 'Corner-Station', 30.589709, -8.472519, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:09:37', 10),
(21, 'AUTO-11-1-1774748839', 'MULTI', 'Corner-Station', 30.584616, -8.461103, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:47:19', 11),
(22, 'AUTO-11-2-1774748839', 'MULTI', 'Corner-Station', 30.580625, -8.470545, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:47:19', 11),
(23, 'AUTO-11-3-1774748839', 'MULTI', 'Corner-Station', 30.579073, -8.463078, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:47:19', 11),
(24, 'AUTO-11-4-1774748839', 'MULTI', 'Corner-Station', 30.584616, -8.461103, NULL, 'ACTIF', '2026-03-29', '2026-03-29 01:47:19', 11),
(37, 'AUTO-16-1-1775089156', 'MULTI', 'Corner-Station', 30.632387, -8.278198, NULL, 'ACTIF', '2026-04-02', '2026-04-02 00:19:16', 16),
(38, 'AUTO-16-2-1775089156', 'MULTI', 'Corner-Station', 30.632523, -8.268070, NULL, 'ACTIF', '2026-04-02', '2026-04-02 00:19:16', 16),
(39, 'AUTO-16-3-1775089156', 'MULTI', 'Corner-Station', 30.625136, -8.267727, NULL, 'ACTIF', '2026-04-02', '2026-04-02 00:19:16', 16),
(40, 'AUTO-16-4-1775089156', 'MULTI', 'Corner-Station', 30.625283, -8.277855, NULL, 'ACTIF', '2026-04-02', '2026-04-02 00:19:16', 16);

-- --------------------------------------------------------

--
-- Table structure for table `cooperatives`
--

CREATE TABLE `cooperatives` (
  `id_cooperative` int UNSIGNED NOT NULL,
  `nom_cooperative` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `siege_social` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_contact` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_agrement` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_creation` date NOT NULL DEFAULT (curdate()),
  `id_responsable` int UNSIGNED NOT NULL,
  `id_zone` int UNSIGNED DEFAULT NULL,
  `statut` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `zone_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cooperatives`
--

INSERT INTO `cooperatives` (`id_cooperative`, `nom_cooperative`, `siege_social`, `email_contact`, `telephone`, `numero_agrement`, `date_creation`, `id_responsable`, `id_zone`, `statut`, `zone_name`, `region`) VALUES
(1, 'Abde\'s coop', 'N1 ekefefef', 'abde@gmail.com', '23423432434', NULL, '2026-03-10', 3, 1, 'approved', NULL, 'Agadir-Ida-Outanane'),
(2, 'Argan 2', 'wfqef', 'refer@hh.ma', '234234324', NULL, '2026-03-10', 4, 2, 'rejected', NULL, 'Tiznit'),
(3, 'r34rq4', '34t3q4t5', 'ewfef@gms.col', '3455345435', NULL, '2026-03-10', 5, 3, 'rejected', NULL, 'Agadir-Ida-Outanane'),
(4, 'Abdelmalek\'s coop', 'Temsia', 'abdelmalekhamda@gmai.com', '0622222222', NULL, '2026-03-10', 6, 4, 'pending', NULL, 'Inezgane-Ait-Melloul'),
(5, 'hhh', 'efrg', 'omar@gmail.com', '5645455465', NULL, '2026-03-12', 7, 5, 'rejected', NULL, 'Agadir-Ida-Outanane'),
(6, 'ensiasd', 'taroudant', 'hamda@gmail.com', '060000000000', NULL, '2026-03-26', 12, 6, 'approved', NULL, 'Taroudant'),
(7, 'NEW COOP', 'FEWFGF34', 'brownfree777@gmail.com', '+212 54325345', NULL, '2026-04-02', 17, 15, 'approved', NULL, 'Agadir-Ida-Outanane');

-- --------------------------------------------------------

--
-- Table structure for table `incendies`
--

CREATE TABLE `incendies` (
  `id_incendie` int UNSIGNED NOT NULL,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime DEFAULT NULL,
  `superficie_brulee_ha` decimal(10,2) UNSIGNED DEFAULT NULL,
  `statut_incendie` enum('EN_COURS','MAITRISE','ETEINT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_COURS',
  `cause_presumee` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci,
  `id_zone` int UNSIGNED NOT NULL,
  `id_alerte` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incendies`
--

INSERT INTO `incendies` (`id_incendie`, `date_debut`, `date_fin`, `superficie_brulee_ha`, `statut_incendie`, `cause_presumee`, `observations`, `id_zone`, `id_alerte`) VALUES
(1, '2026-04-02 19:45:41', '2026-04-02 18:45:00', 40.00, 'ETEINT', 'Human negligence', 'kolchi t7rg', 6, 11),
(2, '2026-04-02 19:58:07', '2026-04-02 18:57:00', 222.96, 'ETEINT', 'Natural causes (lightning)', 'kolchi t7rg\n', 6, 9),
(3, '2026-04-02 20:52:32', '2026-04-02 19:52:00', 4324.00, 'ETEINT', 'Human negligence', 'degergrg', 1, 8),
(4, '2026-04-02 21:31:32', '2026-04-02 20:31:00', 334.00, 'ETEINT', 'Electrical fault', 'fdgrthg', 1, 7),
(5, '2026-04-02 22:34:15', '2026-04-02 21:34:00', 66.00, 'ETEINT', 'Electrical fault', 'fewfregf', 1, 6),
(6, '2026-04-02 22:49:32', '2026-04-02 21:49:00', 3534.97, 'ETEINT', 'Human negligence', 'rgegtrh', 1, 5),
(7, '2026-04-02 22:50:47', '2026-04-02 21:50:00', 443.00, 'ETEINT', 'Electrical fault', '4grhthyth', 1, 1),
(8, '2026-04-03 00:01:39', '2026-04-02 23:01:00', 3.00, 'ETEINT', 'Agricultural burning', 'ergtrgh', 1, 4),
(9, '2026-04-03 12:35:34', '2026-04-03 02:35:00', 0.43, 'ETEINT', 'Electrical fault', 'y54y54y56uy5', 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `logs_securite`
--

CREATE TABLE `logs_securite` (
  `id_log` bigint UNSIGNED NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_cible` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_enregistrement` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ancienne_valeur` json DEFAULT NULL,
  `nouvelle_valeur` json DEFAULT NULL,
  `adresse_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horodatage` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id_utilisateur` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `logs_securite`
--

INSERT INTO `logs_securite` (`id_log`, `action`, `table_cible`, `id_enregistrement`, `ancienne_valeur`, `nouvelle_valeur`, `adresse_ip`, `horodatage`, `id_utilisateur`) VALUES
(1, 'UPDATE', 'utilisateurs', '4', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', NULL, '2026-03-23 14:33:58.851', NULL),
(2, 'UPDATE', 'utilisateurs', '4', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', NULL, '2026-03-23 14:43:43.728', NULL),
(3, 'UPDATE', 'utilisateurs', '3', '{\"nom\": \"hamda\", \"email\": \"abde@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"abde@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-23 14:54:17.922', NULL),
(4, 'UPDATE', 'utilisateurs', '7', '{\"nom\": \"efger\", \"email\": \"omar@gmail.com\", \"prenom\": \"rer\", \"statut\": \"rejected\"}', '{\"nom\": \"efger\", \"email\": \"omar@gmail.com\", \"prenom\": \"rer\", \"statut\": \"approved\"}', NULL, '2026-03-23 14:55:36.089', NULL),
(5, 'UPDATE', 'utilisateurs', '4', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', NULL, '2026-03-23 14:56:37.103', NULL),
(6, 'UPDATE', 'utilisateurs', '7', '{\"nom\": \"efger\", \"email\": \"omar@gmail.com\", \"prenom\": \"rer\", \"statut\": \"approved\"}', '{\"nom\": \"efger\", \"email\": \"omar@gmail.com\", \"prenom\": \"rer\", \"statut\": \"approved\"}', NULL, '2026-03-23 14:57:39.710', NULL),
(7, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-23 15:04:28.386', NULL),
(8, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-26 19:55:13.550', NULL),
(9, 'UPDATE', 'utilisateurs', '9', '{\"nom\": \"Brigade\", \"email\": \"pompiers@agadir.ma\", \"prenom\": \"Agadir\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Brigade\", \"email\": \"pompiers@agadir.ma\", \"prenom\": \"Agadir\", \"statut\": \"ACTIF\"}', NULL, '2026-03-26 21:13:46.962', NULL),
(10, 'UPDATE', 'utilisateurs', '9', '{\"nom\": \"Brigade\", \"email\": \"pompiers@agadir.ma\", \"prenom\": \"Agadir\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Brigade\", \"email\": \"pompiers@agadir.ma\", \"prenom\": \"Agadir\", \"statut\": \"ACTIF\"}', NULL, '2026-03-26 21:20:52.684', NULL),
(11, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-26 22:01:14.073', NULL),
(12, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"pending\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-26 22:03:16.809', NULL),
(13, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-26 22:17:31.472', NULL),
(14, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-26 22:36:46.565', NULL),
(15, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-26 22:37:06.954', NULL),
(16, 'UPDATE', 'utilisateurs', '7', '{\"nom\": \"efger\", \"email\": \"omar@gmail.com\", \"prenom\": \"rer\", \"statut\": \"approved\"}', '{\"nom\": \"efger\", \"email\": \"omar@gmail.com\", \"prenom\": \"rer\", \"statut\": \"approved\"}', NULL, '2026-03-27 23:19:25.899', NULL),
(17, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-27 23:31:15.326', NULL),
(18, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-28 12:24:48.573', NULL),
(19, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-03-28 18:49:44.419', NULL),
(20, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 21:13:02.926', NULL),
(21, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 21:13:11.335', NULL),
(22, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 21:18:07.072', NULL),
(23, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 21:49:14.642', NULL),
(24, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 22:00:35.977', NULL),
(25, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 22:02:31.071', NULL),
(26, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 22:12:06.068', NULL),
(27, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-28 22:30:09.988', NULL),
(28, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-30 00:10:51.546', NULL),
(29, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-30 00:58:29.610', NULL),
(30, 'UPDATE', 'utilisateurs', '14', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', NULL, '2026-03-30 21:21:16.956', NULL),
(31, 'UPDATE', 'utilisateurs', '14', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', NULL, '2026-03-30 21:21:37.361', NULL),
(32, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-30 21:34:20.033', NULL),
(33, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-30 21:56:29.213', NULL),
(34, 'UPDATE', 'utilisateurs', '14', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', NULL, '2026-03-30 23:15:21.142', NULL),
(35, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-03-30 23:27:41.084', NULL),
(36, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 01:04:44.324', NULL),
(37, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 02:57:27.703', NULL),
(38, 'UPDATE', 'utilisateurs', '8', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Admin\", \"email\": \"admin@argan.com\", \"prenom\": \"System\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 02:59:02.704', NULL),
(39, 'UPDATE', 'utilisateurs', '4', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"ACTIF\"}', '{\"nom\": \"fref\", \"email\": \"refer@hh.ma\", \"prenom\": \"abde\", \"statut\": \"rejected\"}', NULL, '2026-04-01 03:00:38.998', NULL),
(40, 'UPDATE', 'utilisateurs', '14', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 03:03:49.200', NULL),
(41, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 03:04:58.931', NULL),
(42, 'UPDATE', 'utilisateurs', '5', '{\"nom\": \"ewfwef\", \"email\": \"ewfef@gms.col\", \"prenom\": \"wdwefe\", \"statut\": \"rejected\"}', '{\"nom\": \"ewfwef\", \"email\": \"ewfef@gms.col\", \"prenom\": \"wdwefe\", \"statut\": \"rejected\"}', NULL, '2026-04-01 03:05:08.537', NULL),
(43, 'UPDATE', 'utilisateurs', '14', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', '{\"nom\": \"El Idrissi\", \"email\": \"pompier@arganfire.com\", \"prenom\": \"Karim\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 03:17:46.204', NULL),
(44, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 03:18:33.039', NULL),
(45, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 03:42:50.505', NULL),
(46, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 04:14:36.850', NULL),
(47, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 04:17:22.302', NULL),
(48, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 13:52:21.517', NULL),
(49, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 15:38:22.920', NULL),
(50, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 15:50:26.327', NULL),
(51, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 15:53:38.020', NULL),
(52, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 15:57:18.853', NULL),
(53, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 17:02:21.171', NULL),
(54, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 17:36:56.280', NULL),
(55, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 17:39:03.029', NULL),
(56, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 18:51:05.144', NULL),
(57, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-01 19:06:57.683', NULL),
(58, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 19:51:16.527', NULL),
(59, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 19:51:58.511', NULL),
(60, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-01 20:16:42.259', NULL),
(61, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 00:18:30.323', NULL),
(62, 'UPDATE', 'utilisateurs', '17', '{\"nom\": \"4t34t4\", \"email\": \"brownfree777@gmail.com\", \"prenom\": \"ewrf3\", \"statut\": \"pending\"}', '{\"nom\": \"4t34t4\", \"email\": \"brownfree777@gmail.com\", \"prenom\": \"ewrf3\", \"statut\": \"approved\"}', NULL, '2026-04-02 00:18:37.875', NULL),
(63, 'UPDATE', 'utilisateurs', '17', '{\"nom\": \"4t34t4\", \"email\": \"brownfree777@gmail.com\", \"prenom\": \"ewrf3\", \"statut\": \"approved\"}', '{\"nom\": \"4t34t4\", \"email\": \"brownfree777@gmail.com\", \"prenom\": \"ewrf3\", \"statut\": \"approved\"}', NULL, '2026-04-02 00:18:44.534', NULL),
(64, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 15:15:17.075', NULL),
(65, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 15:41:56.074', NULL),
(66, 'UPDATE', 'utilisateurs', '12', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', '{\"nom\": \"hamda\", \"email\": \"hamda@gmail.com\", \"prenom\": \"Abde\", \"statut\": \"approved\"}', NULL, '2026-04-02 15:59:23.348', NULL),
(67, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 16:01:56.893', NULL),
(68, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 16:25:19.046', NULL),
(69, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 16:25:50.121', NULL),
(70, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 18:05:32.823', NULL),
(71, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 18:06:04.066', NULL),
(72, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 18:44:54.409', NULL),
(73, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 19:51:53.793', NULL),
(74, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 21:36:42.971', NULL),
(75, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 21:46:59.364', NULL),
(76, 'UPDATE', 'utilisateurs', '15', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Abdelmalek\", \"email\": \"abdelmalek@gmail.com\", \"prenom\": \"Hamda\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 21:48:39.341', NULL),
(77, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-02 21:54:40.021', NULL),
(78, 'UPDATE', 'utilisateurs', '16', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', '{\"nom\": \"Pomp\", \"email\": \"Pomp@gmail.com\", \"prenom\": \"hhhh\", \"statut\": \"ACTIF\"}', NULL, '2026-04-03 11:33:56.197', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `mesures`
--

CREATE TABLE `mesures` (
  `id_mesure` bigint UNSIGNED NOT NULL,
  `temperature_c` decimal(5,2) NOT NULL,
  `humidite_pct` decimal(5,2) UNSIGNED DEFAULT NULL,
  `vitesse_vent_kmh` decimal(6,2) UNSIGNED DEFAULT NULL,
  `direction_vent` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'N',
  `horodatage` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `qualite_signal` tinyint UNSIGNED DEFAULT '100',
  `id_capteur` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mesures`
--

INSERT INTO `mesures` (`id_mesure`, `temperature_c`, `humidite_pct`, `vitesse_vent_kmh`, `direction_vent`, `horodatage`, `qualite_signal`, `id_capteur`) VALUES
(3, 55.00, 20.00, 45.00, 'Chergui', '2026-03-23 14:33:04.830', 100, 1),
(4, 55.50, 30.00, 45.00, 'N', '2026-03-26 20:53:04.689', 100, 1),
(5, 56.00, 30.00, 45.00, 'N', '2026-03-26 21:21:26.262', 100, 1),
(6, 56.00, 30.00, 45.00, 'N', '2026-03-26 21:29:44.326', 100, 1),
(7, 56.00, 30.00, 45.00, 'N', '2026-03-26 21:35:05.222', 100, 1),
(8, 56.00, 30.00, 45.00, 'N', '2026-03-26 22:14:43.126', 100, 1),
(9, 56.00, 30.00, 45.00, 'N', '2026-03-26 22:42:35.270', 100, 1),
(10, 56.00, 30.00, 45.00, 'N', '2026-03-26 22:44:07.241', 100, 1),
(11, 28.62, 48.55, 11.72, 'N', '2026-03-26 13:22:07.000', 100, 3),
(12, 34.51, 41.68, 8.06, 'N', '2026-03-26 14:22:07.000', 100, 3),
(13, 25.24, 42.10, 7.08, 'N', '2026-03-26 15:22:07.000', 100, 3),
(14, 28.05, 55.71, 12.20, 'N', '2026-03-26 16:22:07.000', 100, 3),
(15, 34.60, 59.26, 17.00, 'N', '2026-03-26 17:22:07.000', 100, 3),
(16, 27.95, 42.90, 14.33, 'N', '2026-03-26 18:22:07.000', 100, 3),
(17, 31.00, 47.43, 13.31, 'N', '2026-03-26 19:22:07.000', 100, 3),
(18, 29.69, 40.92, 6.12, 'N', '2026-03-26 20:22:07.000', 100, 3),
(19, 32.90, 54.17, 11.46, 'N', '2026-03-26 21:22:07.000', 100, 3),
(20, 27.70, 58.66, 17.76, 'N', '2026-03-26 22:22:07.000', 100, 3),
(21, 58.00, 22.00, 65.00, 'N', '2026-03-26 23:22:10.242', 100, 3),
(23, 32.50, 45.00, 12.00, 'N', '2026-04-01 04:42:32.000', 95, 1),
(25, 41.80, 32.00, 15.20, 'N', '2026-04-01 04:42:32.000', 98, 3),
(26, 28.50, 52.00, 22.00, 'N', '2026-04-01 04:42:32.000', 90, 4),
(27, 45.30, 28.00, 18.00, 'N', '2026-04-01 04:42:32.000', 94, 17),
(29, 48.50, 22.00, 20.00, 'N', '2026-04-01 04:42:32.000', 93, 3),
(30, 35.20, 42.00, 14.50, 'N', '2026-04-01 04:47:00.000', 96, 1),
(31, 29.80, 55.00, 8.20, 'N', '2026-04-01 04:47:00.000', 94, 3),
(32, 44.50, 25.00, 22.00, 'N', '2026-04-01 04:47:00.000', 91, 4),
(33, 38.70, 35.00, 16.80, 'N', '2026-04-01 04:47:00.000', 97, 17),
(34, 51.20, 18.00, 28.00, 'N', '2026-04-01 04:47:00.000', 93, 3),
(35, 47.30, 22.00, 24.00, 'N', '2026-04-01 04:47:00.000', 92, 17),
(36, 34.64, 57.38, 23.19, 'N', '2026-04-01 04:51:08.000', 94, 1),
(37, 48.89, 25.62, 5.18, 'N', '2026-04-01 04:51:08.000', 92, 3),
(38, 28.47, 69.91, 19.32, 'N', '2026-04-01 04:51:08.000', 88, 4),
(39, 30.80, 34.55, 26.25, 'N', '2026-04-01 04:51:08.000', 92, 17),
(40, 51.68, 66.91, 0.68, 'N', '2026-04-01 04:51:08.000', 89, 18),
(41, 37.76, 31.51, 26.25, 'N', '2026-04-01 04:51:08.000', 95, 19),
(42, 48.95, 66.89, 8.83, 'N', '2026-04-01 04:51:08.000', 94, 20),
(43, 37.12, 22.39, 0.83, 'N', '2026-04-01 04:51:08.000', 99, 21),
(44, 51.64, 42.88, 18.71, 'N', '2026-04-01 04:51:08.000', 96, 22),
(45, 50.76, 22.81, 21.13, 'N', '2026-04-01 04:51:08.000', 90, 23),
(46, 44.53, 29.83, 0.91, 'N', '2026-04-01 04:51:08.000', 93, 24),
(51, 55.35, 32.45, 24.23, 'N', '2026-04-01 04:41:08.000', 86, 1),
(52, 51.36, 31.58, 5.37, 'N', '2026-04-01 04:41:08.000', 92, 3),
(53, 40.62, 58.94, 4.37, 'N', '2026-04-01 04:41:08.000', 92, 4),
(54, 40.69, 62.60, 14.37, 'N', '2026-04-01 04:41:08.000', 87, 17),
(55, 26.12, 46.71, 1.48, 'N', '2026-04-01 04:41:08.000', 96, 18),
(56, 24.25, 59.93, 17.21, 'N', '2026-04-01 04:41:08.000', 82, 19),
(57, 39.59, 32.72, 8.76, 'N', '2026-04-01 04:41:08.000', 84, 20),
(58, 26.83, 68.95, 11.74, 'N', '2026-04-01 04:41:08.000', 88, 21),
(59, 45.66, 30.81, 15.45, 'N', '2026-04-01 04:41:08.000', 94, 22),
(60, 45.03, 33.25, 23.56, 'N', '2026-04-01 04:41:08.000', 83, 23),
(61, 56.30, 43.70, 3.46, 'N', '2026-04-01 04:41:08.000', 88, 24),
(67, 55.12, 18.80, 28.40, 'N', '2026-04-01 04:51:08.000', 92, 24);

--
-- Triggers `mesures`
--
DELIMITER $$
CREATE TRIGGER `trg_detection_incendie` AFTER INSERT ON `mesures` FOR EACH ROW BEGIN
    DECLARE v_id_zone INT UNSIGNED;
    DECLARE v_prob    INT DEFAULT 0;

    -- Get zone from sensor
    SELECT id_zone INTO v_id_zone
    FROM capteurs
    WHERE id_capteur = NEW.id_capteur;

    -- Calculate propagation probability
    CALL sp_calcul_propagation(
        NEW.temperature_c,
        IFNULL(NEW.humidite_pct, 50),
        IFNULL(NEW.vitesse_vent_kmh, 0),
        IFNULL(NEW.direction_vent, 'N'),
        @v_prob,
        @v_niveau
    );
    SET v_prob = @v_prob;

    -- Create alert if temp > 50°C
    IF NEW.temperature_c > 50.00 THEN
        INSERT INTO alertes (
            type_alerte,
            niveau_gravite,
            message,
            statut,
            id_mesure,
            id_zone,
            probabilite_propagation
        ) VALUES (
            'AUTOMATIQUE',
            'CRITIQUE',
            CONCAT(
                '? ALERTE INCENDIE - Temp: ', NEW.temperature_c,
                '°C | Direction vent: ', IFNULL(NEW.direction_vent, 'N/A'),
                ' | Propagation: ', v_prob, '%'
            ),
            'OUVERTE',
            NEW.id_mesure,
            v_id_zone,
            v_prob
        );
    END IF;

END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_recalcul_indice_risque` AFTER INSERT ON `mesures` FOR EACH ROW BEGIN

    DECLARE v_id_zone   INT UNSIGNED;
    DECLARE v_indice    DECIMAL(4,2);
    DECLARE v_temp_norm DECIMAL(5,4);
    DECLARE v_hum_norm  DECIMAL(5,4);
    DECLARE v_vent_norm DECIMAL(5,4);
    DECLARE v_chergui   DECIMAL(3,1) DEFAULT 1.0;

    SELECT id_zone INTO v_id_zone
    FROM capteurs
    WHERE id_capteur = NEW.id_capteur;

    -- Normalize values
    SET v_temp_norm = LEAST(NEW.temperature_c / 60.0, 1.0);
    SET v_hum_norm  = 1.0 - LEAST(IFNULL(NEW.humidite_pct, 50) / 100.0, 1.0);
    SET v_vent_norm = LEAST(IFNULL(NEW.vitesse_vent_kmh, 0) / 100.0, 1.0);

    -- Chergui multiplier
    IF UPPER(IFNULL(NEW.direction_vent, '')) = 'CHERGUI' THEN
        SET v_chergui = 1.5;
    END IF;

    -- Weighted calculation capped at 10
    SET v_indice = LEAST(
        ROUND(
            (v_temp_norm * 0.50 +
             v_hum_norm  * 0.30 +
             v_vent_norm * 0.20) * 10.0 * v_chergui,
        2),
    10.00);

    UPDATE zones_forestieres
    SET indice_risque = v_indice
    WHERE id_zone = v_id_zone;

END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id_role` int UNSIGNED NOT NULL,
  `libelle` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id_role`, `libelle`, `description`, `date_creation`) VALUES
(2, 'POMPIER', 'Pompier — réception alertes, consultation zones', '2026-03-10 14:04:24'),
(3, 'UTILISATEUR_COOP', 'Responsable coopérative argan', '2026-03-10 14:04:24'),
(7, 'ADMIN', 'Administrateur — gestion complète de la plateforme', '2026-03-10 14:04:24');

-- --------------------------------------------------------

--
-- Table structure for table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id_utilisateur` int UNSIGNED NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('ACTIF','INACTIF','SUSPENDU','approved','pending','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIF',
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `derniere_connexion` datetime DEFAULT NULL,
  `email_verifie` tinyint(1) DEFAULT '0',
  `code_verification` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id_utilisateur`, `nom`, `prenom`, `email`, `mot_de_passe_hash`, `statut`, `date_creation`, `derniere_connexion`, `email_verifie`, `code_verification`, `telephone`) VALUES
(3, 'hamda', 'Abde', 'abde@gmail.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'approved', '2026-03-10 13:58:30', '2026-03-23 15:54:17', 0, NULL, NULL),
(4, 'fref', 'abde', 'refer@hh.ma', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'rejected', '2026-03-10 14:05:47', '2026-03-23 15:56:37', 0, NULL, NULL),
(5, 'ewfwef', 'wdwefe', 'ewfef@gms.col', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'rejected', '2026-03-10 17:23:27', NULL, 0, '700243', NULL),
(6, 'FEEWFE', 'WRWEF', 'abdelmalekhamda@gmai.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'rejected', '2026-03-10 17:24:45', '2026-03-14 14:47:32', 0, '727659', NULL),
(7, 'efger', 'rer', 'omar@gmail.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'approved', '2026-03-12 13:52:56', '2026-03-28 00:19:25', 0, NULL, NULL),
(8, 'Admin', 'System', 'admin@argan.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ACTIF', '2026-03-23 15:03:59', '2026-04-01 03:59:02', 0, NULL, NULL),
(9, 'Brigade', 'Agadir', 'pompiers@agadir.ma', 'hashed', 'ACTIF', '2026-03-26 20:20:04', NULL, 0, NULL, '+212627946380'),
(12, 'hamda', 'Abde', 'hamda@gmail.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'approved', '2026-03-26 21:59:29', '2026-04-02 16:59:23', 0, NULL, NULL),
(14, 'El Idrissi', 'Karim', 'pompier@arganfire.com', '6160f34c204c6bf198ed2e0e659c5315a59761b11415b134baa3b2e70421bbf4', 'ACTIF', '2026-03-30 21:21:13', '2026-04-01 04:17:46', 0, NULL, NULL),
(15, 'Abdelmalek', 'Hamda', 'abdelmalek@gmail.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'ACTIF', '2026-04-01 02:59:51', '2026-04-02 22:48:39', 0, NULL, '+212 345435345'),
(16, 'Pomp', 'hhhh', 'Pomp@gmail.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'ACTIF', '2026-04-01 19:51:50', '2026-04-03 12:33:56', 0, NULL, '232345435'),
(17, '4t34t4', 'ewrf3', 'brownfree777@gmail.com', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'approved', '2026-04-02 00:18:06', '2026-04-02 01:18:44', 0, NULL, NULL);

--
-- Triggers `utilisateurs`
--
DELIMITER $$
CREATE TRIGGER `trg_audit_utilisateurs` AFTER UPDATE ON `utilisateurs` FOR EACH ROW BEGIN

    INSERT INTO logs_securite (
        action,
        table_cible,
        id_enregistrement,
        ancienne_valeur,
        nouvelle_valeur
    )
    VALUES (
        'UPDATE',
        'utilisateurs',
        CAST(OLD.id_utilisateur AS CHAR),
        JSON_OBJECT(
            'email',  OLD.email,
            'statut', OLD.statut,
            'nom',    OLD.nom,
            'prenom', OLD.prenom
        ),
        JSON_OBJECT(
            'email',  NEW.email,
            'statut', NEW.statut,
            'nom',    NEW.nom,
            'prenom', NEW.prenom
        )
    );

END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `utilisateurs_roles`
--

CREATE TABLE `utilisateurs_roles` (
  `id_utilisateur` int UNSIGNED NOT NULL,
  `id_role` int UNSIGNED NOT NULL,
  `date_attribution` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `utilisateurs_roles`
--

INSERT INTO `utilisateurs_roles` (`id_utilisateur`, `id_role`, `date_attribution`) VALUES
(3, 3, '2026-03-10 14:04:24'),
(4, 3, '2026-03-10 14:05:47'),
(5, 3, '2026-03-10 17:23:27'),
(6, 3, '2026-03-10 17:24:45'),
(7, 3, '2026-03-12 13:52:56'),
(8, 7, '2026-03-23 15:03:59'),
(9, 2, '2026-03-26 20:20:04'),
(12, 3, '2026-03-26 21:59:29'),
(14, 2, '2026-03-30 21:21:13'),
(15, 7, '2026-04-01 02:59:51'),
(16, 2, '2026-04-01 19:51:50'),
(17, 3, '2026-04-02 00:18:06');

-- --------------------------------------------------------

--
-- Table structure for table `zones_forestieres`
--

CREATE TABLE `zones_forestieres` (
  `id_zone` int UNSIGNED NOT NULL,
  `nom_zone` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wilaya` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `superficie_ha` decimal(10,2) UNSIGNED DEFAULT NULL,
  `coordonnees_gps` geometry NOT NULL,
  `indice_risque` decimal(4,2) UNSIGNED DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_cooperative` int UNSIGNED DEFAULT NULL
) ;

--
-- Dumping data for table `zones_forestieres`
--

INSERT INTO `zones_forestieres` (`id_zone`, `nom_zone`, `region`, `wilaya`, `superficie_ha`, `coordonnees_gps`, `indice_risque`, `description`, `date_creation`, `id_cooperative`) VALUES
(1, 'Argan', 'Agadir-Ida-Outanane', NULL, NULL, 0x000000000103000000010000000400000065abcb2901d922c01d774a07eb833e40ea211add41c422c019cbf44bc4833e40d3a1d3f36ed422c04eb9c2bb5c803e4065abcb2901d922c01d774a07eb833e40, 7.12, 'N1 ekefefef', '2026-03-10 13:58:30', 1),
(2, 'fdgrgreg', 'Tiznit', NULL, NULL, 0x00000000010300000001000000040000009198a0866fd122c0ace28dcc238f3e40022ec896e5b322c0e7a8a3e36a8c3e40bff2203d45ce22c0d6aa5d13d2863e409198a0866fd122c0ace28dcc238f3e40, 0.00, 'wfqef', '2026-03-10 14:05:47', 2),
(3, '43543ertret', 'Agadir-Ida-Outanane', NULL, NULL, 0x0000000001030000000100000005000000acac6d8ac7ed22c04cc3f01131a53e40ce1951da1bb422c01efaee5696a43e405ed72fd80dd322c0f04dd36707903e40ab06616ef7ea22c07cf0daa50d933e40acac6d8ac7ed22c04cc3f01131a53e40, 0.00, '34t3q4t5', '2026-03-10 17:23:27', 3),
(4, '3243eweferg', 'Inezgane-Ait-Melloul', NULL, NULL, 0x0000000001030000000100000005000000c631923d421523c09373620feda33e4059349d9d0cbe22c0289d4830d5a43e400b0c59ddeae122c090dd054a0a8c3e40c631923d421523c0a27dace0b7953e40c631923d421523c09373620feda33e40, 0.00, 'Temsia', '2026-03-10 17:24:45', 4),
(5, 't4et34ertertgerg', 'Agadir-Ida-Outanane', NULL, NULL, 0x00000000010300000001000000040000000e10ccd1e32f23c004560e2db29d3e401b9c887e6dcd22c0cfa0a17f829f3e403bc43f6ce90923c00533a6608d8b3e400e10ccd1e32f23c004560e2db29d3e40, 0.00, 'efrg', '2026-03-12 13:52:56', 5),
(6, 'ensiasd', 'Taroudant', NULL, NULL, 0x0000000001030000000100000004000000a11342075df220c0ef1ea0fb72963e40e8f527f1b9eb20c0ef1ea0fb72963e408940f50f22f120c038656ebe11953e40a11342075df220c0ef1ea0fb72963e40, 4.70, 'taroudant', '2026-03-26 21:59:29', 6),
(10, 'zone2', 'Taroudant', NULL, 63.00, 0x00000000010300000001000000050000000100008004f220c0b25bd12e4a983e40010000c06fec20c0cb21098e5d983e400100008064ec20c0933d6fa2e8963e4001000000eef120c070700e2af7963e400100008004f220c0b25bd12e4a983e40, 5.49, NULL, '2026-03-29 01:09:37', 6),
(11, 'zone3', 'Taroudant', NULL, 23.74, 0x0000000001030000000100000004000000010000c015ec20c031394965a9953e4001000040ebf020c065d845d7a3943e400100008018ed20c0ca144d1f3e943e40010000c015ec20c031394965a9953e40, 7.60, NULL, '2026-03-29 01:47:19', 6),
(15, 'Zone 1', 'Agadir-Ida-Outanane', NULL, NULL, 0x000000000103000000010000000500000042b5c189e88720c04ad235936fa23e40a6643909a57f20c0b1170ad80ea23e40de585018948120c0b81e85eb51a03e409a249694bb8720c087c43d963ea03e4042b5c189e88720c04ad235936fa23e40, 0.00, 'FEWFGF34', '2026-04-02 00:18:06', 7),
(16, 'zone 2', 'Agadir-Ida-Outanane', NULL, 78.38, 0x000000000103000000010000000500000001000000708e20c0d9a61819e4a13e4001000080408920c08cc24304eda13e4001000080138920c064aa15e308a03e4001000000438e20c046c3eb9112a03e4001000000708e20c0d9a61819e4a13e40, 0.00, NULL, '2026-04-02 00:19:16', 7);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alertes`
--
ALTER TABLE `alertes`
  ADD PRIMARY KEY (`id_alerte`),
  ADD KEY `id_mesure` (`id_mesure`),
  ADD KEY `id_zone` (`id_zone`);

--
-- Indexes for table `alertes_utilisateurs`
--
ALTER TABLE `alertes_utilisateurs`
  ADD PRIMARY KEY (`id_alerte`,`id_utilisateur`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Indexes for table `capteurs`
--
ALTER TABLE `capteurs`
  ADD PRIMARY KEY (`id_capteur`),
  ADD UNIQUE KEY `reference_serie` (`reference_serie`),
  ADD KEY `id_zone` (`id_zone`);

--
-- Indexes for table `cooperatives`
--
ALTER TABLE `cooperatives`
  ADD PRIMARY KEY (`id_cooperative`),
  ADD UNIQUE KEY `numero_agrement` (`numero_agrement`),
  ADD KEY `id_responsable` (`id_responsable`),
  ADD KEY `fk_cooperative_zone` (`id_zone`);

--
-- Indexes for table `incendies`
--
ALTER TABLE `incendies`
  ADD PRIMARY KEY (`id_incendie`),
  ADD KEY `id_zone` (`id_zone`),
  ADD KEY `id_alerte` (`id_alerte`);

--
-- Indexes for table `logs_securite`
--
ALTER TABLE `logs_securite`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `id_utilisateur` (`id_utilisateur`);

--
-- Indexes for table `mesures`
--
ALTER TABLE `mesures`
  ADD PRIMARY KEY (`id_mesure`),
  ADD KEY `id_capteur` (`id_capteur`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_role`),
  ADD UNIQUE KEY `libelle` (`libelle`);

--
-- Indexes for table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id_utilisateur`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `utilisateurs_roles`
--
ALTER TABLE `utilisateurs_roles`
  ADD PRIMARY KEY (`id_utilisateur`,`id_role`),
  ADD KEY `id_role` (`id_role`);

--
-- Indexes for table `zones_forestieres`
--
ALTER TABLE `zones_forestieres`
  ADD PRIMARY KEY (`id_zone`),
  ADD KEY `id_cooperative` (`id_cooperative`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alertes`
--
ALTER TABLE `alertes`
  MODIFY `id_alerte` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `capteurs`
--
ALTER TABLE `capteurs`
  MODIFY `id_capteur` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `cooperatives`
--
ALTER TABLE `cooperatives`
  MODIFY `id_cooperative` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `incendies`
--
ALTER TABLE `incendies`
  MODIFY `id_incendie` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `logs_securite`
--
ALTER TABLE `logs_securite`
  MODIFY `id_log` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `mesures`
--
ALTER TABLE `mesures`
  MODIFY `id_mesure` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_role` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id_utilisateur` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `zones_forestieres`
--
ALTER TABLE `zones_forestieres`
  MODIFY `id_zone` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alertes`
--
ALTER TABLE `alertes`
  ADD CONSTRAINT `alertes_ibfk_1` FOREIGN KEY (`id_mesure`) REFERENCES `mesures` (`id_mesure`),
  ADD CONSTRAINT `alertes_ibfk_2` FOREIGN KEY (`id_zone`) REFERENCES `zones_forestieres` (`id_zone`);

--
-- Constraints for table `alertes_utilisateurs`
--
ALTER TABLE `alertes_utilisateurs`
  ADD CONSTRAINT `alertes_utilisateurs_ibfk_1` FOREIGN KEY (`id_alerte`) REFERENCES `alertes` (`id_alerte`),
  ADD CONSTRAINT `alertes_utilisateurs_ibfk_2` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Constraints for table `capteurs`
--
ALTER TABLE `capteurs`
  ADD CONSTRAINT `capteurs_ibfk_1` FOREIGN KEY (`id_zone`) REFERENCES `zones_forestieres` (`id_zone`);

--
-- Constraints for table `cooperatives`
--
ALTER TABLE `cooperatives`
  ADD CONSTRAINT `cooperatives_ibfk_1` FOREIGN KEY (`id_responsable`) REFERENCES `utilisateurs` (`id_utilisateur`),
  ADD CONSTRAINT `fk_cooperative_zone` FOREIGN KEY (`id_zone`) REFERENCES `zones_forestieres` (`id_zone`) ON DELETE SET NULL;

--
-- Constraints for table `incendies`
--
ALTER TABLE `incendies`
  ADD CONSTRAINT `incendies_ibfk_1` FOREIGN KEY (`id_zone`) REFERENCES `zones_forestieres` (`id_zone`),
  ADD CONSTRAINT `incendies_ibfk_2` FOREIGN KEY (`id_alerte`) REFERENCES `alertes` (`id_alerte`);

--
-- Constraints for table `logs_securite`
--
ALTER TABLE `logs_securite`
  ADD CONSTRAINT `logs_securite_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`);

--
-- Constraints for table `mesures`
--
ALTER TABLE `mesures`
  ADD CONSTRAINT `mesures_ibfk_1` FOREIGN KEY (`id_capteur`) REFERENCES `capteurs` (`id_capteur`);

--
-- Constraints for table `utilisateurs_roles`
--
ALTER TABLE `utilisateurs_roles`
  ADD CONSTRAINT `utilisateurs_roles_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`) ON DELETE CASCADE,
  ADD CONSTRAINT `utilisateurs_roles_ibfk_2` FOREIGN KEY (`id_role`) REFERENCES `roles` (`id_role`) ON DELETE CASCADE;

--
-- Constraints for table `zones_forestieres`
--
ALTER TABLE `zones_forestieres`
  ADD CONSTRAINT `zones_forestieres_ibfk_1` FOREIGN KEY (`id_cooperative`) REFERENCES `cooperatives` (`id_cooperative`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
