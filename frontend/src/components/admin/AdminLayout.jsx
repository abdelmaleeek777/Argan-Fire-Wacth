USE parc;

CREATE TABLE Segment (
    indIP VARCHAR(11) PRIMARY KEY,
    nomSegment VARCHAR(20) NOT NULL,
    etage TINYINT(1),
    nbSalle TINYINT(2) DEFAULT 0,
    nbPoste TINYINT(2) DEFAULT 0
);

CREATE TABLE Salle (
    nSalle VARCHAR(7) PRIMARY KEY,
    nomSalle VARCHAR(20) NOT NULL,
    nbPoste TINYINT(2),
    indIP VARCHAR(11),
    FOREIGN KEY (indIP) REFERENCES Segment(indIP)
);

CREATE TABLE Poste (
    nPoste VARCHAR(7) PRIMARY KEY,
    nomPoste VARCHAR(20) NOT NULL,
    indIP VARCHAR(11),
    ad VARCHAR(3),
    typePoste VARCHAR(9),
    nSalle VARCHAR(7),
    nbLog TINYINT(2) DEFAULT 0,

    FOREIGN KEY (indIP) REFERENCES Segment(indIP),
    FOREIGN KEY (nSalle) REFERENCES Salle(nSalle),

    CONSTRAINT chk_ad CHECK (CAST(ad AS UNSIGNED) BETWEEN 0 AND 255)
);

CREATE TABLE Logiciel (
    nLog VARCHAR(5) PRIMARY KEY,
    nomLog VARCHAR(20),
    dateAch DATETIME,
    version VARCHAR(7),
    typeLog VARCHAR(9),
    prix DECIMAL(6,2),
    nbInstall TINYINT(2) DEFAULT 0,

    CONSTRAINT chk_prix CHECK (prix >= 0)
);

CREATE TABLE Installer (
    nPoste VARCHAR(7),
    nLog VARCHAR(5),
    numIns INTEGER(5),
    dateIns TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delai SMALLINT,

    PRIMARY KEY (numIns),
    FOREIGN KEY (nPoste) REFERENCES Poste(nPoste),
    FOREIGN KEY (nLog) REFERENCES Logiciel(nLog),

    CONSTRAINT unique_install UNIQUE (nPoste, nLog)
);

CREATE TABLE Types (
    typeLP VARCHAR(9) PRIMARY KEY,
    nomType VARCHAR(20)
);