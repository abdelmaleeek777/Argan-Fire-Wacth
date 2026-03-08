DELIMITER $$

CREATE TRIGGER trg_detection_incendie
AFTER INSERT ON mesures
FOR EACH ROW
BEGIN
    DECLARE v_id_zone INT UNSIGNED;

    -- Récupérer la zone du capteur
    SELECT id_zone INTO v_id_zone
    FROM capteurs
    WHERE id_capteur = NEW.id_capteur;

    -- Si température > 50°C → alerte CRITIQUE
    IF NEW.temperature_c > 50.00 THEN
        INSERT INTO alertes (
            type_alerte,
            niveau_gravite,
            message,
            statut,
            id_mesure,
            id_zone
        ) VALUES (
            'AUTOMATIQUE',
            'CRITIQUE',
            CONCAT('🔥 ALERTE INCENDIE - Température critique : ', NEW.temperature_c, '°C'),
            'OUVERTE',
            NEW.id_mesure,
            v_id_zone
        );
    END IF;

END$$

CREATE TRIGGER trg_notification_pompiers
AFTER INSERT ON alertes
FOR EACH ROW
BEGIN

    -- Notifier tous les pompiers actifs si alerte CRITIQUE
    IF NEW.niveau_gravite = 'CRITIQUE' THEN

        INSERT INTO alertes_utilisateurs (id_alerte, id_utilisateur)

        SELECT NEW.id_alerte, u.id_utilisateur
        FROM utilisateurs u
        INNER JOIN utilisateurs_roles ur 
            ON u.id_utilisateur = ur.id_utilisateur
        INNER JOIN roles r 
            ON ur.id_role = r.id_role

        WHERE r.libelle = 'POMPIER'
        AND u.statut = 'ACTIF';

    END IF;

END$$

CREATE TRIGGER trg_recalcul_indice_risque
AFTER INSERT ON mesures
FOR EACH ROW
BEGIN

    DECLARE v_id_zone INT UNSIGNED;
    DECLARE v_indice DECIMAL(4,2);
    DECLARE v_temp_norm DECIMAL(5,4);
    DECLARE v_hum_norm DECIMAL(5,4);
    DECLARE v_vent_norm DECIMAL(5,4);

    SELECT id_zone INTO v_id_zone
    FROM capteurs
    WHERE id_capteur = NEW.id_capteur;

    -- Normalisation des valeurs
    SET v_temp_norm = LEAST(NEW.temperature_c / 60.0, 1.0);
    SET v_hum_norm  = 1.0 - LEAST(IFNULL(NEW.humidite_pct,50) / 100.0, 1.0);
    SET v_vent_norm = LEAST(IFNULL(NEW.vitesse_vent_kmh,0) / 100.0, 1.0);

    -- Calcul pondéré
    SET v_indice = ROUND(
        (v_temp_norm * 0.50 +
         v_hum_norm  * 0.30 +
         v_vent_norm * 0.20) * 10.0, 2);

    UPDATE zones_forestieres
    SET indice_risque = v_indice
    WHERE id_zone = v_id_zone;

END$$

CREATE TRIGGER trg_audit_utilisateurs
AFTER UPDATE ON utilisateurs
FOR EACH ROW
BEGIN

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
        OLD.id_utilisateur,

        JSON_OBJECT(
            'email', OLD.email,
            'statut', OLD.statut
        ),

        JSON_OBJECT(
            'email', NEW.email,
            'statut', NEW.statut
        )

    );

END$$

DELIMITER ;