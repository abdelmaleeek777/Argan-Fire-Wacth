import React from 'react';
import { Phone, Star } from 'lucide-react';

const gradeColors = {
  sapeur: 'bg-slate-500',
  caporal: 'bg-blue-500',
  sergent: 'bg-violet-500',
  lieutenant: 'bg-amber-500',
  capitaine: 'bg-emerald-500',
};

const statusConfig = {
  disponible: { color: 'bg-emerald-500', text: 'Disponible', strip: 'border-b-emerald-500', dotPulse: true },
  en_intervention: { color: 'bg-orange-500', text: 'En intervention', strip: 'border-b-orange-500', dotPulse: false },
  repos: { color: 'bg-slate-500', text: 'Repos', strip: 'border-b-slate-500', dotPulse: false },
  absent: { color: 'bg-red-500', text: 'Absent', strip: 'border-b-red-500', dotPulse: false },
};

export const FirefighterCard = ({ pompier, isChef }) => {
  const { nom, prenom, matricule, grade, telephone, specialite, statut, equipe } = pompier;
  
  const initiales = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  const avatarColor = gradeColors[grade?.toLowerCase()] || 'bg-slate-500';
  const currentStatus = statusConfig[statut?.toLowerCase()] || statusConfig.disponible;

  return (
    <div className={`relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden border-b-4 ${currentStatus.strip}`}>
      <div className="p-6">
        {/* Header: Avatar, Name & Status */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-full text-white flex items-center justify-center text-xl font-bold ${avatarColor}`}>
              {initiales}
            </div>
            
            {/* Infos Pompier */}
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {prenom} {nom}
              </h3>
              <p className="text-xs text-slate-400 capitalize">{matricule} • {grade}</p>
              {isChef && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 w-fit border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Chef d'équipe
                </div>
              )}
            </div>
          </div>

          {/* Badge Statut */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="relative flex h-2.5 w-2.5">
              {currentStatus.dotPulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatus.color}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStatus.color}`}></span>
            </span>
            <span className="text-xs font-medium text-slate-700">{currentStatus.text}</span>
          </div>
        </div>

        {/* Corps - Spécialité et Équipe */}
        <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 rounded-2xl">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Spécialité</p>
            <p className="text-sm font-semibold text-slate-800">{specialite}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Équipe</p>
            <p className="text-sm font-semibold text-slate-800">{equipe}</p>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="flex gap-2">
          {telephone && (
            <a 
              href={`tel:${telephone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              Appeler
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirefighterCard;
