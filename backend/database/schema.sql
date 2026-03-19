/*la structure de la base de données*/
CREATE DATABASE IF NOT EXISTS argan_fire_watch
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE argan_fire_watch;

CREATE TABLE roles (
    id_role INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id_permission INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom_action VARCHAR(100) NOT NULL,
    ressource VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE KEY uk_action_ressource (nom_action, ressource)
) ENGINE=InnoDB;

CREATE TABLE utilisateurs (
    id_utilisateur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    statut ENUM('ACTIF','INACTIF','SUSPENDU','approved','pending','rejected') NOT NULL DEFAULT 'ACTIF',
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion DATETIME
) ENGINE=InnoDB;

CREATE TABLE utilisateurs_roles (
    id_utilisateur INT UNSIGNED NOT NULL,
    id_role INT UNSIGNED NOT NULL,
    date_attribution TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_role),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_role) REFERENCES roles(id_role) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE roles_permissions (
    id_role INT UNSIGNED NOT NULL,
    id_permission INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_role, id_permission),
    FOREIGN KEY (id_role) REFERENCES roles(id_role) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES permissions(id_permission) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE zones_forestieres (
    id_zone INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom_zone VARCHAR(150) NOT NULL,
    region VARCHAR(100) NOT NULL,
    wilaya VARCHAR(100),
    superficie_ha DECIMAL(10,2) UNSIGNED,
    coordonnees_gps GEOMETRY NOT NULL,
    indice_risque DECIMAL(4,2) UNSIGNED DEFAULT 0.00
        CHECK (indice_risque BETWEEN 0 AND 10),
    description TEXT,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE capteurs (
    id_capteur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference_serie VARCHAR(100) NOT NULL UNIQUE,
    type_capteur ENUM('TEMPERATURE','MULTI','VENT','HUMIDITE') NOT NULL DEFAULT 'MULTI',
    modele VARCHAR(100),
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    altitude_m DECIMAL(7,2),
    statut ENUM('ACTIF','INACTIF','EN_MAINTENANCE') NOT NULL DEFAULT 'ACTIF',
    date_installation DATE NOT NULL,
    date_derniere_maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_zone INT UNSIGNED NOT NULL,
    FOREIGN KEY (id_zone) REFERENCES zones_forestieres(id_zone)
) ENGINE=InnoDB;

CREATE TABLE mesures (
    id_mesure BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    temperature_c DECIMAL(5,2) NOT NULL,
    humidite_pct DECIMAL(5,2) UNSIGNED,
    vitesse_vent_kmh DECIMAL(6,2) UNSIGNED,
    horodatage DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    qualite_signal TINYINT UNSIGNED DEFAULT 100,
    id_capteur INT UNSIGNED NOT NULL,
    FOREIGN KEY (id_capteur) REFERENCES capteurs(id_capteur)
) ENGINE=InnoDB;

CREATE TABLE alertes (
    id_alerte INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_alerte ENUM('AUTOMATIQUE','MANUELLE') NOT NULL DEFAULT 'AUTOMATIQUE',
    niveau_gravite ENUM('INFO','ATTENTION','CRITIQUE') NOT NULL,
    message TEXT NOT NULL,
    statut ENUM('OUVERTE','EN_COURS','RESOLUE','ANNULEE') NOT NULL DEFAULT 'OUVERTE',
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_resolution DATETIME,
    id_mesure BIGINT UNSIGNED,
    id_zone INT UNSIGNED NOT NULL,
    FOREIGN KEY (id_mesure) REFERENCES mesures(id_mesure),
    FOREIGN KEY (id_zone) REFERENCES zones_forestieres(id_zone)
) ENGINE=InnoDB;

CREATE TABLE incendies (
    id_incendie INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME,
    superficie_brulee_ha DECIMAL(10,2) UNSIGNED,
    statut_incendie ENUM('EN_COURS','MAITRISE','ETEINT') NOT NULL DEFAULT 'EN_COURS',
    cause_presumee VARCHAR(200),
    observations TEXT,
    id_zone INT UNSIGNED NOT NULL,
    id_alerte INT UNSIGNED NOT NULL,
    FOREIGN KEY (id_zone) REFERENCES zones_forestieres(id_zone),
    FOREIGN KEY (id_alerte) REFERENCES alertes(id_alerte)
) ENGINE=InnoDB;

CREATE TABLE cooperatives (
    id_cooperative INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom_cooperative VARCHAR(200) NOT NULL,
    siege_social VARCHAR(300),
    email_contact VARCHAR(150),
    telephone VARCHAR(20),
    numero_agrement VARCHAR(50) UNIQUE,
    statut ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    region VARCHAR(100),
    zone_name VARCHAR(150),
    date_creation DATE NOT NULL DEFAULT (CURDATE()),
    id_responsable INT UNSIGNED NOT NULL,
    id_zone INT UNSIGNED,
    FOREIGN KEY (id_responsable) REFERENCES utilisateurs(id_utilisateur),
    FOREIGN KEY (id_zone) REFERENCES zones_forestieres(id_zone) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE logs_securite (
    id_log BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    table_cible VARCHAR(100),
    id_enregistrement VARCHAR(50),
    ancienne_valeur JSON,
    nouvelle_valeur JSON,
    adresse_ip VARCHAR(45),
    horodatage TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    id_utilisateur INT UNSIGNED,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
) ENGINE=InnoDB;

CREATE TABLE alertes_utilisateurs (
    id_alerte INT UNSIGNED,
    id_utilisateur INT UNSIGNED,
    date_notification DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_alerte, id_utilisateur),

    FOREIGN KEY (id_alerte) REFERENCES alertes(id_alerte),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);