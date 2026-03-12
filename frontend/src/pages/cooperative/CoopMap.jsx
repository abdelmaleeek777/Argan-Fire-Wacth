import { useState, useEffect } from "react";
import { Map, Layers, RefreshCcw, Info, Compass, ChevronLeft } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix pour les icones par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Coordonnées simulées autour d'Agadir / Souss-Massa
const MOCK_ZONES = [
  { id_zone: 1, nom_zone: "Zone Nord-Est", niveau_risque_base: "élevé",   superficie_ha: 210, capteurs: 4, x: 580, y: 120, w: 200, h: 140, alertes_actives: 1, latitude_centre: 30.42, longitude_centre: -8.85 },
  { id_zone: 2, nom_zone: "Zone Centrale", niveau_risque_base: "critique", superficie_ha: 340, capteurs: 5, x: 310, y: 200, w: 240, h: 180, alertes_actives: 1, latitude_centre: 30.38, longitude_centre: -9.00 },
  { id_zone: 3, nom_zone: "Zone Sud",      niveau_risque_base: "moyen",    superficie_ha: 180, capteurs: 3, x: 360, y: 420, w: 200, h: 130, alertes_actives: 0, latitude_centre: 30.30, longitude_centre: -8.95 },
  { id_zone: 4, nom_zone: "Zone Ouest",    niveau_risque_base: "faible",   superficie_ha: 260, capteurs: 3, x: 80,  y: 280, w: 200, h: 150, alertes_actives: 0, latitude_centre: 30.36, longitude_centre: -9.20 },
  { id_zone: 5, nom_zone: "Zone Est",      niveau_risque_base: "moyen",    superficie_ha: 150, capteurs: 2, x: 660, y: 290, w: 160, h: 120, alertes_actives: 0, latitude_centre: 30.36, longitude_centre: -8.75 },
  { id_zone: 6, nom_zone: "Zone Haute",    niveau_risque_base: "élevé",    superficie_ha: 100, capteurs: 3, x: 480, y: 60,  w: 140, h: 100, alertes_actives: 1, latitude_centre: 30.46, longitude_centre: -8.92 },
];

const MOCK_CAPTEURS = [
  { id: 1, id_zone: 1, etat: "actif",    x: 610, y: 155, temp: 74.2, alerte: true },
  { id: 2, id_zone: 1, etat: "actif",    x: 660, y: 175, temp: 45.1, alerte: false },
  { id: 3, id_zone: 1, etat: "en_panne", x: 720, y: 145, temp: null, alerte: false },
  { id: 4, id_zone: 1, etat: "actif",    x: 690, y: 210, temp: 52.3, alerte: false },
  { id: 5, id_zone: 2, etat: "actif",    x: 360, y: 250, temp: 58.7, alerte: true },
  { id: 6, id_zone: 2, etat: "actif",    x: 420, y: 290, temp: 49.0, alerte: false },
  { id: 7, id_zone: 2, etat: "actif",    x: 490, y: 260, temp: 51.2, alerte: false },
  { id: 8, id_zone: 2, etat: "en_panne", x: 380, y: 330, temp: null, alerte: false },
  { id: 9, id_zone: 2, etat: "actif",    x: 520, y: 350, temp: 44.5, alerte: false },
  { id: 10, id_zone: 3, etat: "actif",   x: 400, y: 450, temp: 42.1, alerte: false },
  { id: 11, id_zone: 3, etat: "actif",   x: 470, y: 490, temp: 38.7, alerte: false },
  { id: 12, id_zone: 3, etat: "actif",   x: 530, y: 460, temp: 40.2, alerte: false },
  { id: 13, id_zone: 4, etat: "actif",   x: 120, y: 310, temp: 35.0, alerte: false },
  { id: 14, id_zone: 4, etat: "actif",   x: 180, y: 360, temp: 37.4, alerte: false },
  { id: 15, id_zone: 4, etat: "actif",   x: 230, y: 320, temp: 36.1, alerte: false },
  { id: 16, id_zone: 5, etat: "actif",   x: 695, y: 330, temp: 48.5, alerte: false },
  { id: 17, id_zone: 5, etat: "actif",   x: 740, y: 375, temp: 50.1, alerte: false },
  { id: 18, id_zone: 6, etat: "actif",   x: 510, y: 90,  temp: 55.0, alerte: true },
  { id: 19, id_zone: 6, etat: "actif",   x: 560, y: 125, temp: 46.8, alerte: false },
  { id: 20, id_zone: 6, etat: "actif",   x: 590, y: 100, temp: 44.3, alerte: false },
];

const MOCK_CAPTEURS_GEO = MOCK_CAPTEURS.map(c => {
  const zone = MOCK_ZONES.find(z => z.id_zone === c.id_zone);
  // Transform SVG coordinates into lat/lng offsets around the map center
  const latOffset = (300 - c.y) * 0.0003;
  const lngOffset = (c.x - 440) * 0.0003;
  return { ...c, lat: 30.38 + latOffset, lng: -8.96 + lngOffset };
});

const generatePolygon = (x, y, w, h) => {
  // Convert SVG rect to a geographical polygon
  const baseLat = 30.38 + (300 - y) * 0.0003;
  const baseLng = -8.96 + (x - 440) * 0.0003;
  const latH = h * 0.0003;
  const lngW = w * 0.0003;
  
  return [
    [baseLat, baseLng], // Top Left
    [baseLat, baseLng + lngW], // Top Right
    [baseLat - latH, baseLng + lngW], // Bottom Right
    [baseLat - latH, baseLng], // Bottom Left
  ];
};

const risqueFill = {
  faible:   { fill: "rgba(16, 185, 129, 0.1)", stroke: "#10b981" },
  moyen:    { fill: "rgba(245, 158, 11, 0.1)", stroke: "#f59e0b" },
  "élevé":    { fill: "rgba(239, 68, 68, 0.1)", stroke: "#ef4444" },
  critique: { fill: "rgba(168, 85, 247, 0.1)", stroke: "#a855f7" },
};

const risqueBadge = {
  faible:   { bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700" },
  moyen:    { bg: "bg-amber-50 border-amber-200", color: "text-amber-700" },
  "élevé":    { bg: "bg-orange-50 border-orange-200", color: "text-orange-700" },
  critique: { bg: "bg-purple-50 border-purple-200", color: "text-purple-700" },
};

export default function CoopMap() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [showCapteurs, setShowCapteurs] = useState(true);

  const zone = MOCK_ZONES.find(z => z.id_zone === selectedZone);
  const capteursZone = selectedZone ? MOCK_CAPTEURS_GEO.filter(c => c.id_zone === selectedZone) : [];

  // Helper component to center map when zone is selected
  function MapController({ selectedZoneId }) {
    const map = useMap();
    useEffect(() => {
      if (selectedZoneId) {
        const z = MOCK_ZONES.find(zone => zone.id_zone === selectedZoneId);
        if (z) {
          map.flyTo([z.latitude_centre, z.longitude_centre], 13, { duration: 1.5 });
        }
      } else {
        map.flyTo([30.38, -8.96], 10, { duration: 1.5 }); // Default center
      }
    }, [selectedZoneId, map]);
    return null;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-12 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-emerald-200 shadow-md">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Carte des zones forestières</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Souss-Massa · Coopérative Tifawt Argan</p>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button
              onClick={() => setShowCapteurs(!showCapteurs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                showCapteurs 
                  ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700 shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" />
              {showCapteurs ? "Masquer capteurs" : "Afficher capteurs"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6">

        {/* SVG Map Container */}
        <div className="flex-[2] relative">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[600px] w-full relative">
            
            {/* Légende Flottante */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Niveau de risque
              </div>
              {Object.entries(risqueBadge).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-[4px]" style={{ backgroundColor: risqueFill[k].stroke, opacity: 0.8 }} />
                  <span className={`text-xs font-bold capitalize ${v.color}`}>{k}</span>
                </div>
              ))}
              
              {showCapteurs && (
                <div className="border-t border-slate-100 mt-3 pt-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-xs font-semibold text-slate-600">Capteur actif</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ring-2 ring-rose-200" />
                    <span className="text-xs font-semibold text-slate-600">En alerte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">En panne</span>
                  </div>
                </div>
              )}
            </div>

            <MapContainer
              center={[30.38, -8.96]}
              zoom={10}
              className="w-full h-full z-0"
              zoomControl={false}
            >
              <MapController selectedZoneId={selectedZone} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles"
              />

              {/* Zones Polygons */}
              {MOCK_ZONES.map(z => {
                const rc = risqueFill[z.niveau_risque_base] || {};
                const isSelected = selectedZone === z.id_zone;
                const positions = generatePolygon(z.x, z.y, z.w, z.h);
                
                return (
                  <Polygon
                    key={z.id_zone}
                    positions={positions}
                    pathOptions={{
                      fillColor: rc.stroke,
                      fillOpacity: isSelected ? 0.4 : 0.2,
                      color: isSelected ? "#1e293b" : rc.stroke,
                      weight: isSelected ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedZone(isSelected ? null : z.id_zone),
                    }}
                  >
                    <Popup className="rounded-xl">
                      <div className="font-bold text-slate-800">{z.nom_zone}</div>
                      <div className="text-sm text-slate-600">{z.superficie_ha} ha</div>
                    </Popup>
                  </Polygon>
                );
              })}

              {/* Capteurs */}
              {showCapteurs && MOCK_CAPTEURS_GEO.map(c => {
                const isPanne = c.etat === "en_panne";
                const color = isPanne ? "#94a3b8" : c.alerte ? "#ef4444" : "#10b981";
                
                // create a custom icon resembling the glowing dots
                const customIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="
                    width: 16px; 
                    height: 16px; 
                    background-color: ${color}; 
                    border: 2px solid white; 
                    border-radius: 50%;
                    box-shadow: 0 0 ${c.alerte ? '15px 5px rgba(239, 68, 68, 0.6)' : '5px rgba(0,0,0,0.3)'};
                    ${c.alerte ? 'animation: pulse 2s infinite;' : ''}
                  "></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                });

                return (
                  <Marker 
                    key={c.id} 
                    position={[c.lat, c.lng]} 
                    icon={customIcon}
                  >
                    {c.temp !== null && (
                      <Popup>
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-500">CAP-{String(c.id).padStart(3, "0")}</div>
                          <div className={`text-lg font-black ${c.alerte ? "text-rose-600" : "text-slate-800"}`}>
                            {c.temp}°C
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="flex-1 lg:max-w-xs flex flex-col gap-4">
          {!zone ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm h-full overflow-hidden flex flex-col">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                Toutes les zones
              </h3>
              <div className="overflow-y-auto pr-2 -mr-2 space-y-2 flex-1">
                {MOCK_ZONES.map(z => {
                  const rb = risqueBadge[z.niveau_risque_base] || {};
                  return (
                    <div
                      key={z.id_zone}
                      onClick={() => setSelectedZone(z.id_zone)}
                      className="p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">{z.nom_zone}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{z.superficie_ha} ha · {z.capteurs} capt.</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-lg border ${rb.bg} ${rb.color}`}>
                          {z.niveau_risque_base}
                        </span>
                        {z.alertes_actives > 0 && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 border border-rose-200 rounded-lg animate-pulse">
                            ⚠️ {z.alertes_actives} alerte
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setSelectedZone(null)}
                className="self-start text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 mb-5 bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-100"
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>

              {/* Zone header */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{zone.nom_zone}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                  <Map className="w-4 h-4" /> {zone.latitude_centre.toFixed(3)}°N, {Math.abs(zone.longitude_centre).toFixed(3)}°O
                </p>
                {(() => { 
                  const rb = risqueBadge[zone.niveau_risque_base]; 
                  return (
                    <span className={`inline-block mt-3 text-xs font-bold uppercase px-3 py-1 rounded-full border ${rb.bg} ${rb.color}`}>
                      Risque {zone.niveau_risque_base}
                    </span>
                  );
                })()}
              </div>

              {/* Stats zone */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Superficie", val: `${zone.superficie_ha} ha` },
                  { label: "Capteurs", val: zone.capteurs },
                  { label: "Alertes", val: zone.alertes_actives },
                  { label: "Zone ID", val: `#${zone.id_zone}` },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                    <div className={`text-base font-black ${s.label === "Alertes" && zone.alertes_actives > 0 ? "text-rose-600" : "text-slate-800"}`}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Capteurs de la zone */}
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Capteurs installés
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                {capteursZone.map(c => {
                  const isPanne = c.etat === "en_panne";
                  const sColor = isPanne ? "bg-slate-100 text-slate-500 border-slate-200" : c.alerte ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200";
                  
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isPanne ? "bg-slate-400" : c.alerte ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                      
                      <div className="flex-1 font-mono text-xs font-bold text-slate-600">
                        CAP-{String(c.id).padStart(3, "0")}
                      </div>
                      
                      <div className={`text-sm font-black ${c.alerte ? "text-rose-600" : "text-slate-800"}`}>
                        {c.temp !== null ? `${c.temp}°C` : "—"}
                      </div>
                      
                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${sColor}`}>
                        {isPanne ? "Panne" : c.alerte ? "Alerte" : "Actif"}
                      </div>
                    </div>
                  );
                })}
                {capteursZone.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-4">Aucun capteur dans cette zone.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
