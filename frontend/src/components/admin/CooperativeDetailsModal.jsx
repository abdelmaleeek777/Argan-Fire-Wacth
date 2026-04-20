import React, { useEffect } from "react";
import {
  X,
  Loader2,
  Trees,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Layers,
} from "lucide-react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper to convert [lng, lat] to [lat, lng] for Leaflet
export function wktToLeaflet(coords) {
  if (!coords || coords.length === 0) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

// Helper to get center of polygon
export function getPolygonCenter(coords) {
  if (!coords || coords.length === 0) return [30.38, -8.96];
  const leafletCoords = wktToLeaflet(coords);
  const lats = leafletCoords.map((c) => c[0]);
  const lngs = leafletCoords.map((c) => c[1]);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

// Component to fit map bounds to polygon
export function MapFitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const leafletCoords = wktToLeaflet(coords);
      const bounds = L.latLngBounds(leafletCoords);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [coords, map]);
  return null;
}

const CooperativeDetailsModal = ({ isOpen, onClose, detailsModal }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1F2A22]/60 backdrop-blur-[8px] flex items-center justify-center z-[100] p-4">
      <style>{`
        .modal-scroll-area::-webkit-scrollbar {
          width: 8px;
        }

        .modal-scroll-area::-webkit-scrollbar-track {
          background: transparent;
          margin-block: 16px;
        }

        .modal-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(78, 107, 74, 0.24);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .modal-scroll-area::-webkit-scrollbar-thumb:hover {
          background: rgba(78, 107, 74, 0.38);
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .modal-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: rgba(78,107,74,0.24) transparent;
        }
      `}</style>
      <div className="relative w-full max-w-2xl">
        <div className="modal-glow"></div>
        <div className="bg-[#F8F7F2] rounded-[32px] shadow-[0_20px_60px_rgba(31,42,33,0.16)] max-h-[90vh] overflow-hidden border border-[#4F5C4A]/10 relative z-10 flex flex-col">
          <div className="shrink-0 bg-[#F8F7F2] border-b border-[#4F5C4A]/[0.05] px-8 py-6 flex items-center justify-between rounded-t-[32px] z-20">
            <h2 className="text-[20px] font-[800] text-[#1F2A22]">
              Cooperative Information
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#DCE3D6] rounded-[12px] transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7468]" />
            </button>
          </div>
          <div className="modal-scroll-area flex-1 overflow-y-auto px-6 md:px-8 py-6 pr-4 md:pr-5">
            {detailsModal.loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-8 h-8 text-[#4E6B4A] animate-spin" />
                <p className="text-[#6B7468] font-[700]">
                  Retrieving details...
                </p>
              </div>
            ) : detailsModal.coop ? (
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="bg-[#DCE3D6] rounded-[24px] p-6 border border-[#4F5C4A]/[0.10]">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-[#F8F7F2] rounded-[20px] flex items-center justify-center shadow-sm border border-[#4F5C4A]/[0.05]">
                      <Trees className="w-8 h-8 text-[#4E6B4A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[22px] font-[800] text-[#1F2A22] tracking-tight">
                        {detailsModal.coop.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[#6B7468] mt-1.5 font-bold">
                        <MapPin className="w-4 h-4 text-[#B88A44]" />
                        <span className="text-[14px]">
                          {detailsModal.coop.region}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-1.5 text-[10px] font-[800] rounded-full uppercase tracking-widest border shadow-sm ${
                        detailsModal.coop.status === "approved"
                          ? "bg-[#4E6B4A] text-white border-[#4E6B4A]"
                          : detailsModal.coop.status === "pending"
                            ? "bg-[#B88A44] text-white border-[#B88A44]"
                            : "bg-rose-600 text-white border-rose-600"
                      }`}
                    >
                      {detailsModal.coop.status || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F8F7F2] rounded-[20px] p-5 border border-[#4F5C4A]/[0.08] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-[#DCE3D6] rounded-[14px] flex items-center justify-center text-[#4E6B4A]">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7468] uppercase font-[800] tracking-widest">
                          Coop Owner
                        </p>
                        <p className="text-[15px] font-[700] text-[#1F2A22] mt-0.5">
                          {detailsModal.coop.ownerName}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F8F7F2] rounded-[20px] p-5 border border-[#4F5C4A]/[0.08] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-[#DCE3D6] rounded-[14px] flex items-center justify-center text-[#B88A44]">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7468] uppercase font-[800] tracking-widest">
                          Email Address
                        </p>
                        <p className="text-[15px] font-[700] text-[#1F2A22] mt-0.5 truncate">
                          {detailsModal.coop.ownerEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  {detailsModal.coop.phone && (
                    <div className="bg-[#F8F7F2] rounded-[20px] p-5 border border-[#4F5C4A]/[0.08] shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-[#DCE3D6] rounded-[14px] flex items-center justify-center text-[#6E7A4E]">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-[#6B7468] uppercase font-[800] tracking-widest">
                            Contact Phone
                          </p>
                          <p className="text-[15px] font-[700] text-[#1F2A22] mt-0.5">
                            {detailsModal.coop.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-[#F8F7F2] rounded-[20px] p-5 border border-[#4F5C4A]/[0.08] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-[#DCE3D6] rounded-[14px] flex items-center justify-center text-[#4E6B4A]">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7468] uppercase font-[800] tracking-widest">
                          Registered Date
                        </p>
                        <p className="text-[15px] font-[700] text-[#1F2A22] mt-0.5">
                          {detailsModal.coop.createdAt
                            ? new Date(
                                detailsModal.coop.createdAt,
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zones Section */}
                {detailsModal.zones.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[12px] font-[800] text-[#1F2A22] uppercase tracking-[0.1em] flex items-center gap-2.5">
                      <div className="w-2 h-2 bg-[#4E6B4A] rounded-full"></div>
                      Forest Zones ({detailsModal.zones.length})
                    </h4>

                    {/* Map showing all zones */}
                    <div className="rounded-[24px] overflow-hidden border border-[#4F5C4A]/[0.15] shadow-inner relative z-0">
                      <MapContainer
                        center={getPolygonCenter(
                          detailsModal.zones[0]?.coordinates || [],
                        )}
                        zoom={12}
                        style={{ height: "300px", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {detailsModal.zones.map(
                          (zone) =>
                            zone.coordinates &&
                            zone.coordinates.length > 0 && (
                              <Polygon
                                key={zone._id}
                                positions={wktToLeaflet(zone.coordinates)}
                                pathOptions={{
                                  color: "#4E6B4A",
                                  fillColor: "#4E6B4A",
                                  fillOpacity: 0.2,
                                  weight: 3,
                                }}
                              />
                            ),
                        )}
                        {detailsModal.zones[0]?.coordinates && (
                          <MapFitBounds
                            coords={detailsModal.zones[0].coordinates}
                          />
                        )}
                      </MapContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detailsModal.zones.map((zone) => (
                        <React.Fragment key={zone._id}>
                          <div className="bg-[#F8F7F2] rounded-[16px] p-4 border border-[#4F5C4A]/[0.08] flex items-center justify-between shadow-sm group hover:border-[#4E6B4A]/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#DCE3D6] rounded-[12px] flex items-center justify-center text-[#4E6B4A] group-hover:scale-110 transition-transform">
                                <Trees className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-[700] text-[14px] text-[#1F2A22] leading-tight">
                                  {zone.name}
                                </p>
                                <p className="text-[11px] text-[#6B7468] font-bold mt-0.5 uppercase tracking-wider">
                                  Argan Forest
                                </p>
                              </div>
                            </div>
                            {zone.superficie_ha && (
                              <span className="px-3 py-1 bg-[#4E6B4A]/10 text-[#4E6B4A] text-[11px] font-[800] rounded-full border border-[#4E6B4A]/15">
                                {zone.superficie_ha} ha
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {detailsModal.zones.length === 0 && (
                  <div className="bg-[#DCE3D6]/30 rounded-[20px] p-10 border border-[#4F5C4A]/[0.08] text-center">
                    <Layers className="w-10 h-10 text-[#6B7468]/30 mx-auto mb-3" />
                    <p className="text-[#6B7468] font-bold text-[14px]">
                      No forest zones assigned to this cooperative yet
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperativeDetailsModal;
