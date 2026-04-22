import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

// Shared external store so all components using this hook stay in sync
// without needing a React context provider
let listeners = [];
function subscribe(listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}
function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getStatusSnapshot() {
  return localStorage.getItem('pompierStatus') || 'available';
}

function getMissionSnapshot() {
  return localStorage.getItem('currentMission') || null;
}

// Custom hook to persist pompier status across pages
// Uses useSyncExternalStore to keep all instances in sync
export function usePompierState() {
  const pompierStatus = useSyncExternalStore(subscribe, getStatusSnapshot);
  const currentMissionRaw = useSyncExternalStore(subscribe, getMissionSnapshot);

  const currentMission = (() => {
    try {
      return currentMissionRaw ? JSON.parse(currentMissionRaw) : null;
    } catch {
      return null;
    }
  })();

  // Wrapper to persist status and notify all instances
  const setPompierStatus = useCallback((status) => {
    localStorage.setItem('pompierStatus', status);
    emitChange();
  }, []);

  // Wrapper to persist mission and notify all instances
  const setCurrentMission = useCallback((mission) => {
    if (mission) {
      localStorage.setItem('currentMission', JSON.stringify(mission));
    } else {
      localStorage.removeItem('currentMission');
    }
    emitChange();
  }, []);

  const takeMission = useCallback((alert) => {
    const missionData = {
      ...alert,
      id: alert.id_alerte || alert.id,
      id_alerte: alert.id_alerte || alert.id
    };
    localStorage.setItem('currentMission', JSON.stringify(missionData));
    localStorage.setItem('pompierStatus', 'on_mission');
    emitChange();
  }, []);

  const completeMission = useCallback(() => {
    localStorage.removeItem('currentMission');
    localStorage.setItem('pompierStatus', 'available');
    emitChange();
  }, []);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'pompierStatus' || e.key === 'currentMission') {
        emitChange();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return {
    pompierStatus,
    setPompierStatus,
    currentMission,
    setCurrentMission,
    takeMission,
    completeMission
  };
}
