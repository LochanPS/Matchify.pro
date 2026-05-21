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

    // WebSocket only works in local development.
    // Production (Vercel serverless, Render) = no persistent WS support.
    // Skip to prevent infinite reconnect error spam.
    const isLocalDev = wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1');
    if (!isLocalDev) {
      return;
    }

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
