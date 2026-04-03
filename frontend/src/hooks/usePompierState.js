import { useState, useEffect, useCallback } from 'react';

// Custom hook to persist pompier status across pages
export function usePompierState() {
  // Load initial state from localStorage
  const [pompierStatus, setPompierStatusInternal] = useState(() => {
    const saved = localStorage.getItem('pompierStatus');
    return saved || 'available';
  });
  
  const [currentMission, setCurrentMissionInternal] = useState(() => {
    const saved = localStorage.getItem('currentMission');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Wrapper to persist status
  const setPompierStatus = useCallback((status) => {
    setPompierStatusInternal(status);
    localStorage.setItem('pompierStatus', status);
  }, []);

  // Wrapper to persist mission
  const setCurrentMission = useCallback((mission) => {
    setCurrentMissionInternal(mission);
    if (mission) {
      localStorage.setItem('currentMission', JSON.stringify(mission));
    } else {
      localStorage.removeItem('currentMission');
    }
  }, []);

  const takeMission = useCallback((alert) => {
    setCurrentMission(alert);
    setPompierStatus('on_mission');
  }, [setCurrentMission, setPompierStatus]);

  const completeMission = useCallback(() => {
    setCurrentMission(null);
    setPompierStatus('available');
  }, [setCurrentMission, setPompierStatus]);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'pompierStatus') {
        setPompierStatusInternal(e.newValue || 'available');
      }
      if (e.key === 'currentMission') {
        try {
          setCurrentMissionInternal(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setCurrentMissionInternal(null);
        }
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
