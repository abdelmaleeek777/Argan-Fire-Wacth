import React, { useState, useContext } from 'react';
import { Flame, ChevronDown, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { SocketContext } from '../../components/pompier/FirefighterLayout';

export default function FirefighterIncidents() {
  const { user } = useContext(SocketContext) || {};
  const [expandedIncident, setExpandedIncident] = useState(null);
  
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      zoneName: 'North Forest Zone',
      severity: 'urgence_maximale',
      status: 'ACTIVE',
      timestamp: '2 hours ago',
      temperature: 850,
      area: 150,
      resources: ['Team Alpha', 'Team Bravo'],
      description: 'Large fire spreading rapidly'
    },
    {
      id: 2,
      zoneName: 'South Argan Valley',
      severity: 'alerte',
      status: 'ACTIVE',
      timestamp: '45 mins ago',
      temperature: 520,
      area: 45,
      resources: ['Team Delta'],
      description: 'Vegetation fire under control'
    },
  ]);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'urgence_maximale':
        return 'bg-rose-100 text-rose-700';
      case 'alerte':
        return 'bg-orange-100 text-orange-700';
      case 'vigilance':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const toggleExpand = (id) => {
    setExpandedIncident(expandedIncident === id ? null : id);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Active Incidents</h1>
        <p className="text-slate-500 font-medium mt-1">Monitor and respond to ongoing incidents</p>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Flame size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No active incidents</p>
          </div>
        ) : (
          incidents.map(incident => (
            <div
              key={incident.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                onClick={() => toggleExpand(incident.id)}
                className="p-6 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <Flame size={24} className="text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800">{incident.zoneName}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${getSeverityBadge(incident.severity)}`}>
                        {incident.severity === 'urgence_maximale' ? 'EMERGENCY' : 'ALERT'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock size={14} /> {incident.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform ${expandedIncident === incident.id ? 'rotate-180' : ''}`}
                />
              </div>

              {expandedIncident === incident.id && (
                <div className="border-t border-slate-100 p-6 bg-slate-50/50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Temperature</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{incident.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Area</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{incident.area} ha</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Status</p>
                      <p className="text-sm font-bold text-rose-600 mt-1">{incident.status}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">Description</p>
                    <p className="text-slate-700 text-sm">{incident.description}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">Resources Deployed</p>
                    <div className="flex flex-wrap gap-2">
                      {incident.resources.map((resource, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-semibold">
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-colors">
                      Accept Mission
                    </button>
                    <button className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-xl transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
