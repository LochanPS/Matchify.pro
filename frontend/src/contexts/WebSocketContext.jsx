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
  const apiUrl = import.meta.env.VITE_API_URL || 'https://matchify-pro.onrender.com/api';
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
    // Connect to backend WebSocket server
    const wsUrl = getWebSocketUrl();
    
    // Determine if we're in production
    const isProduction = wsUrl.includes('onrender.com') || wsUrl.includes('vercel.app');
    
    const socketInstance = io(wsUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // 20 second timeout
      transports: ['websocket', 'polling'], // Allow fallback to polling
      withCredentials: true,
      forceNew: true,
      // Additional options for production
      ...(isProduction && {
        secure: true,
        rejectUnauthorized: false
      })
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected:', socketInstance.id);
      console.log('🔗 Connected to:', wsUrl);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      console.error('🔗 Failed to connect to:', wsUrl);
      console.error('🔍 Error details:', error);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔄 WebSocket reconnection failed:', error.message);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      socketInstance.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
