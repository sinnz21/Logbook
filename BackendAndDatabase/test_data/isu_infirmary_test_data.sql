-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: isu_infirmary
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `isu_infirmary`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `isu_infirmary` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `isu_infirmary`;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(150) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `detail` text DEFAULT NULL,
  `log_type` enum('account','record','inventory','security','backup') NOT NULL DEFAULT 'record',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `fk_activity_log_user` (`user_id`),
  KEY `idx_activity_created` (`created_at`),
  KEY `idx_activity_type` (`log_type`,`created_at`),
  KEY `idx_activity_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_activity_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=261 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES
(1,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(2,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(3,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(4,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(5,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(6,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(7,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(8,2,'Stock item added','stock',NULL,NULL,'inventory','2026-06-01 00:00:00'),
(9,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(10,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(11,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(12,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(13,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(14,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(15,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(16,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(17,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(18,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(19,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(20,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(21,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(22,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(23,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(24,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(25,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(26,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(27,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(28,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(29,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(30,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(31,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(32,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(33,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(34,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(35,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(36,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(37,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(38,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(39,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(40,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(41,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(42,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(43,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(44,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(45,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(46,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(47,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(48,2,'Patient registered','patient',NULL,NULL,'record','2026-10-12 13:39:57'),
(49,2,'Special case flagged','patient',6,NULL,'record','2026-06-11 08:04:00'),
(50,2,'Special case flagged','patient',23,NULL,'record','2026-06-30 04:01:00'),
(51,2,'Special case flagged','patient',32,NULL,'record','2026-09-15 23:55:00'),
(52,2,'Special case flagged','patient',10,NULL,'record','2026-07-28 00:44:00'),
(53,2,'Special case flagged','patient',11,NULL,'record','2026-07-03 01:32:00'),
(54,2,'Special case flagged','patient',1,NULL,'record','2026-08-13 02:18:00'),
(55,3,'Restock requisition sent','stock_request',NULL,NULL,'inventory','2026-10-12 13:39:58'),
(56,1,'Requisition approved','stock_request',1,NULL,'inventory','2026-05-30 08:16:00'),
(57,3,'Delivery received','stock_request',1,NULL,'inventory','2026-05-30 08:16:00'),
(58,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(59,3,'Patient signed out','visit',1,NULL,'record','2026-06-03 08:47:00'),
(60,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(61,3,'Patient signed out','visit',2,NULL,'record','2026-06-11 02:56:00'),
(62,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(63,2,'Patient signed out','visit',3,NULL,'record','2026-06-11 09:24:00'),
(64,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(65,2,'Patient signed out','visit',4,NULL,'record','2026-06-18 07:49:00'),
(66,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(67,3,'Patient signed out','visit',5,NULL,'record','2026-06-27 03:49:00'),
(68,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(69,2,'Patient signed out','visit',6,NULL,'record','2026-06-30 04:56:00'),
(70,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(71,2,'Patient signed out','visit',7,NULL,'record','2026-07-01 07:25:00'),
(72,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(73,3,'Patient signed out','visit',8,NULL,'record','2026-07-03 01:48:00'),
(74,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(75,2,'Patient signed out','visit',9,NULL,'record','2026-07-09 07:38:00'),
(76,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(77,3,'Patient signed out','visit',10,NULL,'record','2026-07-10 06:04:00'),
(78,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(79,2,'Patient signed out','visit',11,NULL,'record','2026-07-21 07:01:00'),
(80,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(81,3,'Patient signed out','visit',12,NULL,'record','2026-07-22 06:44:00'),
(82,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:58'),
(83,2,'Patient signed out','visit',13,NULL,'record','2026-07-28 01:48:00'),
(84,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(85,2,'Patient signed out','visit',14,NULL,'record','2026-08-01 00:17:00'),
(86,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(87,3,'Patient signed out','visit',15,NULL,'record','2026-08-03 01:07:00'),
(88,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(89,3,'Patient signed out','visit',16,NULL,'record','2026-08-03 05:45:00'),
(90,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(91,2,'Patient signed out','visit',17,NULL,'record','2026-08-04 00:58:00'),
(92,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(93,2,'Patient signed out','visit',18,NULL,'record','2026-08-04 03:27:00'),
(94,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(95,3,'Patient signed out','visit',19,NULL,'record','2026-08-04 07:43:00'),
(96,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(97,3,'Patient signed out','visit',20,NULL,'record','2026-08-05 00:31:00'),
(98,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(99,2,'Patient signed out','visit',21,NULL,'record','2026-08-06 04:28:00'),
(100,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(101,2,'Patient signed out','visit',22,NULL,'record','2026-08-06 06:02:00'),
(102,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(103,3,'Patient signed out','visit',23,NULL,'record','2026-08-06 06:21:00'),
(104,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(105,3,'Patient signed out','visit',24,NULL,'record','2026-08-07 04:47:00'),
(106,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(107,3,'Patient signed out','visit',25,NULL,'record','2026-08-11 01:35:00'),
(108,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(109,3,'Patient signed out','visit',26,NULL,'record','2026-08-11 05:44:00'),
(110,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(111,3,'Patient signed out','visit',27,NULL,'record','2026-08-12 00:27:00'),
(112,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:39:59'),
(113,3,'Patient signed out','visit',28,NULL,'record','2026-08-12 00:53:00'),
(114,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(115,3,'Patient signed out','visit',29,NULL,'record','2026-08-12 04:30:00'),
(116,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(117,3,'Patient signed out','visit',30,NULL,'record','2026-08-13 03:03:00'),
(118,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(119,2,'Patient signed out','visit',31,NULL,'record','2026-08-14 00:34:00'),
(120,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(121,2,'Patient signed out','visit',32,NULL,'record','2026-08-14 05:49:00'),
(122,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(123,2,'Patient signed out','visit',33,NULL,'record','2026-08-14 06:02:00'),
(124,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(125,3,'Patient signed out','visit',34,NULL,'record','2026-08-14 06:40:00'),
(126,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(127,2,'Patient signed out','visit',35,NULL,'record','2026-08-15 06:13:00'),
(128,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(129,3,'Patient signed out','visit',36,NULL,'record','2026-08-17 07:16:00'),
(130,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(131,3,'Patient signed out','visit',37,NULL,'record','2026-08-18 01:15:00'),
(132,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(133,2,'Patient signed out','visit',38,NULL,'record','2026-08-18 05:07:00'),
(134,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(135,3,'Patient signed out','visit',39,NULL,'record','2026-08-19 03:26:00'),
(136,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(137,2,'Patient signed out','visit',40,NULL,'record','2026-08-20 09:19:00'),
(138,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(139,3,'Patient signed out','visit',41,NULL,'record','2026-08-21 06:56:00'),
(140,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(141,2,'Patient signed out','visit',42,NULL,'record','2026-08-24 02:39:00'),
(142,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(143,3,'Patient signed out','visit',43,NULL,'record','2026-08-24 05:37:00'),
(144,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:00'),
(145,3,'Patient signed out','visit',44,NULL,'record','2026-08-25 03:10:00'),
(146,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(147,2,'Patient signed out','visit',45,NULL,'record','2026-08-25 08:52:00'),
(148,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(149,2,'Patient signed out','visit',46,NULL,'record','2026-08-27 04:21:00'),
(150,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(151,2,'Patient signed out','visit',47,NULL,'record','2026-08-27 04:06:00'),
(152,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(153,3,'Patient signed out','visit',48,NULL,'record','2026-08-28 02:53:00'),
(154,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(155,3,'Patient signed out','visit',49,NULL,'record','2026-08-28 09:20:00'),
(156,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(157,2,'Patient signed out','visit',50,NULL,'record','2026-09-01 00:41:00'),
(158,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(159,3,'Patient signed out','visit',51,NULL,'record','2026-09-01 03:11:00'),
(160,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(161,2,'Patient signed out','visit',52,NULL,'record','2026-09-01 03:10:00'),
(162,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(163,3,'Patient signed out','visit',53,NULL,'record','2026-09-02 05:31:00'),
(164,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(165,3,'Patient signed out','visit',54,NULL,'record','2026-09-02 05:26:00'),
(166,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(167,3,'Patient signed out','visit',55,NULL,'record','2026-09-03 02:32:00'),
(168,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(169,2,'Patient signed out','visit',56,NULL,'record','2026-09-04 04:25:00'),
(170,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(171,3,'Patient signed out','visit',57,NULL,'record','2026-09-05 02:56:00'),
(172,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:01'),
(173,3,'Patient signed out','visit',58,NULL,'record','2026-09-07 02:49:00'),
(174,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(175,3,'Patient signed out','visit',59,NULL,'record','2026-09-07 04:18:00'),
(176,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(177,2,'Patient signed out','visit',60,NULL,'record','2026-09-09 05:40:00'),
(178,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(179,3,'Patient signed out','visit',61,NULL,'record','2026-09-11 03:11:00'),
(180,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(181,2,'Patient signed out','visit',62,NULL,'record','2026-09-11 03:54:00'),
(182,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(183,3,'Patient signed out','visit',63,NULL,'record','2026-09-12 02:37:00'),
(184,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(185,2,'Patient signed out','visit',64,NULL,'record','2026-09-12 05:00:00'),
(186,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(187,2,'Patient signed out','visit',65,NULL,'record','2026-09-12 08:33:00'),
(188,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(189,3,'Patient signed out','visit',66,NULL,'record','2026-09-14 03:00:00'),
(190,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(191,2,'Patient signed out','visit',67,NULL,'record','2026-09-14 04:38:00'),
(192,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(193,3,'Patient signed out','visit',68,NULL,'record','2026-09-14 05:20:00'),
(194,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(195,3,'Patient signed out','visit',69,NULL,'record','2026-09-15 05:43:00'),
(196,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(197,2,'Patient signed out','visit',70,NULL,'record','2026-09-15 07:21:00'),
(198,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:02'),
(199,3,'Patient signed out','visit',71,NULL,'record','2026-09-16 00:21:00'),
(200,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(201,2,'Patient signed out','visit',72,NULL,'record','2026-09-17 08:12:00'),
(202,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(203,3,'Patient signed out','visit',73,NULL,'record','2026-09-18 05:41:00'),
(204,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(205,2,'Patient signed out','visit',74,NULL,'record','2026-09-21 05:44:00'),
(206,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(207,2,'Patient signed out','visit',75,NULL,'record','2026-09-22 00:32:00'),
(208,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(209,2,'Patient signed out','visit',76,NULL,'record','2026-09-22 01:46:00'),
(210,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(211,3,'Patient signed out','visit',77,NULL,'record','2026-09-22 03:00:00'),
(212,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(213,3,'Patient signed out','visit',78,NULL,'record','2026-09-23 02:31:00'),
(214,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(215,3,'Patient signed out','visit',79,NULL,'record','2026-09-23 05:58:00'),
(216,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(217,3,'Patient signed out','visit',80,NULL,'record','2026-09-24 02:20:00'),
(218,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(219,3,'Patient signed out','visit',81,NULL,'record','2026-09-24 05:53:00'),
(220,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(221,3,'Patient signed out','visit',82,NULL,'record','2026-09-25 06:08:00'),
(222,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(223,2,'Patient signed out','visit',83,NULL,'record','2026-09-28 06:15:00'),
(224,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(225,3,'Patient signed out','visit',84,NULL,'record','2026-09-29 07:32:00'),
(226,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:03'),
(227,3,'Patient signed out','visit',85,NULL,'record','2026-09-30 00:53:00'),
(228,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(229,2,'Patient signed out','visit',86,NULL,'record','2026-09-30 06:09:00'),
(230,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(231,2,'Patient signed out','visit',87,NULL,'record','2026-10-01 05:16:00'),
(232,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(233,2,'Patient signed out','visit',88,NULL,'record','2026-10-02 03:26:00'),
(234,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(235,2,'Patient signed out','visit',89,NULL,'record','2026-10-02 07:15:00'),
(236,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(237,2,'Patient signed out','visit',90,NULL,'record','2026-10-05 02:37:00'),
(238,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(239,3,'Patient signed out','visit',91,NULL,'record','2026-10-05 08:18:00'),
(240,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(241,3,'Patient signed out','visit',92,NULL,'record','2026-10-06 01:54:00'),
(242,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(243,3,'Patient signed out','visit',93,NULL,'record','2026-10-08 05:00:00'),
(244,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(245,3,'Patient signed out','visit',94,NULL,'record','2026-10-08 08:13:00'),
(246,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(247,2,'Patient signed out','visit',95,NULL,'record','2026-10-12 01:46:00'),
(248,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(249,3,'Patient signed out','visit',96,NULL,'record','2026-10-12 03:08:00'),
(250,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(251,2,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(252,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(253,3,'Visit recorded','visit',NULL,NULL,'record','2026-10-12 13:40:04'),
(254,2,'Restock requisition sent','stock_request',NULL,NULL,'inventory','2026-10-12 13:40:04'),
(255,1,'Requisition denied','stock_request',2,NULL,'inventory','2026-09-30 01:00:00'),
(256,4,'Restock requisition sent','stock_request',NULL,NULL,'inventory','2026-10-12 13:40:04'),
(257,2,'Visit moved to trash','visit',52,NULL,'record','2026-10-12 13:40:05'),
(258,2,'Visit moved to trash','visit',80,NULL,'record','2026-10-12 13:40:05'),
(259,2,'Visit moved to trash','visit',18,NULL,'record','2026-10-12 13:40:05'),
(260,1,'Database restored from backup',NULL,NULL,'isu_infirmary_20261012_054040.sql','backup','2026-10-12 13:40:40');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `complaint_id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`complaint_id`),
  UNIQUE KEY `uq_complaints_name` (`complaint_name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES
(1,'Tension Headache','Headache, migraine, head pain',1),
(2,'Dysmenorrhea','Menstrual cramps',1),
(3,'Viral Flu','Influenza-like illness',1),
(4,'Fever','Elevated body temperature',1),
(5,'Cough / Colds','Upper respiratory symptoms',1),
(6,'Wound / Abrasion','Cuts, scrapes, lacerations',1),
(7,'Stomach Pain','Abdominal pain, hyperacidity',1),
(8,'Dizziness','Lightheadedness, vertigo, near-fainting',1),
(9,'Allergic Reaction','Rash, hives, allergic response',1),
(10,'Elevated Blood Pressure','High BP reading on examination',1),
(11,'Other','Not covered by the list — see visit notes',1);
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispositions`
--

DROP TABLE IF EXISTS `dispositions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositions` (
  `disposition_id` int(11) NOT NULL AUTO_INCREMENT,
  `disposition_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`disposition_id`),
  UNIQUE KEY `uq_dispositions_name` (`disposition_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispositions`
--

LOCK TABLES `dispositions` WRITE;
/*!40000 ALTER TABLE `dispositions` DISABLE KEYS */;
INSERT INTO `dispositions` VALUES
(1,'Back to Class/Work','Patient returned to class or work after treatment',1),
(2,'Sent Home','Patient was sent home to rest',1),
(3,'Observation','Patient kept for observation in the infirmary',1),
(4,'Referred to Doctor','Patient referred to a doctor for further evaluation',1),
(5,'Hospital Admission','Patient was admitted to a hospital',1);
/*!40000 ALTER TABLE `dispositions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `transaction_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `item_type` enum('medicine','supply') NOT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `supply_id` int(11) DEFAULT NULL,
  `transaction_type` enum('released','restocked','adjustment','expired','damaged') NOT NULL,
  `quantity` decimal(10,2) NOT NULL COMMENT 'Signed: negative out, positive in',
  `reference_type` enum('visit','stock_request','manual') DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `transaction_date` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `fk_it_performed_by` (`performed_by`),
  KEY `idx_it_medicine` (`medicine_id`),
  KEY `idx_it_supply` (`supply_id`),
  KEY `idx_it_type` (`transaction_type`),
  KEY `idx_it_date` (`transaction_date`),
  KEY `idx_it_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_it_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`),
  CONSTRAINT `fk_it_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_it_supply` FOREIGN KEY (`supply_id`) REFERENCES `supplies` (`supply_id`),
  CONSTRAINT `chk_it_item_type` CHECK (`item_type` = 'medicine' and `medicine_id` is not null and `supply_id` is null or `item_type` = 'supply' and `supply_id` is not null and `medicine_id` is null)
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES
(1,'supply',NULL,6,'restocked',200.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(2,'medicine',3,NULL,'restocked',500.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(3,'medicine',5,NULL,'restocked',500.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(4,'medicine',7,NULL,'restocked',800.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(5,'medicine',11,NULL,'restocked',800.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(6,'medicine',4,NULL,'restocked',300.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(7,'supply',NULL,4,'restocked',200.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(8,'supply',NULL,2,'restocked',100.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(9,'supply',NULL,7,'restocked',100.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(10,'medicine',8,NULL,'restocked',800.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(11,'supply',NULL,5,'restocked',100.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(12,'medicine',9,NULL,'restocked',300.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(13,'medicine',10,NULL,'restocked',500.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(14,'medicine',2,NULL,'restocked',500.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(15,'medicine',6,NULL,'restocked',500.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(16,'medicine',1,NULL,'restocked',500.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(17,'supply',NULL,1,'restocked',100.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(18,'supply',NULL,3,'restocked',200.00,'stock_request',1,3,'2026-06-02 14:16:00',NULL),
(19,'supply',NULL,5,'released',-1.00,'visit',1,3,'2026-06-03 08:21:00',NULL),
(20,'supply',NULL,4,'released',-1.00,'visit',1,3,'2026-06-03 08:21:00',NULL),
(21,'supply',NULL,6,'released',-2.00,'visit',1,3,'2026-06-03 08:21:00',NULL),
(22,'medicine',1,NULL,'released',-3.00,'visit',2,3,'2026-06-11 01:47:00',NULL),
(23,'medicine',2,NULL,'released',-2.00,'visit',3,2,'2026-06-11 08:11:00',NULL),
(24,'medicine',11,NULL,'released',-3.00,'visit',4,2,'2026-06-18 07:11:00',NULL),
(25,'supply',NULL,7,'released',-1.00,'visit',4,2,'2026-06-18 07:11:00',NULL),
(26,'medicine',1,NULL,'released',-2.00,'visit',5,3,'2026-06-27 02:24:00',NULL),
(27,'medicine',2,NULL,'released',-2.00,'visit',6,2,'2026-06-30 04:08:00',NULL),
(28,'medicine',1,NULL,'released',-2.00,'visit',7,2,'2026-07-01 06:38:00',NULL),
(29,'medicine',2,NULL,'released',-2.00,'visit',8,3,'2026-07-03 01:39:00',NULL),
(30,'medicine',11,NULL,'released',-3.00,'visit',9,2,'2026-07-09 06:34:00',NULL),
(31,'supply',NULL,7,'released',-1.00,'visit',9,2,'2026-07-09 06:34:00',NULL),
(32,'medicine',1,NULL,'released',-3.00,'visit',10,3,'2026-07-10 05:10:00',NULL),
(33,'medicine',5,NULL,'released',-2.00,'visit',11,2,'2026-07-21 06:08:00',NULL),
(34,'supply',NULL,5,'released',-1.00,'visit',12,3,'2026-07-22 05:32:00',NULL),
(35,'supply',NULL,4,'released',-1.00,'visit',12,3,'2026-07-22 05:32:00',NULL),
(36,'supply',NULL,6,'released',-2.00,'visit',12,3,'2026-07-22 05:32:00',NULL),
(37,'medicine',11,NULL,'released',-3.00,'visit',13,2,'2026-07-28 00:51:00',NULL),
(38,'supply',NULL,7,'released',-1.00,'visit',13,2,'2026-07-28 00:51:00',NULL),
(39,'supply',NULL,5,'released',-1.00,'visit',14,2,'2026-07-31 23:39:00',NULL),
(40,'supply',NULL,4,'released',-1.00,'visit',14,2,'2026-07-31 23:39:00',NULL),
(41,'supply',NULL,6,'released',-2.00,'visit',14,2,'2026-07-31 23:39:00',NULL),
(42,'medicine',1,NULL,'released',-2.00,'visit',15,3,'2026-08-03 00:19:00',NULL),
(43,'medicine',4,NULL,'released',-1.00,'visit',15,3,'2026-08-03 00:19:00',NULL),
(44,'supply',NULL,7,'released',-1.00,'visit',15,3,'2026-08-03 00:19:00',NULL),
(45,'medicine',10,NULL,'released',-1.00,'visit',16,3,'2026-08-03 04:20:00',NULL),
(46,'medicine',1,NULL,'released',-2.00,'visit',17,2,'2026-08-03 23:59:00',NULL),
(47,'medicine',11,NULL,'released',-3.00,'visit',18,2,'2026-08-04 03:13:00',NULL),
(48,'supply',NULL,7,'released',-1.00,'visit',18,2,'2026-08-04 03:13:00',NULL),
(49,'medicine',11,NULL,'released',-3.00,'visit',19,3,'2026-08-04 06:19:00',NULL),
(50,'supply',NULL,7,'released',-1.00,'visit',19,3,'2026-08-04 06:19:00',NULL),
(51,'medicine',9,NULL,'released',-2.00,'visit',20,3,'2026-08-05 00:00:00',NULL),
(52,'medicine',6,NULL,'released',-2.00,'visit',20,3,'2026-08-05 00:00:00',NULL),
(53,'medicine',9,NULL,'released',-2.00,'visit',21,2,'2026-08-06 03:11:00',NULL),
(54,'medicine',6,NULL,'released',-2.00,'visit',21,2,'2026-08-06 03:11:00',NULL),
(55,'medicine',1,NULL,'released',-2.00,'visit',22,2,'2026-08-06 04:55:00',NULL),
(56,'medicine',4,NULL,'released',-1.00,'visit',22,2,'2026-08-06 04:55:00',NULL),
(57,'supply',NULL,7,'released',-1.00,'visit',22,2,'2026-08-06 04:55:00',NULL),
(58,'medicine',1,NULL,'released',-2.00,'visit',23,3,'2026-08-06 05:07:00',NULL),
(59,'medicine',11,NULL,'released',-3.00,'visit',24,3,'2026-08-07 03:28:00',NULL),
(60,'supply',NULL,7,'released',-1.00,'visit',24,3,'2026-08-07 03:28:00',NULL),
(61,'medicine',5,NULL,'released',-2.00,'visit',25,3,'2026-08-11 01:14:00',NULL),
(62,'medicine',2,NULL,'released',-2.00,'visit',26,3,'2026-08-11 04:33:00',NULL),
(63,'medicine',2,NULL,'released',-2.00,'visit',27,3,'2026-08-11 23:38:00',NULL),
(64,'supply',NULL,5,'released',-1.00,'visit',28,3,'2026-08-11 23:40:00',NULL),
(65,'supply',NULL,4,'released',-1.00,'visit',28,3,'2026-08-11 23:40:00',NULL),
(66,'supply',NULL,6,'released',-2.00,'visit',28,3,'2026-08-11 23:40:00',NULL),
(67,'medicine',1,NULL,'released',-3.00,'visit',29,3,'2026-08-12 03:11:00',NULL),
(68,'medicine',1,NULL,'released',-2.00,'visit',30,3,'2026-08-13 02:25:00',NULL),
(69,'medicine',1,NULL,'released',-2.00,'visit',32,2,'2026-08-14 05:09:00',NULL),
(70,'medicine',4,NULL,'released',-1.00,'visit',32,2,'2026-08-14 05:09:00',NULL),
(71,'supply',NULL,7,'released',-1.00,'visit',32,2,'2026-08-14 05:09:00',NULL),
(72,'medicine',1,NULL,'released',-2.00,'visit',33,2,'2026-08-14 05:23:00',NULL),
(73,'medicine',4,NULL,'released',-1.00,'visit',33,2,'2026-08-14 05:23:00',NULL),
(74,'supply',NULL,7,'released',-1.00,'visit',33,2,'2026-08-14 05:23:00',NULL),
(75,'medicine',5,NULL,'released',-2.00,'visit',34,3,'2026-08-14 06:16:00',NULL),
(76,'medicine',2,NULL,'released',-2.00,'visit',35,2,'2026-08-15 05:10:00',NULL),
(77,'medicine',1,NULL,'released',-3.00,'visit',37,3,'2026-08-18 01:08:00',NULL),
(78,'medicine',11,NULL,'released',-3.00,'visit',38,2,'2026-08-18 04:06:00',NULL),
(79,'supply',NULL,7,'released',-1.00,'visit',38,2,'2026-08-18 04:06:00',NULL),
(80,'medicine',10,NULL,'released',-1.00,'visit',39,3,'2026-08-19 02:58:00',NULL),
(81,'medicine',11,NULL,'released',-3.00,'visit',40,2,'2026-08-20 08:17:00',NULL),
(82,'supply',NULL,7,'released',-1.00,'visit',40,2,'2026-08-20 08:17:00',NULL),
(83,'medicine',8,NULL,'released',-2.00,'visit',42,2,'2026-08-24 01:53:00',NULL),
(84,'supply',NULL,2,'released',-1.00,'visit',42,2,'2026-08-24 01:53:00',NULL),
(85,'supply',NULL,5,'released',-1.00,'visit',43,3,'2026-08-24 05:29:00',NULL),
(86,'supply',NULL,4,'released',-1.00,'visit',43,3,'2026-08-24 05:29:00',NULL),
(87,'supply',NULL,6,'released',-2.00,'visit',43,3,'2026-08-24 05:29:00',NULL),
(88,'medicine',5,NULL,'released',-2.00,'visit',44,3,'2026-08-25 01:46:00',NULL),
(89,'medicine',1,NULL,'released',-2.00,'visit',45,2,'2026-08-25 07:29:00',NULL),
(90,'medicine',5,NULL,'released',-2.00,'visit',46,2,'2026-08-27 03:04:00',NULL),
(91,'medicine',1,NULL,'released',-3.00,'visit',47,2,'2026-08-27 03:53:00',NULL),
(92,'medicine',2,NULL,'released',-2.00,'visit',48,3,'2026-08-28 02:20:00',NULL),
(93,'medicine',2,NULL,'released',-2.00,'visit',51,3,'2026-09-01 02:27:00',NULL),
(94,'medicine',1,NULL,'released',-2.00,'visit',52,2,'2026-09-01 02:49:00',NULL),
(95,'medicine',4,NULL,'released',-1.00,'visit',52,2,'2026-09-01 02:49:00',NULL),
(96,'supply',NULL,7,'released',-1.00,'visit',52,2,'2026-09-01 02:49:00',NULL),
(97,'medicine',2,NULL,'released',-2.00,'visit',53,3,'2026-09-02 04:14:00',NULL),
(98,'medicine',2,NULL,'released',-2.00,'visit',54,3,'2026-09-02 04:46:00',NULL),
(99,'medicine',1,NULL,'released',-3.00,'visit',55,3,'2026-09-03 02:19:00',NULL),
(100,'medicine',10,NULL,'released',-1.00,'visit',56,2,'2026-09-04 03:10:00',NULL),
(101,'medicine',2,NULL,'released',-2.00,'visit',57,3,'2026-09-05 01:55:00',NULL),
(102,'medicine',11,NULL,'released',-3.00,'visit',58,3,'2026-09-07 02:32:00',NULL),
(103,'supply',NULL,7,'released',-1.00,'visit',58,3,'2026-09-07 02:32:00',NULL),
(104,'medicine',5,NULL,'released',-2.00,'visit',59,3,'2026-09-07 03:31:00',NULL),
(105,'medicine',11,NULL,'released',-3.00,'visit',60,2,'2026-09-09 05:35:00',NULL),
(106,'supply',NULL,7,'released',-1.00,'visit',60,2,'2026-09-09 05:35:00',NULL),
(107,'medicine',2,NULL,'released',-2.00,'visit',61,3,'2026-09-11 02:35:00',NULL),
(108,'medicine',11,NULL,'released',-3.00,'visit',62,2,'2026-09-11 03:32:00',NULL),
(109,'supply',NULL,7,'released',-1.00,'visit',62,2,'2026-09-11 03:32:00',NULL),
(110,'supply',NULL,5,'released',-1.00,'visit',64,2,'2026-09-12 03:58:00',NULL),
(111,'supply',NULL,4,'released',-1.00,'visit',64,2,'2026-09-12 03:58:00',NULL),
(112,'supply',NULL,6,'released',-2.00,'visit',64,2,'2026-09-12 03:58:00',NULL),
(113,'medicine',1,NULL,'released',-2.00,'visit',65,2,'2026-09-12 08:06:00',NULL),
(114,'medicine',4,NULL,'released',-1.00,'visit',65,2,'2026-09-12 08:06:00',NULL),
(115,'supply',NULL,7,'released',-1.00,'visit',65,2,'2026-09-12 08:06:00',NULL),
(116,'medicine',2,NULL,'released',-2.00,'visit',66,3,'2026-09-14 02:32:00',NULL),
(117,'medicine',1,NULL,'released',-2.00,'visit',67,2,'2026-09-14 03:44:00',NULL),
(118,'medicine',4,NULL,'released',-1.00,'visit',67,2,'2026-09-14 03:44:00',NULL),
(119,'supply',NULL,7,'released',-1.00,'visit',67,2,'2026-09-14 03:44:00',NULL),
(120,'medicine',2,NULL,'released',-2.00,'visit',68,3,'2026-09-14 04:38:00',NULL),
(121,'medicine',1,NULL,'released',-2.00,'visit',69,3,'2026-09-15 05:28:00',NULL),
(122,'medicine',4,NULL,'released',-1.00,'visit',69,3,'2026-09-15 05:28:00',NULL),
(123,'supply',NULL,7,'released',-1.00,'visit',69,3,'2026-09-15 05:28:00',NULL),
(124,'medicine',1,NULL,'released',-2.00,'visit',70,2,'2026-09-15 06:37:00',NULL),
(125,'medicine',11,NULL,'released',-3.00,'visit',71,3,'2026-09-16 00:03:00',NULL),
(126,'supply',NULL,7,'released',-1.00,'visit',71,3,'2026-09-16 00:03:00',NULL),
(127,'medicine',2,NULL,'released',-2.00,'visit',72,2,'2026-09-17 07:39:00',NULL),
(128,'medicine',9,NULL,'released',-2.00,'visit',73,3,'2026-09-18 05:05:00',NULL),
(129,'medicine',6,NULL,'released',-2.00,'visit',73,3,'2026-09-18 05:05:00',NULL),
(130,'medicine',11,NULL,'released',-3.00,'visit',74,2,'2026-09-21 04:20:00',NULL),
(131,'supply',NULL,7,'released',-1.00,'visit',74,2,'2026-09-21 04:20:00',NULL),
(132,'medicine',1,NULL,'released',-3.00,'visit',75,2,'2026-09-22 00:17:00',NULL),
(133,'medicine',9,NULL,'released',-2.00,'visit',77,3,'2026-09-22 02:26:00',NULL),
(134,'medicine',6,NULL,'released',-2.00,'visit',77,3,'2026-09-22 02:26:00',NULL),
(135,'medicine',1,NULL,'released',-2.00,'visit',78,3,'2026-09-23 01:28:00',NULL),
(136,'medicine',10,NULL,'released',-1.00,'visit',79,3,'2026-09-23 04:36:00',NULL),
(137,'medicine',8,NULL,'released',-2.00,'visit',80,3,'2026-09-24 01:33:00',NULL),
(138,'supply',NULL,2,'released',-1.00,'visit',80,3,'2026-09-24 01:33:00',NULL),
(139,'medicine',1,NULL,'released',-2.00,'visit',81,3,'2026-09-24 04:37:00',NULL),
(140,'medicine',4,NULL,'released',-1.00,'visit',81,3,'2026-09-24 04:37:00',NULL),
(141,'supply',NULL,7,'released',-1.00,'visit',81,3,'2026-09-24 04:37:00',NULL),
(142,'medicine',1,NULL,'released',-3.00,'visit',82,3,'2026-09-25 06:01:00',NULL),
(143,'medicine',8,NULL,'released',-2.00,'visit',83,2,'2026-09-28 04:50:00',NULL),
(144,'supply',NULL,2,'released',-1.00,'visit',83,2,'2026-09-28 04:50:00',NULL),
(145,'medicine',11,NULL,'released',-3.00,'visit',84,3,'2026-09-29 06:20:00',NULL),
(146,'supply',NULL,7,'released',-1.00,'visit',84,3,'2026-09-29 06:20:00',NULL),
(147,'medicine',2,NULL,'released',-2.00,'visit',85,3,'2026-09-30 00:18:00',NULL),
(148,'medicine',1,NULL,'released',-2.00,'visit',86,2,'2026-09-30 05:32:00',NULL),
(149,'medicine',10,NULL,'released',-1.00,'visit',87,2,'2026-10-01 05:03:00',NULL),
(150,'medicine',1,NULL,'released',-2.00,'visit',89,2,'2026-10-02 06:10:00',NULL),
(151,'medicine',1,NULL,'released',-2.00,'visit',90,2,'2026-10-05 02:25:00',NULL),
(152,'medicine',4,NULL,'released',-1.00,'visit',90,2,'2026-10-05 02:25:00',NULL),
(153,'supply',NULL,7,'released',-1.00,'visit',90,2,'2026-10-05 02:25:00',NULL),
(154,'medicine',1,NULL,'released',-2.00,'visit',91,3,'2026-10-05 06:55:00',NULL),
(155,'medicine',1,NULL,'released',-3.00,'visit',92,3,'2026-10-06 01:09:00',NULL),
(156,'medicine',2,NULL,'released',-2.00,'visit',93,3,'2026-10-08 04:41:00',NULL),
(157,'medicine',9,NULL,'released',-2.00,'visit',94,3,'2026-10-08 07:20:00',NULL),
(158,'medicine',6,NULL,'released',-2.00,'visit',94,3,'2026-10-08 07:20:00',NULL),
(159,'medicine',1,NULL,'released',-2.00,'visit',95,2,'2026-10-12 01:00:00',NULL),
(160,'medicine',1,NULL,'released',-2.00,'visit',97,2,'2026-10-12 04:46:00',NULL),
(161,'medicine',4,NULL,'released',-1.00,'visit',97,2,'2026-10-12 04:46:00',NULL),
(162,'supply',NULL,7,'released',-1.00,'visit',97,2,'2026-10-12 04:46:00',NULL),
(163,'medicine',1,NULL,'released',-3.00,'visit',98,2,'2026-10-12 05:39:57',NULL),
(164,'medicine',1,NULL,'released',-3.00,'visit',99,3,'2026-10-12 05:39:57',NULL),
(165,'medicine',1,NULL,'released',-3.00,'visit',100,3,'2026-10-12 05:39:57',NULL);
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_categories`
--

DROP TABLE IF EXISTS `item_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `applies_to` enum('medicine','supply','both') NOT NULL DEFAULT 'medicine',
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_item_categories_name` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_categories`
--

LOCK TABLES `item_categories` WRITE;
/*!40000 ALTER TABLE `item_categories` DISABLE KEYS */;
INSERT INTO `item_categories` VALUES
(1,'Analgesic / Antipyretic','medicine','Pain and fever relief',1),
(2,'Antibiotic','medicine','Antibacterial medicines',1),
(3,'Antihistamine / Allergy','medicine','Allergy relief',1),
(4,'Gastrointestinal','medicine','Stomach and digestive relief',1),
(5,'Hydration','medicine','Oral rehydration and fluid replacement',1),
(6,'Antiseptic','both','Wound cleaning and disinfecting',1),
(7,'Wound Care','supply','Gauze, bandages, dressings',1),
(8,'PPE','supply','Gloves, masks, protective equipment',1);
/*!40000 ALTER TABLE `item_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_attempts` (
  `attempt_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT 'Recorded even when no such user exists, to catch probing',
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IPv6-safe length',
  `successful` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attempt_id`),
  KEY `idx_login_attempts_lookup` (`username`,`attempted_at`),
  KEY `idx_login_attempts_user` (`user_id`,`attempted_at`),
  CONSTRAINT `fk_login_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES
(1,'acruz',1,'127.0.0.1',1,'2026-10-12 13:39:55'),
(2,'nsantos',2,'127.0.0.1',1,'2026-10-12 13:39:56'),
(3,'jreyes',3,'127.0.0.1',1,'2026-10-12 13:39:56'),
(4,'lmercado',4,'127.0.0.1',1,'2026-10-12 13:39:56'),
(5,'jreyes',3,'192.168.8.46',1,'2026-06-01 05:38:00'),
(6,'acruz',1,'192.168.8.34',0,'2026-06-01 08:27:00'),
(7,'acruz',1,'192.168.8.32',1,'2026-06-02 03:56:00'),
(8,'acruz',1,'192.168.8.29',1,'2026-06-02 06:35:00'),
(9,'acruz',1,'192.168.8.55',1,'2026-06-03 05:58:00'),
(10,'nsantos',2,'192.168.8.56',1,'2026-06-05 03:34:00'),
(11,'acruz',1,'192.168.8.53',1,'2026-06-05 08:49:00'),
(12,'acruz',1,'192.168.8.54',1,'2026-06-04 23:12:00'),
(13,'acruz',1,'192.168.8.51',0,'2026-06-06 00:01:00'),
(14,'jreyes',3,'192.168.8.49',1,'2026-06-08 08:37:00'),
(15,'jreyes',3,'192.168.8.54',1,'2026-06-07 23:26:00'),
(16,'jreyes',3,'192.168.8.37',1,'2026-06-11 03:09:00'),
(17,'nsantos',2,'192.168.8.44',1,'2026-06-12 01:24:00'),
(18,'jreyes',3,'192.168.8.54',1,'2026-06-12 07:48:00'),
(19,'nsantos',2,'192.168.8.56',1,'2026-06-13 02:15:00'),
(20,'jreyes',3,'192.168.8.40',1,'2026-06-13 04:19:00'),
(21,'acruz',1,'192.168.8.39',1,'2026-06-13 05:56:00'),
(22,'nsantos',2,'192.168.8.37',1,'2026-06-15 08:19:00'),
(23,'acruz',1,'192.168.8.29',1,'2026-06-15 02:27:00'),
(24,'acruz',1,'192.168.8.39',1,'2026-06-15 02:09:00'),
(25,'acruz',1,'192.168.8.49',0,'2026-06-15 03:52:00'),
(26,'jreyes',3,'192.168.8.53',1,'2026-06-16 02:19:00'),
(27,'acruz',1,'192.168.8.33',1,'2026-06-16 00:41:00'),
(28,'acruz',1,'192.168.8.24',1,'2026-06-16 07:39:00'),
(29,'jreyes',3,'192.168.8.35',1,'2026-06-17 01:56:00'),
(30,'acruz',1,'192.168.8.54',1,'2026-06-17 02:32:00'),
(31,'nsantos',2,'192.168.8.48',1,'2026-06-19 03:35:00'),
(32,'nsantos',2,'192.168.8.45',0,'2026-06-19 04:29:00'),
(33,'acruz',1,'192.168.8.49',1,'2026-06-19 06:03:00'),
(34,'jreyes',3,'192.168.8.29',1,'2026-06-20 01:18:00'),
(35,'nsantos',2,'192.168.8.27',1,'2026-06-22 05:52:00'),
(36,'nsantos',2,'192.168.8.32',1,'2026-06-22 07:40:00'),
(37,'jreyes',3,'192.168.8.42',1,'2026-06-23 04:35:00'),
(38,'acruz',1,'192.168.8.26',1,'2026-06-23 03:39:00'),
(39,'nsantos',2,'192.168.8.33',1,'2026-06-24 02:36:00'),
(40,'acruz',1,'192.168.8.58',0,'2026-06-24 03:07:00'),
(41,'nsantos',2,'192.168.8.38',1,'2026-06-25 03:39:00'),
(42,'nsantos',2,'192.168.8.22',1,'2026-06-25 02:14:00'),
(43,'jreyes',3,'192.168.8.28',1,'2026-06-25 03:42:00'),
(44,'jreyes',3,'192.168.8.30',1,'2026-06-26 08:03:00'),
(45,'jreyes',3,'192.168.8.26',1,'2026-06-26 03:48:00'),
(46,'jreyes',3,'192.168.8.56',1,'2026-06-29 04:30:00'),
(47,'nsantos',2,'192.168.8.47',1,'2026-06-30 05:21:00'),
(48,'nsantos',2,'192.168.8.28',1,'2026-06-29 23:36:00'),
(49,'jreyes',3,'192.168.8.33',1,'2026-06-30 00:53:00'),
(50,'jreyes',3,'192.168.8.46',1,'2026-06-30 07:14:00'),
(51,'acruz',1,'192.168.8.35',1,'2026-06-30 03:39:00'),
(52,'acruz',1,'192.168.8.30',1,'2026-06-30 00:27:00'),
(53,'nsantos',2,'192.168.8.37',1,'2026-07-01 00:02:00'),
(54,'nsantos',2,'192.168.8.54',1,'2026-07-02 01:28:00'),
(55,'jreyes',3,'192.168.8.47',0,'2026-07-02 02:18:00'),
(56,'nsantos',2,'192.168.8.60',1,'2026-07-03 08:51:00'),
(57,'nsantos',2,'192.168.8.57',1,'2026-07-03 05:30:00'),
(58,'nsantos',2,'192.168.8.26',1,'2026-07-04 06:33:00'),
(59,'jreyes',3,'192.168.8.26',1,'2026-07-04 06:57:00'),
(60,'jreyes',3,'192.168.8.50',0,'2026-07-04 03:27:00'),
(61,'nsantos',2,'192.168.8.24',1,'2026-07-06 01:01:00'),
(62,'jreyes',3,'192.168.8.21',1,'2026-07-05 23:16:00'),
(63,'jreyes',3,'192.168.8.59',1,'2026-07-06 06:07:00'),
(64,'nsantos',2,'192.168.8.25',1,'2026-07-07 08:25:00'),
(65,'jreyes',3,'192.168.8.53',1,'2026-07-07 05:43:00'),
(66,'nsantos',2,'192.168.8.55',1,'2026-07-08 01:32:00'),
(67,'nsantos',2,'192.168.8.26',1,'2026-07-08 03:22:00'),
(68,'jreyes',3,'192.168.8.50',1,'2026-07-08 07:59:00'),
(69,'acruz',1,'192.168.8.31',1,'2026-07-08 01:34:00'),
(70,'acruz',1,'192.168.8.44',1,'2026-07-08 00:23:00'),
(71,'acruz',1,'192.168.8.33',1,'2026-07-09 08:41:00'),
(72,'acruz',1,'192.168.8.59',1,'2026-07-09 07:18:00'),
(73,'jreyes',3,'192.168.8.40',0,'2026-07-10 06:06:00'),
(74,'nsantos',2,'192.168.8.51',1,'2026-07-13 02:56:00'),
(75,'jreyes',3,'192.168.8.38',1,'2026-07-13 02:57:00'),
(76,'jreyes',3,'192.168.8.37',1,'2026-07-14 05:39:00'),
(77,'jreyes',3,'192.168.8.32',1,'2026-07-16 02:24:00'),
(78,'jreyes',3,'192.168.8.25',1,'2026-07-16 03:11:00'),
(79,'nsantos',2,'192.168.8.54',1,'2026-07-17 08:27:00'),
(80,'nsantos',2,'192.168.8.21',1,'2026-07-17 05:04:00'),
(81,'nsantos',2,'192.168.8.35',0,'2026-07-17 04:27:00'),
(82,'jreyes',3,'192.168.8.24',0,'2026-07-20 06:55:00'),
(83,'acruz',1,'192.168.8.21',1,'2026-07-20 04:17:00'),
(84,'nsantos',2,'192.168.8.54',1,'2026-07-21 03:56:00'),
(85,'nsantos',2,'192.168.8.29',1,'2026-07-21 06:46:00'),
(86,'nsantos',2,'192.168.8.48',0,'2026-07-21 05:06:00'),
(87,'nsantos',2,'192.168.8.51',1,'2026-07-22 07:19:00'),
(88,'nsantos',2,'192.168.8.41',1,'2026-07-22 08:37:00'),
(89,'jreyes',3,'192.168.8.42',1,'2026-07-22 00:48:00'),
(90,'jreyes',3,'192.168.8.28',1,'2026-07-22 01:26:00'),
(91,'nsantos',2,'192.168.8.39',1,'2026-07-23 07:25:00'),
(92,'jreyes',3,'192.168.8.34',1,'2026-07-23 07:57:00'),
(93,'nsantos',2,'192.168.8.54',1,'2026-07-28 08:28:00'),
(94,'jreyes',3,'192.168.8.24',1,'2026-07-29 04:25:00'),
(95,'acruz',1,'192.168.8.55',1,'2026-07-29 08:29:00'),
(96,'nsantos',2,'192.168.8.32',1,'2026-07-31 08:21:00'),
(97,'nsantos',2,'192.168.8.43',1,'2026-07-31 00:55:00'),
(98,'nsantos',2,'192.168.8.21',1,'2026-08-01 01:07:00'),
(99,'nsantos',2,'192.168.8.24',1,'2026-08-03 08:40:00'),
(100,'jreyes',3,'192.168.8.35',1,'2026-08-03 01:25:00'),
(101,'acruz',1,'192.168.8.43',1,'2026-08-03 06:21:00'),
(102,'nsantos',2,'192.168.8.60',1,'2026-08-03 23:44:00'),
(103,'nsantos',2,'192.168.8.42',1,'2026-08-04 04:51:00'),
(104,'jreyes',3,'192.168.8.23',1,'2026-08-05 05:37:00'),
(105,'jreyes',3,'192.168.8.34',1,'2026-08-05 08:44:00'),
(106,'acruz',1,'192.168.8.31',1,'2026-08-05 04:01:00'),
(107,'nsantos',2,'192.168.8.53',1,'2026-08-06 07:27:00'),
(108,'acruz',1,'192.168.8.56',1,'2026-08-06 07:39:00'),
(109,'nsantos',2,'192.168.8.45',1,'2026-08-07 01:54:00'),
(110,'jreyes',3,'192.168.8.54',1,'2026-08-07 03:57:00'),
(111,'acruz',1,'192.168.8.56',1,'2026-08-07 05:00:00'),
(112,'nsantos',2,'192.168.8.42',1,'2026-08-08 08:02:00'),
(113,'nsantos',2,'192.168.8.29',1,'2026-08-08 05:21:00'),
(114,'acruz',1,'192.168.8.31',1,'2026-08-08 04:39:00'),
(115,'nsantos',2,'192.168.8.44',1,'2026-08-10 07:06:00'),
(116,'jreyes',3,'192.168.8.38',1,'2026-08-10 05:34:00'),
(117,'jreyes',3,'192.168.8.23',1,'2026-08-10 03:32:00'),
(118,'acruz',1,'192.168.8.28',1,'2026-08-09 23:57:00'),
(119,'acruz',1,'192.168.8.24',1,'2026-08-10 07:05:00'),
(120,'nsantos',2,'192.168.8.53',1,'2026-08-11 01:19:00'),
(121,'nsantos',2,'192.168.8.58',1,'2026-08-11 00:07:00'),
(122,'jreyes',3,'192.168.8.57',1,'2026-08-11 07:58:00'),
(123,'nsantos',2,'192.168.8.21',1,'2026-08-11 23:10:00'),
(124,'nsantos',2,'192.168.8.33',1,'2026-08-12 07:23:00'),
(125,'nsantos',2,'192.168.8.60',0,'2026-08-11 23:07:00'),
(126,'jreyes',3,'192.168.8.22',1,'2026-08-11 23:40:00'),
(127,'jreyes',3,'192.168.8.24',1,'2026-08-12 08:19:00'),
(128,'jreyes',3,'192.168.8.55',1,'2026-08-13 04:31:00'),
(129,'acruz',1,'192.168.8.25',1,'2026-08-13 08:34:00'),
(130,'jreyes',3,'192.168.8.60',1,'2026-08-14 04:08:00'),
(131,'jreyes',3,'192.168.8.53',1,'2026-08-14 06:22:00'),
(132,'nsantos',2,'192.168.8.44',1,'2026-08-15 08:46:00'),
(133,'nsantos',2,'192.168.8.49',1,'2026-08-15 01:51:00'),
(134,'nsantos',2,'192.168.8.37',1,'2026-08-17 02:24:00'),
(135,'jreyes',3,'192.168.8.21',1,'2026-08-17 03:06:00'),
(136,'nsantos',2,'192.168.8.46',1,'2026-08-18 02:43:00'),
(137,'nsantos',2,'192.168.8.21',1,'2026-08-19 08:04:00'),
(138,'jreyes',3,'192.168.8.58',1,'2026-08-19 03:37:00'),
(139,'jreyes',3,'192.168.8.44',1,'2026-08-19 00:09:00'),
(140,'acruz',1,'192.168.8.24',1,'2026-08-19 06:24:00'),
(141,'nsantos',2,'192.168.8.50',1,'2026-08-20 06:50:00'),
(142,'jreyes',3,'192.168.8.58',1,'2026-08-20 06:42:00'),
(143,'jreyes',3,'192.168.8.29',1,'2026-08-20 06:07:00'),
(144,'nsantos',2,'192.168.8.38',1,'2026-08-21 03:35:00'),
(145,'nsantos',2,'192.168.8.49',1,'2026-08-21 04:12:00'),
(146,'nsantos',2,'192.168.8.22',0,'2026-08-21 08:00:00'),
(147,'acruz',1,'192.168.8.57',1,'2026-08-21 06:43:00'),
(148,'jreyes',3,'192.168.8.44',1,'2026-08-22 02:22:00'),
(149,'jreyes',3,'192.168.8.57',1,'2026-08-22 01:23:00'),
(150,'acruz',1,'192.168.8.56',1,'2026-08-21 23:21:00'),
(151,'nsantos',2,'192.168.8.34',1,'2026-08-24 02:20:00'),
(152,'nsantos',2,'192.168.8.26',1,'2026-08-24 01:39:00'),
(153,'jreyes',3,'192.168.8.31',1,'2026-08-23 23:47:00'),
(154,'acruz',1,'192.168.8.36',1,'2026-08-24 01:02:00'),
(155,'jreyes',3,'192.168.8.51',1,'2026-08-25 04:24:00'),
(156,'nsantos',2,'192.168.8.25',1,'2026-08-25 23:17:00'),
(157,'jreyes',3,'192.168.8.54',1,'2026-08-26 08:59:00'),
(158,'jreyes',3,'192.168.8.35',1,'2026-08-26 02:03:00'),
(159,'nsantos',2,'192.168.8.41',1,'2026-08-27 02:48:00'),
(160,'nsantos',2,'192.168.8.47',1,'2026-08-27 02:04:00'),
(161,'jreyes',3,'192.168.8.40',1,'2026-08-27 03:17:00'),
(162,'jreyes',3,'192.168.8.25',0,'2026-08-27 01:26:00'),
(163,'jreyes',3,'192.168.8.48',1,'2026-08-28 07:41:00'),
(164,'nsantos',2,'192.168.8.45',1,'2026-08-29 05:45:00'),
(165,'nsantos',2,'192.168.8.41',1,'2026-08-31 07:15:00'),
(166,'nsantos',2,'192.168.8.32',1,'2026-08-31 00:43:00'),
(167,'jreyes',3,'192.168.8.43',1,'2026-08-31 04:29:00'),
(168,'jreyes',3,'192.168.8.45',1,'2026-08-31 05:30:00'),
(169,'nsantos',2,'192.168.8.23',1,'2026-09-01 08:13:00'),
(170,'jreyes',3,'192.168.8.22',1,'2026-09-01 04:03:00'),
(171,'acruz',1,'192.168.8.50',1,'2026-09-01 02:16:00'),
(172,'nsantos',2,'192.168.8.21',1,'2026-09-02 02:31:00'),
(173,'nsantos',2,'192.168.8.37',0,'2026-09-02 06:53:00'),
(174,'acruz',1,'192.168.8.53',1,'2026-09-02 07:28:00'),
(175,'jreyes',3,'192.168.8.49',1,'2026-09-03 03:20:00'),
(176,'acruz',1,'192.168.8.34',1,'2026-09-03 01:37:00'),
(177,'nsantos',2,'192.168.8.25',1,'2026-09-04 05:25:00'),
(178,'jreyes',3,'192.168.8.42',1,'2026-09-03 23:07:00'),
(179,'acruz',1,'192.168.8.32',1,'2026-09-04 07:47:00'),
(180,'acruz',1,'192.168.8.27',1,'2026-09-04 06:31:00'),
(181,'nsantos',2,'192.168.8.30',1,'2026-09-07 08:55:00'),
(182,'acruz',1,'192.168.8.41',1,'2026-09-07 07:11:00'),
(183,'nsantos',2,'192.168.8.49',1,'2026-09-08 05:20:00'),
(184,'acruz',1,'192.168.8.20',1,'2026-09-07 23:16:00'),
(185,'acruz',1,'192.168.8.42',0,'2026-09-08 02:01:00'),
(186,'nsantos',2,'192.168.8.34',1,'2026-09-09 05:51:00'),
(187,'nsantos',2,'192.168.8.46',1,'2026-09-09 03:43:00'),
(188,'jreyes',3,'192.168.8.41',1,'2026-09-09 04:45:00'),
(189,'acruz',1,'192.168.8.24',1,'2026-09-09 06:54:00'),
(190,'acruz',1,'192.168.8.26',1,'2026-09-09 05:34:00'),
(191,'nsantos',2,'192.168.8.37',1,'2026-09-10 07:42:00'),
(192,'nsantos',2,'192.168.8.54',1,'2026-09-10 00:12:00'),
(193,'jreyes',3,'192.168.8.21',1,'2026-09-10 00:25:00'),
(194,'nsantos',2,'192.168.8.59',1,'2026-09-11 05:30:00'),
(195,'nsantos',2,'192.168.8.30',1,'2026-09-11 00:35:00'),
(196,'jreyes',3,'192.168.8.42',1,'2026-09-11 00:35:00'),
(197,'jreyes',3,'192.168.8.47',1,'2026-09-11 08:43:00'),
(198,'acruz',1,'192.168.8.38',1,'2026-09-11 01:28:00'),
(199,'nsantos',2,'192.168.8.50',1,'2026-09-12 04:29:00'),
(200,'jreyes',3,'192.168.8.31',1,'2026-09-12 06:19:00'),
(201,'jreyes',3,'192.168.8.38',1,'2026-09-12 06:34:00'),
(202,'nsantos',2,'192.168.8.60',1,'2026-09-14 06:10:00'),
(203,'nsantos',2,'192.168.8.21',1,'2026-09-14 08:42:00'),
(204,'nsantos',2,'192.168.8.35',1,'2026-09-15 06:05:00'),
(205,'acruz',1,'192.168.8.25',1,'2026-09-15 04:30:00'),
(206,'acruz',1,'192.168.8.42',1,'2026-09-15 03:19:00'),
(207,'nsantos',2,'192.168.8.47',1,'2026-09-16 06:39:00'),
(208,'jreyes',3,'192.168.8.55',1,'2026-09-16 02:30:00'),
(209,'acruz',1,'192.168.8.49',1,'2026-09-16 04:38:00'),
(210,'nsantos',2,'192.168.8.60',1,'2026-09-17 03:20:00'),
(211,'jreyes',3,'192.168.8.31',1,'2026-09-16 23:15:00'),
(212,'nsantos',2,'192.168.8.44',1,'2026-09-18 07:21:00'),
(213,'jreyes',3,'192.168.8.26',1,'2026-09-17 23:35:00'),
(214,'nsantos',2,'192.168.8.55',1,'2026-09-18 23:38:00'),
(215,'nsantos',2,'192.168.8.55',1,'2026-09-19 08:35:00'),
(216,'jreyes',3,'192.168.8.46',1,'2026-09-18 23:02:00'),
(217,'acruz',1,'192.168.8.44',1,'2026-09-18 23:04:00'),
(218,'nsantos',2,'192.168.8.52',1,'2026-09-21 07:53:00'),
(219,'jreyes',3,'192.168.8.33',1,'2026-09-21 07:41:00'),
(220,'jreyes',3,'192.168.8.38',1,'2026-09-21 04:21:00'),
(221,'acruz',1,'192.168.8.25',1,'2026-09-21 01:37:00'),
(222,'acruz',1,'192.168.8.55',0,'2026-09-21 08:55:00'),
(223,'jreyes',3,'192.168.8.40',1,'2026-09-22 03:54:00'),
(224,'jreyes',3,'192.168.8.42',1,'2026-09-22 02:23:00'),
(225,'acruz',1,'192.168.8.57',1,'2026-09-21 23:57:00'),
(226,'nsantos',2,'192.168.8.44',1,'2026-09-23 07:13:00'),
(227,'nsantos',2,'192.168.8.43',1,'2026-09-23 06:59:00'),
(228,'jreyes',3,'192.168.8.29',1,'2026-09-23 08:30:00'),
(229,'jreyes',3,'192.168.8.37',1,'2026-09-23 06:30:00'),
(230,'acruz',1,'192.168.8.49',1,'2026-09-23 01:35:00'),
(231,'nsantos',2,'192.168.8.22',1,'2026-09-25 02:44:00'),
(232,'jreyes',3,'192.168.8.58',1,'2026-09-25 05:17:00'),
(233,'nsantos',2,'192.168.8.44',1,'2026-09-26 09:00:00'),
(234,'jreyes',3,'192.168.8.27',1,'2026-09-26 05:21:00'),
(235,'jreyes',3,'192.168.8.31',1,'2026-09-26 03:02:00'),
(236,'acruz',1,'192.168.8.58',1,'2026-09-26 06:25:00'),
(237,'acruz',1,'192.168.8.53',0,'2026-09-26 07:56:00'),
(238,'nsantos',2,'192.168.8.45',1,'2026-09-28 03:22:00'),
(239,'jreyes',3,'192.168.8.33',1,'2026-09-28 02:24:00'),
(240,'acruz',1,'192.168.8.40',1,'2026-09-28 04:16:00'),
(241,'nsantos',2,'192.168.8.56',1,'2026-09-29 08:57:00'),
(242,'nsantos',2,'192.168.8.57',1,'2026-09-29 05:36:00'),
(243,'jreyes',3,'192.168.8.31',1,'2026-09-29 01:53:00'),
(244,'acruz',1,'192.168.8.26',1,'2026-09-29 05:49:00'),
(245,'nsantos',2,'192.168.8.39',1,'2026-09-30 02:29:00'),
(246,'nsantos',2,'192.168.8.50',1,'2026-09-30 03:23:00'),
(247,'jreyes',3,'192.168.8.53',1,'2026-09-30 00:31:00'),
(248,'acruz',1,'192.168.8.39',1,'2026-09-29 23:13:00'),
(249,'acruz',1,'192.168.8.40',1,'2026-09-30 08:28:00'),
(250,'nsantos',2,'192.168.8.52',1,'2026-10-01 07:12:00'),
(251,'jreyes',3,'192.168.8.56',1,'2026-09-30 23:02:00'),
(252,'acruz',1,'192.168.8.31',1,'2026-10-01 02:26:00'),
(253,'nsantos',2,'192.168.8.29',1,'2026-10-01 23:51:00'),
(254,'jreyes',3,'192.168.8.31',1,'2026-10-02 08:29:00'),
(255,'jreyes',3,'192.168.8.27',1,'2026-10-02 00:06:00'),
(256,'jreyes',3,'192.168.8.33',0,'2026-10-02 02:18:00'),
(257,'acruz',1,'192.168.8.27',1,'2026-10-02 01:11:00'),
(258,'jreyes',3,'192.168.8.50',1,'2026-10-03 00:33:00'),
(259,'nsantos',2,'192.168.8.41',1,'2026-10-05 04:51:00'),
(260,'nsantos',2,'192.168.8.29',0,'2026-10-05 05:18:00'),
(261,'jreyes',3,'192.168.8.25',1,'2026-10-05 08:02:00'),
(262,'jreyes',3,'192.168.8.43',1,'2026-10-05 03:52:00'),
(263,'acruz',1,'192.168.8.38',1,'2026-10-05 07:17:00'),
(264,'acruz',1,'192.168.8.41',1,'2026-10-05 05:36:00'),
(265,'nsantos',2,'192.168.8.22',1,'2026-10-06 05:26:00'),
(266,'nsantos',2,'192.168.8.51',1,'2026-10-06 03:13:00'),
(267,'jreyes',3,'192.168.8.54',1,'2026-10-06 05:52:00'),
(268,'acruz',1,'192.168.8.48',1,'2026-10-06 00:51:00'),
(269,'nsantos',2,'192.168.8.51',1,'2026-10-06 23:49:00'),
(270,'jreyes',3,'192.168.8.56',1,'2026-10-07 01:24:00'),
(271,'acruz',1,'192.168.8.28',1,'2026-10-07 04:10:00'),
(272,'jreyes',3,'192.168.8.54',1,'2026-10-08 00:05:00'),
(273,'acruz',1,'192.168.8.55',1,'2026-10-08 02:11:00'),
(274,'nsantos',2,'192.168.8.35',1,'2026-10-09 07:37:00'),
(275,'nsantos',2,'192.168.8.53',1,'2026-10-09 05:11:00'),
(276,'jreyes',3,'192.168.8.54',1,'2026-10-09 04:38:00'),
(277,'jreyes',3,'192.168.8.32',1,'2026-10-09 00:47:00'),
(278,'jreyes',3,'192.168.8.51',1,'2026-10-10 03:30:00'),
(279,'nsantos',2,'192.168.8.39',1,'2026-10-12 03:10:00'),
(280,'nsantos',2,'127.0.0.1',1,'2026-10-12 13:40:39'),
(281,'acruz',1,'127.0.0.1',1,'2026-10-12 13:40:39'),
(282,'nsantos',2,'127.0.0.1',1,'2026-10-12 13:41:00');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine_stock`
--

DROP TABLE IF EXISTS `medicine_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine_stock` (
  `stock_id` int(11) NOT NULL AUTO_INCREMENT,
  `medicine_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Running total. inventory_transactions is the source of truth',
  `reorder_level` decimal(10,2) NOT NULL DEFAULT 0.00,
  `expiry_date` date DEFAULT NULL,
  `stock_status` enum('high','low','out_of_stock') GENERATED ALWAYS AS (case when `quantity` <= 0 then 'out_of_stock' when `quantity` <= `reorder_level` then 'low' else 'high' end) STORED,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`stock_id`),
  UNIQUE KEY `uq_medicine_stock_medicine` (`medicine_id`),
  KEY `fk_medicine_stock_updated_by` (`updated_by`),
  KEY `idx_medicine_stock_status` (`stock_status`),
  KEY `idx_medicine_stock_expiry` (`expiry_date`),
  CONSTRAINT `fk_medicine_stock_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_medicine_stock_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_medicine_stock_qty` CHECK (`quantity` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_stock`
--

LOCK TABLES `medicine_stock` WRITE;
/*!40000 ALTER TABLE `medicine_stock` DISABLE KEYS */;
INSERT INTO `medicine_stock` VALUES
(1,1,418.00,20.00,NULL,'high',3,'2026-10-12 13:40:04'),
(2,2,466.00,20.00,NULL,'high',3,'2026-10-12 13:40:04'),
(3,3,500.00,20.00,NULL,'high',3,'2026-10-12 13:39:58'),
(4,4,289.00,20.00,NULL,'high',2,'2026-10-12 13:40:04'),
(5,5,488.00,20.00,NULL,'high',3,'2026-10-12 13:40:01'),
(6,6,490.00,20.00,NULL,'high',3,'2026-10-12 13:40:04'),
(7,7,800.00,20.00,NULL,'high',3,'2026-10-12 13:39:58'),
(8,8,794.00,100.00,NULL,'high',2,'2026-10-12 13:40:03'),
(9,9,290.00,50.00,NULL,'high',3,'2026-10-12 13:40:04'),
(10,10,495.00,50.00,NULL,'high',2,'2026-10-12 13:40:04'),
(11,11,758.00,50.00,NULL,'high',3,'2026-10-12 13:40:03');
/*!40000 ALTER TABLE `medicine_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicines`
--

DROP TABLE IF EXISTS `medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicines` (
  `medicine_id` int(11) NOT NULL AUTO_INCREMENT,
  `medicine_name` varchar(150) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `unit` varchar(50) NOT NULL COMMENT 'tablet, capsule, bottle, sachet',
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`medicine_id`),
  UNIQUE KEY `uq_medicines_name` (`medicine_name`),
  KEY `idx_medicines_category` (`category_id`),
  CONSTRAINT `fk_medicines_category` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES
(1,'Paracetamol 500mg',1,'tablet','General pain and fever reliever',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(2,'Mefenamic Acid 500mg',1,'tablet','Menstrual cramps and pain',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(3,'Amoxicillin 500mg',2,'capsule','Broad-spectrum antibiotic',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(4,'Cetirizine 10mg',3,'tablet','Antihistamine for allergic reactions',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(5,'Antacid (Kremil-S)',4,'tablet','Relieves stomachache and acidity',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(6,'Oral Rehydration Salts',5,'sachet','Fluid and electrolyte replacement',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(7,'Betadine Solution',6,'bottle','Wound cleaning antiseptic',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(8,'Ibuprofen 400mg',1,'tablet',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(9,'Loperamide 2mg',4,'capsule',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(10,'Loratadine 10mg',3,'tablet',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(11,'Carbocisteine 500mg',NULL,'capsule',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL);
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_special_cases`
--

DROP TABLE IF EXISTS `patient_special_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_special_cases` (
  `patient_special_case_id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `special_case_type_id` int(11) NOT NULL,
  `origin_visit_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `flagged_by` int(11) DEFAULT NULL,
  `flagged_at` datetime NOT NULL DEFAULT current_timestamp(),
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `active_type_key` int(11) GENERATED ALWAYS AS (if(`active`,`special_case_type_id`,NULL)) STORED,
  PRIMARY KEY (`patient_special_case_id`),
  UNIQUE KEY `uq_psc_active` (`patient_id`,`active_type_key`),
  KEY `fk_psc_origin_visit` (`origin_visit_id`),
  KEY `fk_psc_flagged_by` (`flagged_by`),
  KEY `idx_psc_patient` (`patient_id`,`active`),
  KEY `idx_psc_type` (`special_case_type_id`),
  CONSTRAINT `fk_psc_flagged_by` FOREIGN KEY (`flagged_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_psc_origin_visit` FOREIGN KEY (`origin_visit_id`) REFERENCES `visits` (`visit_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_psc_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_psc_type` FOREIGN KEY (`special_case_type_id`) REFERENCES `special_case_types` (`special_case_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_special_cases`
--

LOCK TABLES `patient_special_cases` WRITE;
/*!40000 ALTER TABLE `patient_special_cases` DISABLE KEYS */;
INSERT INTO `patient_special_cases` VALUES
(1,6,7,NULL,NULL,2,'2026-06-11 08:04:00',1,7),
(2,23,4,NULL,'Panic episodes during exams',2,'2026-06-30 04:01:00',1,4),
(3,32,6,NULL,'Check BP every visit',2,'2026-09-15 23:55:00',1,6),
(4,10,3,NULL,'Seafood',2,'2026-07-28 00:44:00',1,3),
(5,11,5,NULL,'Uses salbutamol inhaler',2,'2026-07-03 01:32:00',1,5),
(6,1,3,NULL,'Penicillin — rash',2,'2026-08-13 02:18:00',1,3);
/*!40000 ALTER TABLE `patient_special_cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_types`
--

DROP TABLE IF EXISTS `patient_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_types` (
  `patient_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`patient_type_id`),
  UNIQUE KEY `uq_patient_types_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_types`
--

LOCK TABLES `patient_types` WRITE;
/*!40000 ALTER TABLE `patient_types` DISABLE KEYS */;
INSERT INTO `patient_types` VALUES
(1,'Student','Currently enrolled ISU student',1),
(2,'Faculty','Teaching staff / faculty member',1),
(3,'Non-Teaching Staff (NASA)','Non-academic staff personnel',1),
(4,'Visitor','Walk-in guest, parent or campus visitor with no ISU ID number',1);
/*!40000 ALTER TABLE `patient_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_number` varchar(50) DEFAULT NULL COMMENT 'Student/employee number. Visitors get VIS-YYYY-NNNN',
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `sex` varchar(30) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL COMMENT 'Age is derived, never stored',
  `civil_status` varchar(30) DEFAULT NULL COMMENT 'Printed on the Medical Certificate',
  `contact_number` varchar(30) DEFAULT NULL,
  `patient_type_id` int(11) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL COMMENT 'Students and Faculty/NASA only',
  `program` varchar(150) DEFAULT NULL,
  `year_level` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `uq_patients_number` (`patient_number`),
  KEY `idx_patients_name` (`last_name`,`first_name`),
  KEY `idx_patients_number` (`patient_number`),
  KEY `idx_patients_type` (`patient_type_id`),
  KEY `idx_patients_deleted` (`deleted_at`),
  CONSTRAINT `fk_patients_type` FOREIGN KEY (`patient_type_id`) REFERENCES `patient_types` (`patient_type_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES
(1,'2021-00232','Trisha','Reyes','Agustin','Female','2005-07-03','Single','0975 827 8396',1,'CoE','BS Electrical Engineering','2nd Year','2026-08-13 02:18:00','2026-08-13 02:18:00',NULL),
(2,'2025-08152','Ian','Ancheta','Cruz','Male','2006-11-12','Single','0967 630 7239',1,'CCSICT','BS Entertainment and Multimedia Computing','3rd Year','2026-08-07 03:20:00','2026-08-07 03:20:00',NULL),
(3,'2026-00609','Paolo','Pagaduan','Ramos','Male','2007-02-25','Single','0958 410 7941',1,'CoE','BS Electrical Engineering','2nd Year','2026-06-01 00:59:00','2026-06-01 00:59:00',NULL),
(4,'2023-07395','Paolo','Valdez','Pagaduan','Male','2005-08-13','Single','0940 349 2394',1,'CCJE','BS Criminology','3rd Year','2026-06-01 00:58:00','2026-06-01 00:58:00',NULL),
(5,'2025-09977','Carlo',NULL,'Dumlao','Male','2005-10-04','Single','0978 002 8053',1,'CON','BS Nursing','2nd Year','2026-08-25 07:22:00','2026-08-25 07:22:00',NULL),
(6,'2021-02764','Ryan',NULL,'Manalo','Male','2007-07-12','Single','0957 354 9785',1,'CA','BS Agriculture','2nd Year','2026-06-11 08:04:00','2026-06-11 08:04:00',NULL),
(7,'2024-08293','Jayson',NULL,'Lazaro','Male','2004-04-08','Single','0945 416 2672',1,'CCSICT','BS Information Technology','3rd Year','2026-06-01 00:57:00','2026-06-01 00:57:00',NULL),
(8,'2026-04750','Gabriel',NULL,'Salazar','Male','2005-04-06','Single','0976 058 4718',1,'CCSICT','BS Computer Science','3rd Year','2026-06-01 00:58:00','2026-06-01 00:58:00',NULL),
(9,'2021-03475','Trisha',NULL,'Navarro','Female','2004-06-20','Single','0976 050 4132',1,'CoE','BS Electrical Engineering','5th Year','2026-07-21 06:00:00','2026-07-21 06:00:00',NULL),
(10,'2026-02063','Patricia','Macaraeg','Cabrera','Female','2005-05-19','Single','0990 282 2282',1,'CCSICT','BS Entertainment and Multimedia Computing','4th Year','2026-07-28 00:44:00','2026-07-28 00:44:00',NULL),
(11,'2021-06504','Lorenzo','Balisi','Ronquillo','Male','2007-01-21','Single','0966 769 2269',1,'CoE','BS Civil Engineering','2nd Year','2026-07-03 01:32:00','2026-07-03 01:32:00',NULL),
(12,'2022-02722','Mark','Pascual','Aquino','Male','2005-07-07','Single','0953 551 5312',1,'CCJE','BS Criminology','4th Year','2026-08-12 03:05:00','2026-08-12 03:05:00',NULL),
(13,'2025-02873','Bryan','Bautista','Dumlao','Male','2004-12-20','Single','0916 396 7600',1,'CON','BS Nursing','4th Year','2026-08-25 01:40:00','2026-08-25 01:40:00',NULL),
(14,'2025-09850','Angelo','Ganotisi','Valdez','Male','2006-10-24','Single','0952 837 8243',1,'CAS','BS Biology','1st Year','2026-08-18 03:58:00','2026-08-18 03:58:00',NULL),
(15,'2021-05212','Princess','Pagaduan','Calimag','Female','2006-02-21','Single','0939 065 5336',1,'CED','Bachelor of Secondary Education','3rd Year','2026-10-08 07:12:00','2026-10-08 07:12:00',NULL),
(16,'2024-01153','Hazel',NULL,'Tamayo','Female','2005-01-22','Single','0997 722 7252',1,'CAS','BS Biology','4th Year','2026-06-01 00:57:00','2026-06-01 00:57:00',NULL),
(17,'2023-07976','Jerome','Ramirez','Dumlao','Male','2003-11-03','Single','0969 466 3873',1,'CCJE','BS Criminology','4th Year','2026-06-01 00:59:00','2026-06-01 00:59:00',NULL),
(18,'2024-08171','Nathaniel',NULL,'Soriano','Male','2006-10-13','Single','0942 798 7368',1,'CA','BS Agricultural and Biosystems Engineering','2nd Year','2026-08-03 04:14:00','2026-08-03 04:14:00',NULL),
(19,'F-2873','Carlo','Ramirez','Tolentino','Male','1993-05-20','Widowed','0933 092 9064',2,'CON',NULL,NULL,'2026-08-06 05:00:00','2026-08-06 05:00:00',NULL),
(20,'2023-01344','Liza',NULL,'Castillo','Female','2006-09-09','Single','0941 694 5493',1,'CBM','BS Accountancy','2nd Year','2026-06-27 02:18:00','2026-06-27 02:18:00',NULL),
(21,'E-6210','Elijah','Gonzales','Balisi','Male','1985-08-13','Widowed','0991 704 4545',3,'Library',NULL,NULL,'2026-06-01 00:59:00','2026-06-01 00:59:00',NULL),
(22,'2023-06025','Ella','Tamayo','Flores','Female','2008-09-19','Single','0949 101 3087',1,'CED','Bachelor of Elementary Education','1st Year','2026-08-03 00:12:00','2026-08-03 00:12:00',NULL),
(23,'2024-06072','Mika','Dela Cruz','Tabago','Female','2006-03-05','Single','0984 151 1548',1,'CA','BS Agriculture','2nd Year','2026-06-30 04:01:00','2026-06-30 04:01:00',NULL),
(24,'2025-09579','Hazel','Salazar','Bautista','Female','2007-11-19','Single','0966 903 9042',1,'CED','Bachelor of Secondary Education','2nd Year','2026-06-03 08:13:00','2026-06-03 08:13:00',NULL),
(25,'2026-05538','Erica','Bautista','Zamora','Female','2004-03-12','Single','0978 834 8627',1,'CAS','BS Biology','4th Year','2026-09-01 00:18:00','2026-09-01 00:18:00',NULL),
(26,'2023-00963','Elijah','Flores','Garcia','Male','2006-10-16','Single','0980 100 3109',1,'CBM','BS Accountancy','3rd Year','2026-06-01 00:57:00','2026-06-01 00:57:00',NULL),
(27,'2026-08595','Andrea','Manalo','Villanueva','Female','2007-06-27','Single','0983 256 6691',1,'CED','Bachelor of Secondary Education','2nd Year','2026-06-01 00:59:00','2026-06-01 00:59:00',NULL),
(28,'2024-07840','Rodel','Umali','Manalo','Male','2005-01-09','Single','0995 658 2852',1,'CCSICT','BS Computer Science','3rd Year','2026-06-18 07:05:00','2026-06-18 07:05:00',NULL),
(29,'2022-07604','Jayson',NULL,'Yabut','Male','2005-06-06','Single','0983 618 1830',1,'CA','BS Agricultural and Biosystems Engineering','4th Year','2026-09-25 05:54:00','2026-09-25 05:54:00',NULL),
(30,'2022-08433','Dennis','Castillo','Valdez','Male','2006-12-25','Single','0938 953 8785',1,'CCJE','BS Criminology','2nd Year','2026-08-11 23:30:00','2026-08-11 23:30:00',NULL),
(31,'F-5935','Joanna','Sison','Mendoza','Female','1961-07-19','Single','0937 360 8844',2,'CoE',NULL,NULL,'2026-06-01 00:57:00','2026-06-01 00:57:00',NULL),
(32,NULL,'Rodel','Macaraeg','Torres','Male','1968-02-06','Single','0981 379 8420',4,NULL,NULL,NULL,'2026-09-15 23:55:00','2026-09-15 23:55:00',NULL),
(33,'2024-03642','Lovely',NULL,'Gaspar','Female','2004-05-02','Single','0998 217 4144',1,'CoE','BS Electrical Engineering','4th Year','2026-07-31 23:33:00','2026-07-31 23:33:00',NULL),
(34,'2026-03588','Nicole',NULL,'Villanueva','Female','2006-03-13','Single','0958 600 7213',1,'CA','BS Agriculture','2nd Year','2026-09-24 04:29:00','2026-09-24 04:29:00',NULL),
(35,'2023-02167','Patricia','Cruz','Bulusan','Female','2007-08-12','Single','0985 831 7910',1,'CCSICT','BS Information Technology','1st Year','2026-07-09 06:26:00','2026-07-09 06:26:00',NULL),
(36,'2022-09755','Bea','Lopez','Dumlao','Female','2008-12-10','Single','0928 383 4102',1,'CAS','BS Psychology','1st Year','2026-09-12 03:50:00','2026-09-12 03:50:00',NULL),
(37,'2024-08114','Rafael','Tamayo','Lopez','Male','2007-11-11','Single','0952 661 3575',1,'CED','Bachelor of Elementary Education','2nd Year','2026-06-11 01:39:00','2026-06-11 01:39:00',NULL),
(38,'E-6778','Maria',NULL,'Santos','Female','1967-10-21','Single','0951 059 4299',3,'Registrar',NULL,NULL,'2026-08-04 23:54:00','2026-08-04 23:54:00',NULL),
(39,NULL,'Bryan','Ignacio','Dumlao','Male','1973-07-21','Single','0983 985 8991',4,NULL,NULL,NULL,'2026-07-10 05:04:00','2026-07-10 05:04:00',NULL),
(40,'2022-00326','Jasmine','Tabago','Manalo','Female','2005-10-19','Single','0996 663 7486',1,'CED','Bachelor of Secondary Education','4th Year','2026-10-12 05:33:57','2026-10-12 05:33:57',NULL);
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `special_case_types`
--

DROP TABLE IF EXISTS `special_case_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_case_types` (
  `special_case_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `case_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`special_case_type_id`),
  UNIQUE KEY `uq_special_case_types_name` (`case_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_case_types`
--

LOCK TABLES `special_case_types` WRITE;
/*!40000 ALTER TABLE `special_case_types` DISABLE KEYS */;
INSERT INTO `special_case_types` VALUES
(1,'PWD','Person with disability — priority handling',1),
(2,'Senior Citizen','Senior citizen — priority handling',1),
(3,'Allergy','Known allergy — record the allergen in notes',1),
(4,'Anxiety','History of anxiety or panic episodes',1),
(5,'Asthma','History of asthma',1),
(6,'Hypertension','History of high blood pressure — check BP every visit',1),
(7,'Other Special Case','Catch-all — specify details in the notes field',1);
/*!40000 ALTER TABLE `special_case_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_request_items`
--

DROP TABLE IF EXISTS `stock_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_request_items` (
  `request_item_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `item_type` enum('medicine','supply') NOT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `supply_id` int(11) DEFAULT NULL,
  `requested_quantity` decimal(10,2) NOT NULL,
  `approved_quantity` decimal(10,2) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`request_item_id`),
  KEY `idx_sri_request` (`request_id`),
  KEY `idx_sri_medicine` (`medicine_id`),
  KEY `idx_sri_supply` (`supply_id`),
  CONSTRAINT `fk_sri_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`),
  CONSTRAINT `fk_sri_request` FOREIGN KEY (`request_id`) REFERENCES `stock_requests` (`request_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sri_supply` FOREIGN KEY (`supply_id`) REFERENCES `supplies` (`supply_id`),
  CONSTRAINT `chk_sri_item_type` CHECK (`item_type` = 'medicine' and `medicine_id` is not null and `supply_id` is null or `item_type` = 'supply' and `supply_id` is not null and `medicine_id` is null),
  CONSTRAINT `chk_sri_qty` CHECK (`requested_quantity` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_request_items`
--

LOCK TABLES `stock_request_items` WRITE;
/*!40000 ALTER TABLE `stock_request_items` DISABLE KEYS */;
INSERT INTO `stock_request_items` VALUES
(1,1,'supply',NULL,6,200.00,200.00,'Out of stock'),
(2,1,'medicine',3,NULL,500.00,500.00,'Out of stock'),
(3,1,'medicine',5,NULL,500.00,500.00,'Out of stock'),
(4,1,'medicine',7,NULL,800.00,800.00,'Out of stock'),
(5,1,'medicine',11,NULL,800.00,800.00,'Out of stock'),
(6,1,'medicine',4,NULL,300.00,300.00,'Out of stock'),
(7,1,'supply',NULL,4,200.00,200.00,'Out of stock'),
(8,1,'supply',NULL,2,100.00,100.00,'Out of stock'),
(9,1,'supply',NULL,7,100.00,100.00,'Out of stock'),
(10,1,'medicine',8,NULL,800.00,800.00,'Out of stock'),
(11,1,'supply',NULL,5,100.00,100.00,'Out of stock'),
(12,1,'medicine',9,NULL,300.00,300.00,'Out of stock'),
(13,1,'medicine',10,NULL,500.00,500.00,'Out of stock'),
(14,1,'medicine',2,NULL,500.00,500.00,'Out of stock'),
(15,1,'medicine',6,NULL,500.00,500.00,'Out of stock'),
(16,1,'medicine',1,NULL,500.00,500.00,'Out of stock'),
(17,1,'supply',NULL,1,100.00,100.00,'Out of stock'),
(18,1,'supply',NULL,3,200.00,200.00,'Out of stock'),
(19,2,'medicine',3,NULL,200.00,NULL,'For referral cases'),
(20,3,'supply',NULL,7,300.00,NULL,'Flu season');
/*!40000 ALTER TABLE `stock_request_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_requests`
--

DROP TABLE IF EXISTS `stock_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `requested_by` int(11) NOT NULL,
  `request_date` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('draft','pending','approved','denied','completed') NOT NULL DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `received_by` int(11) DEFAULT NULL COMMENT 'Clinic staff who confirmed the delivery',
  `received_at` datetime DEFAULT NULL,
  `admin_response` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `fk_sr_requested_by` (`requested_by`),
  KEY `fk_sr_approved_by` (`approved_by`),
  KEY `fk_sr_received_by` (`received_by`),
  KEY `idx_sr_status` (`status`),
  KEY `idx_sr_date` (`request_date`),
  CONSTRAINT `fk_sr_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_received_by` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_requests`
--

LOCK TABLES `stock_requests` WRITE;
/*!40000 ALTER TABLE `stock_requests` DISABLE KEYS */;
INSERT INTO `stock_requests` VALUES
(1,3,'2026-05-30 08:16:00','completed',1,'2026-06-01 05:16:00',3,'2026-06-02 14:16:00','Approved','Running low'),
(2,2,'2026-09-30 01:00:00','denied',1,'2026-10-01 06:00:00',NULL,NULL,'Antibiotics are prescribed by the doctor only','Antibiotic stock'),
(3,4,'2026-10-12 13:40:04','pending',NULL,NULL,NULL,NULL,NULL,'Rainy season');
/*!40000 ALTER TABLE `stock_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplies`
--

DROP TABLE IF EXISTS `supplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplies` (
  `supply_id` int(11) NOT NULL AUTO_INCREMENT,
  `supply_name` varchar(150) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `unit` varchar(50) NOT NULL COMMENT 'pcs, pair, roll, box',
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`supply_id`),
  UNIQUE KEY `uq_supplies_name` (`supply_name`),
  KEY `idx_supplies_category` (`category_id`),
  CONSTRAINT `fk_supplies_category` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplies`
--

LOCK TABLES `supplies` WRITE;
/*!40000 ALTER TABLE `supplies` DISABLE KEYS */;
INSERT INTO `supplies` VALUES
(1,'Sterile Gauze 4x4',7,'pcs','Sterile gauze for wound dressing',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(2,'Elastic Bandage 3-inch',7,'roll','Elastic bandage roll',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(3,'Surgical Gloves (M)',8,'pair','Medium-size surgical gloves',1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(4,'Cotton Balls',7,'pack',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(5,'Isopropyl Alcohol 70%',6,'bottle',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(6,'Adhesive Bandage Strips',7,'piece',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL),
(7,'Face Mask',8,'piece',NULL,1,'2026-06-01 00:00:00','2026-10-12 13:40:05',NULL);
/*!40000 ALTER TABLE `supplies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supply_stock`
--

DROP TABLE IF EXISTS `supply_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `supply_stock` (
  `supply_stock_id` int(11) NOT NULL AUTO_INCREMENT,
  `supply_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reorder_level` decimal(10,2) NOT NULL DEFAULT 0.00,
  `expiry_date` date DEFAULT NULL,
  `stock_status` enum('high','low','out_of_stock') GENERATED ALWAYS AS (case when `quantity` <= 0 then 'out_of_stock' when `quantity` <= `reorder_level` then 'low' else 'high' end) STORED,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`supply_stock_id`),
  UNIQUE KEY `uq_supply_stock_supply` (`supply_id`),
  KEY `fk_supply_stock_updated_by` (`updated_by`),
  KEY `idx_supply_stock_status` (`stock_status`),
  KEY `idx_supply_stock_expiry` (`expiry_date`),
  CONSTRAINT `fk_supply_stock_supply` FOREIGN KEY (`supply_id`) REFERENCES `supplies` (`supply_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_supply_stock_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_supply_stock_qty` CHECK (`quantity` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supply_stock`
--

LOCK TABLES `supply_stock` WRITE;
/*!40000 ALTER TABLE `supply_stock` DISABLE KEYS */;
INSERT INTO `supply_stock` VALUES
(1,1,100.00,20.00,NULL,'high',3,'2026-10-12 13:39:58'),
(2,2,97.00,20.00,NULL,'high',2,'2026-10-12 13:40:03'),
(3,3,200.00,20.00,NULL,'high',3,'2026-10-12 13:39:58'),
(4,4,194.00,20.00,NULL,'high',2,'2026-10-12 13:40:02'),
(5,5,94.00,10.00,NULL,'high',2,'2026-10-12 13:40:02'),
(6,6,188.00,100.00,NULL,'high',2,'2026-10-12 13:40:02'),
(7,7,75.00,100.00,NULL,'low',2,'2026-10-12 13:40:04');
/*!40000 ALTER TABLE `supply_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `value_type` enum('int','bool','string','json') NOT NULL DEFAULT 'string',
  `description` varchar(255) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uq_system_settings_name` (`setting_name`),
  KEY `fk_system_settings_updated_by` (`updated_by`),
  CONSTRAINT `fk_system_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES
(1,'soft_delete_days','90','int','Days a soft-deleted record stays recoverable',NULL,'2026-10-12 13:39:53'),
(2,'failed_login_limit','5','int','Failed sign-ins before the account locks',NULL,'2026-10-12 13:39:53'),
(3,'lockout_minutes','15','int','How long an account stays locked',NULL,'2026-10-12 13:39:53'),
(4,'min_password_length','8','int','Minimum password length',NULL,'2026-10-12 13:39:53'),
(5,'password_symbol_required','1','bool','Require at least one special character',NULL,'2026-10-12 13:39:53'),
(6,'password_reset_email','1','bool','Allow password reset by email link',NULL,'2026-10-12 13:39:53'),
(7,'backup_schedule','daily_12am','string','Automated backup schedule',NULL,'2026-10-12 13:39:53'),
(8,'backup_retention','30','int','Days to keep automated backups',NULL,'2026-10-12 13:39:53'),
(9,'maintenance_mode','0','bool','Block sign-in while maintenance is running',NULL,'2026-10-12 13:39:53'),
(10,'clinic_timezone','Asia/Manila','string','Display timezone — storage is always UTC',NULL,'2026-10-12 13:39:53');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'bcrypt or argon2 — never plaintext',
  `role` enum('admin','nurse') NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete — purged after system_settings.soft_delete_days',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_deleted` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Ana',NULL,'Cruz','acruz','$2b$12$v2WOI/JpUrcqxH3lYZ2hae6VIR3Da4lSvFnVBYhJHnkXS./1lQeiW','admin','acruz@example.com','active','2026-10-12 05:40:39','2026-05-31 23:00:00','2026-10-12 13:40:39',NULL),
(2,'Maria',NULL,'Santos','nsantos','$2b$12$5uAX2mDxVZq9jJzXF/ySLuQQeG2vs1kV2jldMEvdZibdvU5n4R/iC','nurse','nsantos@example.com','active','2026-10-12 05:41:00','2026-05-31 23:00:00','2026-10-12 13:41:00',NULL),
(3,'Jose',NULL,'Reyes','jreyes','$2b$12$kTxopzCScdRLP7vD/ccsWedlHwGd8ge7orP94.A43pJOT1qsXmkrO','nurse',NULL,'active','2026-10-12 13:39:56','2026-05-31 23:00:00','2026-10-12 13:40:05',NULL),
(4,'Liza',NULL,'Mercado','lmercado','$2b$12$ReuhVTAUqPjlZgp2Cm0TReoZDcuHU3UZFP78ooLIp.Zx7o./DF1gi','nurse','lmercado@example.com','active','2026-10-12 13:39:56','2026-05-31 23:00:00','2026-10-12 13:40:05',NULL),
(5,'Rosa',NULL,'Domingo','rdomingo','$2b$12$O/XWYk1xd/oWTf8y9pylVOdmPWaHVfA9.YaavneClNwG44mcBJlv2','nurse',NULL,'inactive',NULL,'2026-05-31 23:00:00','2026-10-12 13:40:05',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visit_complaints`
--

DROP TABLE IF EXISTS `visit_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `visit_complaints` (
  `visit_complaint_id` int(11) NOT NULL AUTO_INCREMENT,
  `visit_id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`visit_complaint_id`),
  UNIQUE KEY `uq_visit_complaints` (`visit_id`,`complaint_id`),
  KEY `idx_vc_complaint` (`complaint_id`),
  CONSTRAINT `fk_vc_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_vc_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visit_complaints`
--

LOCK TABLES `visit_complaints` WRITE;
/*!40000 ALTER TABLE `visit_complaints` DISABLE KEYS */;
INSERT INTO `visit_complaints` VALUES
(1,1,6,1),
(2,2,4,1),
(3,3,2,1),
(4,4,5,1),
(5,5,1,1),
(6,6,2,1),
(7,7,1,1),
(8,8,2,1),
(9,9,5,1),
(10,10,4,1),
(11,11,7,1),
(12,12,6,1),
(13,13,5,1),
(14,14,6,1),
(15,15,3,1),
(16,16,9,1),
(17,17,1,1),
(18,18,5,1),
(19,19,5,1),
(20,20,7,1),
(21,21,7,1),
(22,22,3,1),
(23,23,1,1),
(24,24,5,1),
(25,25,7,1),
(26,26,2,1),
(27,27,11,1),
(28,28,6,1),
(29,29,4,1),
(30,30,1,1),
(31,31,8,1),
(32,32,3,1),
(33,33,3,1),
(34,34,7,1),
(35,35,2,1),
(36,36,10,1),
(37,37,4,1),
(38,38,5,1),
(39,39,9,1),
(40,40,5,1),
(41,41,7,1),
(42,42,6,1),
(43,43,6,1),
(44,44,7,1),
(45,45,1,1),
(46,46,7,1),
(47,47,4,1),
(48,48,2,1),
(49,49,8,1),
(50,50,8,1),
(51,51,11,1),
(52,52,3,1),
(53,53,2,1),
(54,54,11,1),
(55,55,4,1),
(56,56,9,1),
(57,57,2,1),
(58,58,5,1),
(59,59,7,1),
(60,60,5,1),
(61,61,2,1),
(62,62,5,1),
(63,63,10,1),
(64,64,6,1),
(65,65,3,1),
(66,66,2,1),
(67,67,3,1),
(68,68,2,1),
(69,69,3,1),
(70,70,1,1),
(71,71,5,1),
(72,72,2,1),
(73,73,7,1),
(74,74,5,1),
(75,75,4,1),
(76,76,10,1),
(77,77,7,1),
(78,78,1,1),
(79,79,9,1),
(80,80,6,1),
(81,81,3,1),
(82,82,4,1),
(83,83,6,1),
(84,84,5,1),
(85,85,11,1),
(86,86,1,1),
(87,87,9,1),
(88,88,10,1),
(89,89,1,1),
(90,90,3,1),
(91,91,1,1),
(92,92,4,1),
(93,93,2,1),
(94,94,7,1),
(95,95,1,1),
(96,96,8,1),
(97,97,3,1),
(98,98,4,1),
(99,99,4,1),
(100,100,4,1);
/*!40000 ALTER TABLE `visit_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visit_medicines`
--

DROP TABLE IF EXISTS `visit_medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `visit_medicines` (
  `visit_medicine_id` int(11) NOT NULL AUTO_INCREMENT,
  `visit_id` int(11) NOT NULL,
  `medicine_id` int(11) NOT NULL,
  `quantity_given` decimal(10,2) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `instructions` varchar(255) DEFAULT NULL,
  `given_by` int(11) DEFAULT NULL,
  `given_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`visit_medicine_id`),
  KEY `fk_vm_given_by` (`given_by`),
  KEY `idx_vm_visit` (`visit_id`),
  KEY `idx_vm_medicine` (`medicine_id`),
  CONSTRAINT `fk_vm_given_by` FOREIGN KEY (`given_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_vm_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_vm_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_vm_qty` CHECK (`quantity_given` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visit_medicines`
--

LOCK TABLES `visit_medicines` WRITE;
/*!40000 ALTER TABLE `visit_medicines` DISABLE KEYS */;
INSERT INTO `visit_medicines` VALUES
(1,2,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-06-11 01:47:00'),
(2,3,2,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-06-11 08:11:00'),
(3,4,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-06-18 07:11:00'),
(4,5,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-06-27 02:24:00'),
(5,6,2,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-06-30 04:08:00'),
(6,7,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-07-01 06:38:00'),
(7,8,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-07-03 01:39:00'),
(8,9,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-07-09 06:34:00'),
(9,10,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-07-10 05:10:00'),
(10,11,5,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-07-21 06:08:00'),
(11,13,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-07-28 00:51:00'),
(12,15,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-03 00:19:00'),
(13,15,4,1.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-03 00:19:00'),
(14,16,10,1.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-03 04:20:00'),
(15,17,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-03 23:59:00'),
(16,18,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-04 03:13:00'),
(17,19,11,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-04 06:19:00'),
(18,20,9,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-05 00:00:00'),
(19,20,6,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-05 00:00:00'),
(20,21,9,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-06 03:11:00'),
(21,21,6,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-06 03:11:00'),
(22,22,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-06 04:55:00'),
(23,22,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-06 04:55:00'),
(24,23,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-06 05:07:00'),
(25,24,11,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-07 03:28:00'),
(26,25,5,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-11 01:14:00'),
(27,26,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-11 04:33:00'),
(28,27,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-11 23:38:00'),
(29,29,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-12 03:11:00'),
(30,30,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-13 02:25:00'),
(31,32,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-14 05:09:00'),
(32,32,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-14 05:09:00'),
(33,33,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-14 05:23:00'),
(34,33,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-14 05:23:00'),
(35,34,5,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-14 06:16:00'),
(36,35,2,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-15 05:10:00'),
(37,37,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-18 01:08:00'),
(38,38,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-18 04:06:00'),
(39,39,10,1.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-19 02:58:00'),
(40,40,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-20 08:17:00'),
(41,42,8,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-24 01:53:00'),
(42,44,5,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-25 01:46:00'),
(43,45,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-25 07:29:00'),
(44,46,5,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-27 03:04:00'),
(45,47,1,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-08-27 03:53:00'),
(46,48,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-08-28 02:20:00'),
(47,51,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-01 02:27:00'),
(48,52,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-01 02:49:00'),
(49,52,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-01 02:49:00'),
(50,53,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-02 04:14:00'),
(51,54,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-02 04:46:00'),
(52,55,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-03 02:19:00'),
(53,56,10,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-04 03:10:00'),
(54,57,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-05 01:55:00'),
(55,58,11,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-07 02:32:00'),
(56,59,5,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-07 03:31:00'),
(57,60,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-09 05:35:00'),
(58,61,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-11 02:35:00'),
(59,62,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-11 03:32:00'),
(60,65,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-12 08:06:00'),
(61,65,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-12 08:06:00'),
(62,66,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-14 02:32:00'),
(63,67,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-14 03:44:00'),
(64,67,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-14 03:44:00'),
(65,68,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-14 04:38:00'),
(66,69,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-15 05:28:00'),
(67,69,4,1.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-15 05:28:00'),
(68,70,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-15 06:37:00'),
(69,71,11,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-16 00:03:00'),
(70,72,2,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-17 07:39:00'),
(71,73,9,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-18 05:05:00'),
(72,73,6,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-18 05:05:00'),
(73,74,11,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-21 04:20:00'),
(74,75,1,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-22 00:17:00'),
(75,77,9,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-22 02:26:00'),
(76,77,6,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-22 02:26:00'),
(77,78,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-23 01:28:00'),
(78,79,10,1.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-23 04:36:00'),
(79,80,8,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-24 01:33:00'),
(80,81,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-24 04:37:00'),
(81,81,4,1.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-24 04:37:00'),
(82,82,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-25 06:01:00'),
(83,83,8,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-28 04:50:00'),
(84,84,11,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-29 06:20:00'),
(85,85,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-09-30 00:18:00'),
(86,86,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-09-30 05:32:00'),
(87,87,10,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-01 05:03:00'),
(88,89,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-02 06:10:00'),
(89,90,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-05 02:25:00'),
(90,90,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-05 02:25:00'),
(91,91,1,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-05 06:55:00'),
(92,92,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-06 01:09:00'),
(93,93,2,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-08 04:41:00'),
(94,94,9,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-08 07:20:00'),
(95,94,6,2.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-08 07:20:00'),
(96,95,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-12 01:00:00'),
(97,97,1,2.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-12 04:46:00'),
(98,97,4,1.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-12 04:46:00'),
(99,98,1,3.00,'1 every 6 to 8 hours as needed',NULL,2,'2026-10-12 05:39:57'),
(100,99,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-12 05:39:57'),
(101,100,1,3.00,'1 every 6 to 8 hours as needed',NULL,3,'2026-10-12 05:39:57');
/*!40000 ALTER TABLE `visit_medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visit_supplies`
--

DROP TABLE IF EXISTS `visit_supplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `visit_supplies` (
  `visit_supply_id` int(11) NOT NULL AUTO_INCREMENT,
  `visit_id` int(11) NOT NULL,
  `supply_id` int(11) NOT NULL,
  `quantity_used` decimal(10,2) NOT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `given_by` int(11) DEFAULT NULL,
  `given_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`visit_supply_id`),
  KEY `fk_vs_given_by` (`given_by`),
  KEY `idx_vs_visit` (`visit_id`),
  KEY `idx_vs_supply` (`supply_id`),
  CONSTRAINT `fk_vs_given_by` FOREIGN KEY (`given_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_vs_supply` FOREIGN KEY (`supply_id`) REFERENCES `supplies` (`supply_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_vs_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_vs_qty` CHECK (`quantity_used` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visit_supplies`
--

LOCK TABLES `visit_supplies` WRITE;
/*!40000 ALTER TABLE `visit_supplies` DISABLE KEYS */;
INSERT INTO `visit_supplies` VALUES
(1,1,5,1.00,NULL,3,'2026-06-03 08:21:00'),
(2,1,4,1.00,NULL,3,'2026-06-03 08:21:00'),
(3,1,6,2.00,NULL,3,'2026-06-03 08:21:00'),
(4,4,7,1.00,NULL,2,'2026-06-18 07:11:00'),
(5,9,7,1.00,NULL,2,'2026-07-09 06:34:00'),
(6,12,5,1.00,NULL,3,'2026-07-22 05:32:00'),
(7,12,4,1.00,NULL,3,'2026-07-22 05:32:00'),
(8,12,6,2.00,NULL,3,'2026-07-22 05:32:00'),
(9,13,7,1.00,NULL,2,'2026-07-28 00:51:00'),
(10,14,5,1.00,NULL,2,'2026-07-31 23:39:00'),
(11,14,4,1.00,NULL,2,'2026-07-31 23:39:00'),
(12,14,6,2.00,NULL,2,'2026-07-31 23:39:00'),
(13,15,7,1.00,NULL,3,'2026-08-03 00:19:00'),
(14,18,7,1.00,NULL,2,'2026-08-04 03:13:00'),
(15,19,7,1.00,NULL,3,'2026-08-04 06:19:00'),
(16,22,7,1.00,NULL,2,'2026-08-06 04:55:00'),
(17,24,7,1.00,NULL,3,'2026-08-07 03:28:00'),
(18,28,5,1.00,NULL,3,'2026-08-11 23:40:00'),
(19,28,4,1.00,NULL,3,'2026-08-11 23:40:00'),
(20,28,6,2.00,NULL,3,'2026-08-11 23:40:00'),
(21,32,7,1.00,NULL,2,'2026-08-14 05:09:00'),
(22,33,7,1.00,NULL,2,'2026-08-14 05:23:00'),
(23,38,7,1.00,NULL,2,'2026-08-18 04:06:00'),
(24,40,7,1.00,NULL,2,'2026-08-20 08:17:00'),
(25,42,2,1.00,NULL,2,'2026-08-24 01:53:00'),
(26,43,5,1.00,NULL,3,'2026-08-24 05:29:00'),
(27,43,4,1.00,NULL,3,'2026-08-24 05:29:00'),
(28,43,6,2.00,NULL,3,'2026-08-24 05:29:00'),
(29,52,7,1.00,NULL,2,'2026-09-01 02:49:00'),
(30,58,7,1.00,NULL,3,'2026-09-07 02:32:00'),
(31,60,7,1.00,NULL,2,'2026-09-09 05:35:00'),
(32,62,7,1.00,NULL,2,'2026-09-11 03:32:00'),
(33,64,5,1.00,NULL,2,'2026-09-12 03:58:00'),
(34,64,4,1.00,NULL,2,'2026-09-12 03:58:00'),
(35,64,6,2.00,NULL,2,'2026-09-12 03:58:00'),
(36,65,7,1.00,NULL,2,'2026-09-12 08:06:00'),
(37,67,7,1.00,NULL,2,'2026-09-14 03:44:00'),
(38,69,7,1.00,NULL,3,'2026-09-15 05:28:00'),
(39,71,7,1.00,NULL,3,'2026-09-16 00:03:00'),
(40,74,7,1.00,NULL,2,'2026-09-21 04:20:00'),
(41,80,2,1.00,NULL,3,'2026-09-24 01:33:00'),
(42,81,7,1.00,NULL,3,'2026-09-24 04:37:00'),
(43,83,2,1.00,NULL,2,'2026-09-28 04:50:00'),
(44,84,7,1.00,NULL,3,'2026-09-29 06:20:00'),
(45,90,7,1.00,NULL,2,'2026-10-05 02:25:00'),
(46,97,7,1.00,NULL,2,'2026-10-12 04:46:00');
/*!40000 ALTER TABLE `visit_supplies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visits`
--

DROP TABLE IF EXISTS `visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `visits` (
  `visit_id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `attending_user_id` int(11) DEFAULT NULL,
  `chief_complaint` text NOT NULL COMMENT 'The nurse''s own wording. Structured tags live in visit_complaints',
  `management` text DEFAULT NULL COMMENT 'What was done or advised',
  `treatment_notes` text DEFAULT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `pulse_rate` int(10) unsigned DEFAULT NULL,
  `disposition_id` int(11) DEFAULT NULL,
  `started_at` datetime NOT NULL COMMENT 'Full timestamp — a visit can cross midnight',
  `ended_at` datetime DEFAULT NULL,
  `status` enum('waiting','in_care','completed','cancelled') NOT NULL DEFAULT 'waiting',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`visit_id`),
  KEY `fk_visits_disposition` (`disposition_id`),
  KEY `fk_visits_created_by` (`created_by`),
  KEY `fk_visits_updated_by` (`updated_by`),
  KEY `idx_visits_patient_started` (`patient_id`,`started_at`),
  KEY `idx_visits_started` (`started_at`),
  KEY `idx_visits_status` (`status`),
  KEY `idx_visits_attending` (`attending_user_id`),
  KEY `idx_visits_deleted` (`deleted_at`),
  CONSTRAINT `fk_visits_attending_user` FOREIGN KEY (`attending_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_visits_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_visits_disposition` FOREIGN KEY (`disposition_id`) REFERENCES `dispositions` (`disposition_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_visits_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_visits_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_visits_times` CHECK (`ended_at` is null or `ended_at` >= `started_at`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visits`
--

LOCK TABLES `visits` WRITE;
/*!40000 ALTER TABLE `visits` DISABLE KEYS */;
INSERT INTO `visits` VALUES
(1,24,3,'Small cut / abrasion','Observed and reassessed',NULL,'120/80',36.3,98,1,'2026-06-03 08:16:00','2026-06-03 08:47:00','completed',3,3,'2026-06-03 08:16:00','2026-06-03 08:47:00',NULL),
(2,37,3,'Fever and body pain','Rest for 30 minutes',NULL,'125/82',38.5,81,2,'2026-06-11 01:42:00','2026-06-11 02:56:00','completed',3,3,'2026-06-11 01:42:00','2026-06-11 02:56:00',NULL),
(3,6,2,'Dysmenorrhea','Rest for 30 minutes',NULL,'125/82',37.0,68,1,'2026-06-11 08:06:00','2026-06-11 09:24:00','completed',2,2,'2026-06-11 08:06:00','2026-06-11 09:24:00',NULL),
(4,28,2,'Cough and colds','Wound cleaned and dressed',NULL,'130/85',36.8,90,1,'2026-06-18 07:06:00','2026-06-18 07:49:00','completed',2,2,'2026-06-18 07:06:00','2026-06-18 07:49:00',NULL),
(5,20,3,'Headache','Cold compress applied',NULL,'100/60',37.2,76,1,'2026-06-27 02:19:00','2026-06-27 03:49:00','completed',3,3,'2026-06-27 02:19:00','2026-06-27 03:49:00',NULL),
(6,23,2,'Dysmenorrhea','Cold compress applied',NULL,'118/76',36.2,80,3,'2026-06-30 04:03:00','2026-06-30 04:56:00','completed',2,2,'2026-06-30 04:03:00','2026-06-30 04:56:00',NULL),
(7,20,2,'Headache','Advised rest and hydration',NULL,'120/80',37.2,75,1,'2026-07-01 06:33:00','2026-07-01 07:25:00','completed',2,2,'2026-07-01 06:33:00','2026-07-01 07:25:00',NULL),
(8,11,3,'Dysmenorrhea','Advised rest and hydration',NULL,'130/85',36.8,102,1,'2026-07-03 01:34:00','2026-07-03 01:48:00','completed',3,3,'2026-07-03 01:34:00','2026-07-03 01:48:00',NULL),
(9,35,2,'Cough and colds','Cold compress applied',NULL,'100/60',36.3,88,1,'2026-07-09 06:29:00','2026-07-09 07:38:00','completed',2,2,'2026-07-09 06:29:00','2026-07-09 07:38:00',NULL),
(10,39,3,'Fever and body pain','Wound cleaned and dressed',NULL,'100/60',38.8,74,2,'2026-07-10 05:05:00','2026-07-10 06:04:00','completed',3,3,'2026-07-10 05:05:00','2026-07-10 06:04:00',NULL),
(11,9,2,'Stomach pain after lunch','Advised rest and hydration',NULL,'118/76',36.2,66,1,'2026-07-21 06:03:00','2026-07-21 07:01:00','completed',2,2,'2026-07-21 06:03:00','2026-07-21 07:01:00',NULL),
(12,24,3,'Small cut / abrasion','Advised rest and hydration',NULL,'130/85',36.4,89,1,'2026-07-22 05:27:00','2026-07-22 06:44:00','completed',3,3,'2026-07-22 05:27:00','2026-07-22 06:44:00',NULL),
(13,10,2,'Cough and colds','Wound cleaned and dressed',NULL,'110/70',36.5,93,2,'2026-07-28 00:46:00','2026-07-28 01:48:00','completed',2,2,'2026-07-28 00:46:00','2026-07-28 01:48:00',NULL),
(14,33,2,'Small cut / abrasion','Observed and reassessed',NULL,'130/85',36.6,67,1,'2026-07-31 23:34:00','2026-08-01 00:17:00','completed',2,2,'2026-07-31 23:34:00','2026-08-01 00:17:00',NULL),
(15,22,3,'Flu-like symptoms, runny nose','Wound cleaned and dressed',NULL,'130/85',38.2,91,2,'2026-08-03 00:14:00','2026-08-03 01:07:00','completed',3,3,'2026-08-03 00:14:00','2026-08-03 01:07:00',NULL),
(16,18,3,'Allergic rash, itchiness','Advised rest and hydration',NULL,'118/76',36.9,92,1,'2026-08-03 04:15:00','2026-08-03 05:45:00','completed',3,3,'2026-08-03 04:15:00','2026-08-03 05:45:00',NULL),
(17,39,2,'Headache','Cold compress applied',NULL,'130/85',37.1,94,1,'2026-08-03 23:54:00','2026-08-04 00:58:00','completed',2,2,'2026-08-03 23:54:00','2026-08-04 00:58:00',NULL),
(18,18,2,'Cough and colds','Observed and reassessed',NULL,'120/80',37.0,75,1,'2026-08-04 03:08:00','2026-08-04 03:27:00','completed',2,2,'2026-08-04 03:08:00','2026-08-04 03:27:00','2026-10-12 05:40:05'),
(19,18,3,'Cough and colds','Advised rest and hydration',NULL,'125/82',36.6,73,2,'2026-08-04 06:14:00','2026-08-04 07:43:00','completed',3,3,'2026-08-04 06:14:00','2026-08-04 07:43:00',NULL),
(20,38,3,'Loose bowel movement','Cold compress applied',NULL,'120/80',36.3,78,2,'2026-08-04 23:55:00','2026-08-05 00:31:00','completed',3,3,'2026-08-04 23:55:00','2026-08-05 00:31:00',NULL),
(21,11,2,'Loose bowel movement','Rest for 30 minutes',NULL,'100/60',36.5,102,2,'2026-08-06 03:06:00','2026-08-06 04:28:00','completed',2,2,'2026-08-06 03:06:00','2026-08-06 04:28:00',NULL),
(22,37,2,'Flu-like symptoms, runny nose','Rest for 30 minutes',NULL,'118/76',39.1,66,1,'2026-08-06 04:50:00','2026-08-06 06:02:00','completed',2,2,'2026-08-06 04:50:00','2026-08-06 06:02:00',NULL),
(23,19,3,'Headache','Advised rest and hydration',NULL,'118/76',36.9,65,1,'2026-08-06 05:02:00','2026-08-06 06:21:00','completed',3,3,'2026-08-06 05:02:00','2026-08-06 06:21:00',NULL),
(24,2,3,'Cough and colds','Advised rest and hydration',NULL,'130/85',36.4,93,1,'2026-08-07 03:23:00','2026-08-07 04:47:00','completed',3,3,'2026-08-07 03:23:00','2026-08-07 04:47:00',NULL),
(25,33,3,'Stomach pain after lunch','Advised rest and hydration',NULL,'118/76',36.9,75,3,'2026-08-11 01:09:00','2026-08-11 01:35:00','completed',3,3,'2026-08-11 01:09:00','2026-08-11 01:35:00',NULL),
(26,35,3,'Dysmenorrhea','Observed and reassessed',NULL,'120/80',36.7,88,1,'2026-08-11 04:28:00','2026-08-11 05:44:00','completed',3,3,'2026-08-11 04:28:00','2026-08-11 05:44:00',NULL),
(27,30,3,'Toothache','Observed and reassessed',NULL,'130/85',36.6,69,4,'2026-08-11 23:33:00','2026-08-12 00:27:00','completed',3,3,'2026-08-11 23:33:00','2026-08-12 00:27:00',NULL),
(28,23,3,'Small cut / abrasion','Rest for 30 minutes',NULL,'130/85',36.2,85,1,'2026-08-11 23:35:00','2026-08-12 00:53:00','completed',3,3,'2026-08-11 23:35:00','2026-08-12 00:53:00',NULL),
(29,12,3,'Fever and body pain','Wound cleaned and dressed',NULL,'130/85',38.9,104,2,'2026-08-12 03:06:00','2026-08-12 04:30:00','completed',3,3,'2026-08-12 03:06:00','2026-08-12 04:30:00',NULL),
(30,1,3,'Headache','Rest for 30 minutes',NULL,'110/70',37.1,73,1,'2026-08-13 02:20:00','2026-08-13 03:03:00','completed',3,3,'2026-08-13 02:20:00','2026-08-13 03:03:00',NULL),
(31,9,2,'Dizziness','Rest for 30 minutes',NULL,'130/85',36.6,104,1,'2026-08-13 23:59:00','2026-08-14 00:34:00','completed',2,2,'2026-08-13 23:59:00','2026-08-14 00:34:00',NULL),
(32,35,2,'Flu-like symptoms, runny nose','Wound cleaned and dressed',NULL,'118/76',38.0,82,1,'2026-08-14 05:04:00','2026-08-14 05:49:00','completed',2,2,'2026-08-14 05:04:00','2026-08-14 05:49:00',NULL),
(33,18,2,'Flu-like symptoms, runny nose','Advised rest and hydration',NULL,'118/76',39.2,99,2,'2026-08-14 05:18:00','2026-08-14 06:02:00','completed',2,2,'2026-08-14 05:18:00','2026-08-14 06:02:00',NULL),
(34,24,3,'Stomach pain after lunch','Cold compress applied',NULL,'125/82',36.3,84,3,'2026-08-14 06:11:00','2026-08-14 06:40:00','completed',3,3,'2026-08-14 06:11:00','2026-08-14 06:40:00',NULL),
(35,1,2,'Dysmenorrhea','Wound cleaned and dressed',NULL,'120/80',37.0,95,3,'2026-08-15 05:05:00','2026-08-15 06:13:00','completed',2,2,'2026-08-15 05:05:00','2026-08-15 06:13:00',NULL),
(36,11,3,'High blood pressure','Rest for 30 minutes',NULL,'160/100',36.6,78,3,'2026-08-17 05:59:00','2026-08-17 07:16:00','completed',3,3,'2026-08-17 05:59:00','2026-08-17 07:16:00',NULL),
(37,18,3,'Fever and body pain','Cold compress applied',NULL,'100/60',38.3,71,2,'2026-08-18 01:03:00','2026-08-18 01:15:00','completed',3,3,'2026-08-18 01:03:00','2026-08-18 01:15:00',NULL),
(38,14,2,'Cough and colds','Cold compress applied',NULL,'118/76',36.2,93,1,'2026-08-18 04:01:00','2026-08-18 05:07:00','completed',2,2,'2026-08-18 04:01:00','2026-08-18 05:07:00',NULL),
(39,39,3,'Allergic rash, itchiness','Observed and reassessed',NULL,'100/60',36.9,78,1,'2026-08-19 02:53:00','2026-08-19 03:26:00','completed',3,3,'2026-08-19 02:53:00','2026-08-19 03:26:00',NULL),
(40,28,2,'Cough and colds','Rest for 30 minutes',NULL,'110/70',36.5,86,1,'2026-08-20 08:12:00','2026-08-20 09:19:00','completed',2,2,'2026-08-20 08:12:00','2026-08-20 09:19:00',NULL),
(41,24,3,'Severe abdominal pain','Rest for 30 minutes',NULL,'118/76',36.5,69,4,'2026-08-21 05:58:00','2026-08-21 06:56:00','completed',3,3,'2026-08-21 05:58:00','2026-08-21 06:56:00',NULL),
(42,24,2,'Sprained ankle during PE','Observed and reassessed',NULL,'118/76',37.0,83,1,'2026-08-24 01:48:00','2026-08-24 02:39:00','completed',2,2,'2026-08-24 01:48:00','2026-08-24 02:39:00',NULL),
(43,11,3,'Small cut / abrasion','Advised rest and hydration',NULL,'110/70',36.4,74,1,'2026-08-24 05:24:00','2026-08-24 05:37:00','completed',3,3,'2026-08-24 05:24:00','2026-08-24 05:37:00',NULL),
(44,13,3,'Stomach pain after lunch','Rest for 30 minutes',NULL,'125/82',36.2,89,1,'2026-08-25 01:41:00','2026-08-25 03:10:00','completed',3,3,'2026-08-25 01:41:00','2026-08-25 03:10:00',NULL),
(45,5,2,'Headache','Wound cleaned and dressed',NULL,'130/85',37.0,95,1,'2026-08-25 07:24:00','2026-08-25 08:52:00','completed',2,2,'2026-08-25 07:24:00','2026-08-25 08:52:00',NULL),
(46,9,2,'Stomach pain after lunch','Advised rest and hydration',NULL,'130/85',36.3,64,1,'2026-08-27 02:59:00','2026-08-27 04:21:00','completed',2,2,'2026-08-27 02:59:00','2026-08-27 04:21:00',NULL),
(47,9,2,'Fever and body pain','Wound cleaned and dressed',NULL,'100/60',38.3,86,3,'2026-08-27 03:48:00','2026-08-27 04:06:00','completed',2,2,'2026-08-27 03:48:00','2026-08-27 04:06:00',NULL),
(48,14,3,'Dysmenorrhea','Wound cleaned and dressed',NULL,'130/85',36.6,66,1,'2026-08-28 02:15:00','2026-08-28 02:53:00','completed',3,3,'2026-08-28 02:15:00','2026-08-28 02:53:00',NULL),
(49,9,3,'Dizziness','Cold compress applied',NULL,'118/76',37.0,98,2,'2026-08-28 08:21:00','2026-08-28 09:20:00','completed',3,3,'2026-08-28 08:21:00','2026-08-28 09:20:00',NULL),
(50,25,2,'Dizziness','Wound cleaned and dressed',NULL,'100/60',36.4,80,1,'2026-09-01 00:19:00','2026-09-01 00:41:00','completed',2,2,'2026-09-01 00:19:00','2026-09-01 00:41:00',NULL),
(51,1,3,'Toothache','Rest for 30 minutes',NULL,'100/60',36.7,65,4,'2026-09-01 02:22:00','2026-09-01 03:11:00','completed',3,3,'2026-09-01 02:22:00','2026-09-01 03:11:00',NULL),
(52,9,2,'Flu-like symptoms, runny nose','Rest for 30 minutes',NULL,'120/80',38.4,73,1,'2026-09-01 02:44:00','2026-09-01 03:10:00','completed',2,2,'2026-09-01 02:44:00','2026-09-01 03:10:00','2026-10-12 05:40:04'),
(53,37,3,'Dysmenorrhea','Observed and reassessed',NULL,'118/76',36.7,92,1,'2026-09-02 04:09:00','2026-09-02 05:31:00','completed',3,3,'2026-09-02 04:09:00','2026-09-02 05:31:00',NULL),
(54,10,3,'Toothache','Cold compress applied',NULL,'110/70',36.2,82,1,'2026-09-02 04:41:00','2026-09-02 05:26:00','completed',3,3,'2026-09-02 04:41:00','2026-09-02 05:26:00',NULL),
(55,12,3,'Fever and body pain','Cold compress applied',NULL,'120/80',39.3,94,2,'2026-09-03 02:14:00','2026-09-03 02:32:00','completed',3,3,'2026-09-03 02:14:00','2026-09-03 02:32:00',NULL),
(56,11,2,'Allergic rash, itchiness','Cold compress applied',NULL,'100/60',36.6,65,1,'2026-09-04 03:05:00','2026-09-04 04:25:00','completed',2,2,'2026-09-04 03:05:00','2026-09-04 04:25:00',NULL),
(57,12,3,'Dysmenorrhea','Advised rest and hydration',NULL,'130/85',36.8,78,1,'2026-09-05 01:50:00','2026-09-05 02:56:00','completed',3,3,'2026-09-05 01:50:00','2026-09-05 02:56:00',NULL),
(58,18,3,'Cough and colds','Rest for 30 minutes',NULL,'118/76',36.8,77,1,'2026-09-07 02:27:00','2026-09-07 02:49:00','completed',3,3,'2026-09-07 02:27:00','2026-09-07 02:49:00',NULL),
(59,13,3,'Stomach pain after lunch','Observed and reassessed',NULL,'100/60',37.1,70,3,'2026-09-07 03:26:00','2026-09-07 04:18:00','completed',3,3,'2026-09-07 03:26:00','2026-09-07 04:18:00',NULL),
(60,24,2,'Cough and colds','Wound cleaned and dressed',NULL,'118/76',37.0,102,1,'2026-09-09 05:30:00','2026-09-09 05:40:00','completed',2,2,'2026-09-09 05:30:00','2026-09-09 05:40:00',NULL),
(61,28,3,'Dysmenorrhea','Advised rest and hydration',NULL,'120/80',37.1,91,3,'2026-09-11 02:30:00','2026-09-11 03:11:00','completed',3,3,'2026-09-11 02:30:00','2026-09-11 03:11:00',NULL),
(62,24,2,'Cough and colds','Rest for 30 minutes',NULL,'120/80',36.6,81,1,'2026-09-11 03:27:00','2026-09-11 03:54:00','completed',2,2,'2026-09-11 03:27:00','2026-09-11 03:54:00',NULL),
(63,9,3,'High blood pressure','Wound cleaned and dressed',NULL,'150/95',37.0,100,2,'2026-09-12 01:23:00','2026-09-12 02:37:00','completed',3,3,'2026-09-12 01:23:00','2026-09-12 02:37:00',NULL),
(64,36,2,'Small cut / abrasion','Advised rest and hydration',NULL,'100/60',37.0,100,1,'2026-09-12 03:53:00','2026-09-12 05:00:00','completed',2,2,'2026-09-12 03:53:00','2026-09-12 05:00:00',NULL),
(65,18,2,'Flu-like symptoms, runny nose','Wound cleaned and dressed',NULL,'125/82',39.3,101,2,'2026-09-12 08:01:00','2026-09-12 08:33:00','completed',2,2,'2026-09-12 08:01:00','2026-09-12 08:33:00',NULL),
(66,18,3,'Dysmenorrhea','Advised rest and hydration',NULL,'125/82',36.8,72,1,'2026-09-14 02:27:00','2026-09-14 03:00:00','completed',3,3,'2026-09-14 02:27:00','2026-09-14 03:00:00',NULL),
(67,28,2,'Flu-like symptoms, runny nose','Cold compress applied',NULL,'125/82',38.9,81,2,'2026-09-14 03:39:00','2026-09-14 04:38:00','completed',2,2,'2026-09-14 03:39:00','2026-09-14 04:38:00',NULL),
(68,18,3,'Dysmenorrhea','Observed and reassessed',NULL,'110/70',36.6,102,1,'2026-09-14 04:33:00','2026-09-14 05:20:00','completed',3,3,'2026-09-14 04:33:00','2026-09-14 05:20:00',NULL),
(69,39,3,'Flu-like symptoms, runny nose','Rest for 30 minutes',NULL,'118/76',38.5,89,2,'2026-09-15 05:23:00','2026-09-15 05:43:00','completed',3,3,'2026-09-15 05:23:00','2026-09-15 05:43:00',NULL),
(70,13,2,'Headache','Observed and reassessed',NULL,'130/85',36.1,93,1,'2026-09-15 06:32:00','2026-09-15 07:21:00','completed',2,2,'2026-09-15 06:32:00','2026-09-15 07:21:00',NULL),
(71,32,3,'Cough and colds','Observed and reassessed',NULL,'120/80',36.8,73,1,'2026-09-15 23:58:00','2026-09-16 00:21:00','completed',3,3,'2026-09-15 23:58:00','2026-09-16 00:21:00',NULL),
(72,24,2,'Dysmenorrhea','Rest for 30 minutes',NULL,'100/60',36.8,86,2,'2026-09-17 07:34:00','2026-09-17 08:12:00','completed',2,2,'2026-09-17 07:34:00','2026-09-17 08:12:00',NULL),
(73,6,3,'Loose bowel movement','Advised rest and hydration',NULL,'100/60',36.3,89,1,'2026-09-18 05:00:00','2026-09-18 05:41:00','completed',3,3,'2026-09-18 05:00:00','2026-09-18 05:41:00',NULL),
(74,24,2,'Cough and colds','Wound cleaned and dressed',NULL,'110/70',36.3,93,1,'2026-09-21 04:15:00','2026-09-21 05:44:00','completed',2,2,'2026-09-21 04:15:00','2026-09-21 05:44:00',NULL),
(75,1,2,'Fever and body pain','Advised rest and hydration',NULL,'100/60',38.0,92,3,'2026-09-22 00:12:00','2026-09-22 00:32:00','completed',2,2,'2026-09-22 00:12:00','2026-09-22 00:32:00',NULL),
(76,23,2,'High blood pressure','Rest for 30 minutes',NULL,'150/95',36.4,71,4,'2026-09-22 00:19:00','2026-09-22 01:46:00','completed',2,2,'2026-09-22 00:19:00','2026-09-22 01:46:00',NULL),
(77,37,3,'Loose bowel movement','Wound cleaned and dressed',NULL,'130/85',36.4,97,2,'2026-09-22 02:21:00','2026-09-22 03:00:00','completed',3,3,'2026-09-22 02:21:00','2026-09-22 03:00:00',NULL),
(78,37,3,'Headache','Wound cleaned and dressed',NULL,'130/85',36.4,102,3,'2026-09-23 01:23:00','2026-09-23 02:31:00','completed',3,3,'2026-09-23 01:23:00','2026-09-23 02:31:00',NULL),
(79,12,3,'Allergic rash, itchiness','Cold compress applied',NULL,'130/85',37.1,85,3,'2026-09-23 04:31:00','2026-09-23 05:58:00','completed',3,3,'2026-09-23 04:31:00','2026-09-23 05:58:00',NULL),
(80,18,3,'Sprained ankle during PE','Observed and reassessed',NULL,'120/80',37.1,76,1,'2026-09-24 01:28:00','2026-09-24 02:20:00','completed',3,2,'2026-09-24 01:28:00','2026-09-24 02:20:00','2026-10-12 05:40:05'),
(81,34,3,'Flu-like symptoms, runny nose','Advised rest and hydration',NULL,'125/82',38.3,71,1,'2026-09-24 04:32:00','2026-09-24 05:53:00','completed',3,3,'2026-09-24 04:32:00','2026-09-24 05:53:00',NULL),
(82,29,3,'Fever and body pain','Observed and reassessed',NULL,'118/76',38.6,103,2,'2026-09-25 05:56:00','2026-09-25 06:08:00','completed',3,3,'2026-09-25 05:56:00','2026-09-25 06:08:00',NULL),
(83,6,2,'Sprained ankle during PE','Advised rest and hydration',NULL,'100/60',36.9,75,4,'2026-09-28 04:45:00','2026-09-28 06:15:00','completed',2,2,'2026-09-28 04:45:00','2026-09-28 06:15:00',NULL),
(84,18,3,'Cough and colds','Cold compress applied',NULL,'110/70',36.3,71,1,'2026-09-29 06:15:00','2026-09-29 07:32:00','completed',3,3,'2026-09-29 06:15:00','2026-09-29 07:32:00',NULL),
(85,6,3,'Toothache','Advised rest and hydration',NULL,'118/76',37.0,85,1,'2026-09-30 00:13:00','2026-09-30 00:53:00','completed',3,3,'2026-09-30 00:13:00','2026-09-30 00:53:00',NULL),
(86,34,2,'Headache','Advised rest and hydration',NULL,'118/76',36.6,68,1,'2026-09-30 05:27:00','2026-09-30 06:09:00','completed',2,2,'2026-09-30 05:27:00','2026-09-30 06:09:00',NULL),
(87,28,2,'Allergic rash, itchiness','Observed and reassessed',NULL,'130/85',36.3,74,1,'2026-10-01 04:58:00','2026-10-01 05:16:00','completed',2,2,'2026-10-01 04:58:00','2026-10-01 05:16:00',NULL),
(88,18,2,'High blood pressure','Wound cleaned and dressed',NULL,'145/92',36.9,67,4,'2026-10-02 03:11:00','2026-10-02 03:26:00','completed',2,2,'2026-10-02 03:11:00','2026-10-02 03:26:00',NULL),
(89,24,2,'Headache','Advised rest and hydration',NULL,'100/60',36.9,78,1,'2026-10-02 06:05:00','2026-10-02 07:15:00','completed',2,2,'2026-10-02 06:05:00','2026-10-02 07:15:00',NULL),
(90,12,2,'Flu-like symptoms, runny nose','Advised rest and hydration',NULL,'100/60',38.3,81,2,'2026-10-05 02:20:00','2026-10-05 02:37:00','completed',2,2,'2026-10-05 02:20:00','2026-10-05 02:37:00',NULL),
(91,24,3,'Headache','Wound cleaned and dressed',NULL,'125/82',36.4,74,1,'2026-10-05 06:50:00','2026-10-05 08:18:00','completed',3,3,'2026-10-05 06:50:00','2026-10-05 08:18:00',NULL),
(92,1,3,'Fever and body pain','Wound cleaned and dressed',NULL,'118/76',39.0,96,2,'2026-10-06 01:04:00','2026-10-06 01:54:00','completed',3,3,'2026-10-06 01:04:00','2026-10-06 01:54:00',NULL),
(93,10,3,'Dysmenorrhea','Advised rest and hydration',NULL,'100/60',36.8,71,1,'2026-10-08 04:36:00','2026-10-08 05:00:00','completed',3,3,'2026-10-08 04:36:00','2026-10-08 05:00:00',NULL),
(94,15,3,'Loose bowel movement','Cold compress applied',NULL,'110/70',36.2,99,2,'2026-10-08 07:15:00','2026-10-08 08:13:00','completed',3,3,'2026-10-08 07:15:00','2026-10-08 08:13:00',NULL),
(95,37,2,'Headache','Rest for 30 minutes',NULL,'118/76',37.0,74,1,'2026-10-12 00:55:00','2026-10-12 01:46:00','completed',2,2,'2026-10-12 00:55:00','2026-10-12 01:46:00',NULL),
(96,24,3,'Dizziness','Advised rest and hydration',NULL,'125/82',36.2,73,1,'2026-10-12 02:43:00','2026-10-12 03:08:00','completed',3,3,'2026-10-12 02:43:00','2026-10-12 03:08:00',NULL),
(97,25,2,'Flu-like symptoms, runny nose','Observed and reassessed',NULL,'100/60',39.3,92,NULL,'2026-10-12 04:41:00',NULL,'in_care',2,NULL,'2026-10-12 04:41:00','2026-10-12 04:41:00',NULL),
(98,28,2,'Fever and body pain','Advised rest and hydration',NULL,'110/70',38.2,77,NULL,'2026-10-12 05:34:57',NULL,'in_care',2,NULL,'2026-10-12 05:34:57','2026-10-12 05:34:57',NULL),
(99,40,3,'Fever and body pain','Rest for 30 minutes',NULL,'120/80',39.4,92,NULL,'2026-10-12 05:34:57',NULL,'in_care',3,NULL,'2026-10-12 05:34:57','2026-10-12 05:34:57',NULL),
(100,18,3,'Fever and body pain','Rest for 30 minutes',NULL,'100/60',38.5,87,NULL,'2026-10-12 05:34:57',NULL,'in_care',3,NULL,'2026-10-12 05:34:57','2026-10-12 05:34:57',NULL);
/*!40000 ALTER TABLE `visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'isu_infirmary'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
