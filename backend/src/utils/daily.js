import fetch from 'node-fetch';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

/**
 * Create a Daily.co room for KYC video call
 * @param {string} roomName - Unique room name
 * @returns {Promise<{url: string, name: string}>}
 */
export const createDailyRoom = async (roomName) => {
  try {
    if (!DAILY_API_KEY) {
      console.warn('⚠️  Daily.co API key not configured - using placeholder URL');
      return {
        url: `https://matchify.daily.co/${roomName}`,
        name: roomName
      };
    }

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2, // Only organizer and admin
          enable_chat: false,
          enable_screenshare: false,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + (60 * 30) // Expires in 30 minutes
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Daily.co API error:', data);
      throw new Error(data.error || 'Failed to create Daily.co room');
    }

    console.log('✅ Daily.co room created:', data.url);
    return {
      url: data.url,
      name: data.name
    };
  } catch (error) {
    console.error('Create Daily.co room error:', error);
    // Fallback to placeholder URL
    return {
      url: `https://matchify.daily.co/${roomName}`,
      name: roomName
    };
  }
};

/**
 * Delete a Daily.co room after call ends
 * @param {string} roomName - Room name to delete
 * @returns {Promise<boolean>}
 */
export const deleteDailyRoom = async (roomName) => {
  try {
    if (!DAILY_API_KEY) {
      console.warn('⚠️  Daily.co API key not configured - skipping room deletion');
      return false;
    }

    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Daily.co delete error:', data);
      return false;
    }

    console.log('✅ Daily.co room deleted:', roomName);
    return true;
  } catch (error) {
    console.error('Delete Daily.co room error:', error);
    return false;
  }
};

/**
 * Get Daily.co room info
 * @param {string} roomName - Room name
 * @returns {Promise<object>}
 */
export const getDailyRoomInfo = async (roomName) => {
  try {
    if (!DAILY_API_KEY) {
      return null;
    }

    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get Daily.co room info error:', error);
    return null;
  }
};
