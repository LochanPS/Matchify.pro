import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

/**
 * Get Socket.IO instance
 */
export function getSocket() {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}

/**
 * Connect socket
 */
export function connectSocket() {
  const sock = getSocket();
  if (!sock.connected) {
    sock.connect();
  }
  return sock;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Join a match room to receive live updates
 */
export function joinMatch(matchId, onScoreUpdate, onMatchComplete, onMatchStatus) {
  const sock = connectSocket();

  // Join the match room
  sock.emit('join-match', matchId);

  // Listen for score updates
  if (onScoreUpdate) {
    sock.on('score-update', onScoreUpdate);
  }

  // Listen for match completion
  if (onMatchComplete) {
    sock.on('match-complete', onMatchComplete);
  }

  // Listen for match status changes
  if (onMatchStatus) {
    sock.on('match-status', onMatchStatus);
  }

  return () => {
    // Cleanup function
    sock.emit('leave-match', matchId);
    sock.off('score-update', onScoreUpdate);
    sock.off('match-complete', onMatchComplete);
    sock.off('match-status', onMatchStatus);
  };
}

/**
 * Join a tournament room to receive live match list updates
 */
export function joinTournament(tournamentId, onMatchUpdate) {
  const sock = connectSocket();

  // Join the tournament room
  sock.emit('join-tournament', tournamentId);

  // Listen for match updates
  if (onMatchUpdate) {
    sock.on('tournament-match-update', onMatchUpdate);
  }

  return () => {
    // Cleanup function
    sock.emit('leave-tournament', tournamentId);
    sock.off('tournament-match-update', onMatchUpdate);
  };
}

/**
 * Leave a match room
 */
export function leaveMatch(matchId) {
  const sock = getSocket();
  if (sock && sock.connected) {
    sock.emit('leave-match', matchId);
  }
}

/**
 * Leave a tournament room
 */
export function leaveTournament(tournamentId) {
  const sock = getSocket();
  if (sock && sock.connected) {
    sock.emit('leave-tournament', tournamentId);
  }
}
