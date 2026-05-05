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
  
  // Log for debugging
  console.log('🔌 WebSocket connecting to:', baseUrl);
  
  return baseUrl;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get WebSocket URL
    const wsUrl = getWebSocketUrl();
    
    // Check if we're on Vercel (serverless - no WebSocket support)
    const isVercel = wsUrl.includes('vercel.app');
    
    // Skip WebSocket connection on Vercel
    if (isVercel) {
      console.log('ℹ️ WebSocket disabled on Vercel (serverless environment)');
      console.log('💡 Real-time features work via polling in production');
      return;
    }
    
    // Only connect WebSocket for local development or non-Vercel deployments
    console.log('🔌 Initializing WebSocket connection to:', wsUrl);
    
    const socketInstance = io(wsUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error.message);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
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
