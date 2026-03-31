import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

export const useFirefighterSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [firefighters, setFirefighters] = useState([]);
  const [myStatus, setMyStatus] = useState('disponible');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(URL, {
      auth: { token },
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connecté');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket déconnecté');
    });

    // Écouteurs d'événements
    newSocket.on('new_incident_alert', (data) => {
      setIncidents((prev) => [...prev, data]);
      // Jouer le son d'alerte
      try {
        const audio = new Audio('/alert.mp3');
        audio.play().catch(e => console.error("Erreur lecture audio", e));
      } catch (err) {
        console.error("Audio non supporté", err);
      }
    });

    newSocket.on('request_accepted', (data) => {
      // Une équipe a accepté
      console.log('Demande acceptée par une équipe', data);
    });

    newSocket.on('request_cancelled', (data) => {
      // Demande annulée (souvent parce qu'une autre équipe a pris la mission)
      setIncidents((prev) => prev.filter((incident) => incident.id_alerte !== data.id_alerte));
    });

    newSocket.on('firefighter_status_update', (data) => {
      setFirefighters((prev) => 
        prev.map((ff) => ff.id_pompier === data.id_pompier ? { ...ff, statut: data.statut } : ff)
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const acceptMission = useCallback((id_alerte, id_equipe, id_chef) => {
    if (socket) {
      socket.emit('accept_mission', { id_alerte, id_equipe, id_chef });
      // On retire localement l'incident de la file d'attente
      setIncidents((prev) => prev.filter((inc) => inc.id_alerte !== id_alerte));
    }
  }, [socket]);

  const refuseMission = useCallback((id_alerte, id_equipe, id_chef, raison) => {
    if (socket) {
      socket.emit('refuse_mission', { id_alerte, id_equipe, id_chef, raison });
      // L'incident reste dans la liste (ou non selon la logique métier, s'ils ont refusé on l'enlève de LEUR liste)
      setIncidents((prev) => prev.filter((inc) => inc.id_alerte !== id_alerte));
    }
  }, [socket]);

  const updateStatus = useCallback((id_pompier, statut) => {
    if (socket) {
      socket.emit('update_my_status', { id_pompier, statut });
      setMyStatus(statut);
    }
  }, [socket]);

  // Méthode utilitaire pour initier la liste de tous les pompiers (venant d'API)
  const setInitialFirefighters = useCallback((data) => {
    setFirefighters(data);
  }, []);

  return {
    incidents,
    firefighters,
    myStatus,
    acceptMission,
    refuseMission,
    updateStatus,
    isConnected,
    setInitialFirefighters,
    setMyStatus
  };
};

export default useFirefighterSocket;
