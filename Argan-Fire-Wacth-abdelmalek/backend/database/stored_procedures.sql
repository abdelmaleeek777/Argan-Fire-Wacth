DELIMITER $$

CREATE PROCEDURE sp_ajouter_mesure(
    IN p_id_capteur INT,
    IN p_temperature DECIMAL(5,2),
    IN p_humidite DECIMAL(5,2),
    IN p_vent DECIMAL(6,2)
)

BEGIN

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

CREATE PROCEDURE sp_declarer_incendie(
    IN p_id_alerte INT,
    IN p_id_zone INT
)

BEGIN

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

CREATE PROCEDURE sp_cloturer_incendie(
    IN p_id_incendie INT,
    IN p_superficie DECIMAL(10,2)
)

BEGIN

UPDATE incendies

SET
date_fin = NOW(),
statut_incendie = 'ETEINT',
superficie_brulee_ha = p_superficie

WHERE id_incendie = p_id_incendie;

END$$

CREATE PROCEDURE sp_creer_cooperative(
    IN p_nom VARCHAR(200),
    IN p_email VARCHAR(150),
    IN p_tel VARCHAR(20),
    IN p_responsable INT
)

BEGIN

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

CREATE PROCEDURE sp_alertes_zone(
    IN p_id_zone INT
)

BEGIN

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

DELIMITER ;