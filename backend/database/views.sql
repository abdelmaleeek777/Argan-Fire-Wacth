USE argan_fire_watch;

CREATE VIEW vue_derniere_mesure_capteurs AS

SELECT 
c.id_capteur,
c.reference_serie,
c.type_capteur,
z.nom_zone,
m.temperature_c,
m.humidite_pct,
m.vitesse_vent_kmh,
m.horodatage

FROM capteurs c

JOIN zones_forestieres z
ON c.id_zone = z.id_zone

JOIN mesures m
ON c.id_capteur = m.id_capteur

WHERE m.horodatage = (
SELECT MAX(m2.horodatage)
FROM mesures m2
WHERE m2.id_capteur = c.id_capteur
);


CREATE VIEW vue_alertes_actives AS

SELECT

a.id_alerte,
a.type_alerte,
a.niveau_gravite,
a.message,
a.date_creation,
z.nom_zone,
z.region,
a.statut

FROM alertes a

JOIN zones_forestieres z
ON a.id_zone = z.id_zone

WHERE a.statut != 'RESOLUE';

CREATE VIEW vue_incendies_actifs AS

SELECT

i.id_incendie,
i.date_debut,
z.nom_zone,
z.region,
i.statut_incendie,
i.superficie_brulee_ha

FROM incendies i

JOIN zones_forestieres z
ON i.id_zone = z.id_zone

WHERE i.statut_incendie = 'EN_COURS';

CREATE VIEW vue_statistiques_zones AS

SELECT

z.id_zone,
z.nom_zone,
z.region,
z.indice_risque,
COUNT(c.id_capteur) AS nombre_capteurs

FROM zones_forestieres z

LEFT JOIN capteurs c
ON z.id_zone = c.id_zone

GROUP BY z.id_zone;

CREATE VIEW vue_cooperatives_responsables AS

SELECT

c.id_cooperative,
c.nom_cooperative,
c.email_contact,
c.telephone,
u.nom,
u.prenom,
u.email

FROM cooperatives c

JOIN utilisateurs u
ON c.id_responsable = u.id_utilisateur;