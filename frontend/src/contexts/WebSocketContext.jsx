import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

// Get WebSocket URL from API URL
const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://matchify-probackend.vercel.app/api';
  // Remove /api suffix for WebSocket connection
  const baseUrl = apiUrl.replace('/api', '');
  return baseUrl;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = getWebSocketUrl();

    // Vercel serverless does not support persistent WebSocket connections.
    // Skip entirely to avoid infinite reconnect loops in the console.
    if (wsUrl.includes('vercel.app')) {
      console.log('ℹ️ WebSocket disabled: Vercel backend (serverless, no WS support). Real-time features via polling.');
      return;
    }

    console.log('🔌 Initializing WebSocket connection to:', wsUrl);

    const socketInstance = io(wsUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      forceNew: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
