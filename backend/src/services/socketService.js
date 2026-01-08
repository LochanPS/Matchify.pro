import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join match room
    socket.on('join-match', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`Socket ${socket.id} joined match:${matchId}`);
    });

    // Leave match room
    socket.on('leave-match', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`Socket ${socket.id} left match:${matchId}`);
    });

    // Join tournament room (for live match list)
    socket.on('join-tournament', (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} joined tournament:${tournamentId}`);
    });

    // Leave tournament room
    socket.on('leave-tournament', (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} left tournament:${tournamentId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Broadcast score update to all clients watching a match
 */
export function broadcastScoreUpdate(matchId, scoreData) {
  if (!io) return;
  
  io.to(`match:${matchId}`).emit('score-update', {
    matchId,
    score: scoreData,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasted score update for match:${matchId}`);
}

/**
 * Broadcast match status change
 */
export function broadcastMatchStatus(matchId, status, data = {}) {
  if (!io) return;
  
  io.to(`match:${matchId}`).emit('match-status', {
    matchId,
    status,
    ...data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasted status ${status} for match:${matchId}`);
}

/**
 * Broadcast match completion
 */
export function broadcastMatchComplete(matchId, winner, scoreData) {
  if (!io) return;
  
  io.to(`match:${matchId}`).emit('match-complete', {
    matchId,
    winner,
    score: scoreData,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasted match completion for match:${matchId}`);
}

/**
 * Broadcast to tournament room (for live match list updates)
 */
export function broadcastToTournament(tournamentId, event, data) {
  if (!io) return;
  
  io.to(`tournament:${tournamentId}`).emit(event, {
    tournamentId,
    ...data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasted ${event} to tournament:${tournamentId}`);
}

/**
 * Get connected clients count for a match
 */
export function getMatchViewersCount(matchId) {
  if (!io) return 0;
  
  const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
  return room ? room.size : 0;
}
