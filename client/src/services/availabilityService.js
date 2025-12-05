import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add auth token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const availabilityService = {
  // ============ COMMAND API (Write Operations) ============

  /**
   * Add a new availability slot for a user
   * @param {number} userId - User ID
   * @param {string} slot - Availability slot description (e.g., "Monday 2-4 PM")
   * @returns {Promise<Object>} Response with slot_id
   */
  addAvailabilitySlot: async (userId, slot) => {
    try {
      const response = await apiClient.post(
        `/api/commands/availability/${userId}`,
        {
          slot,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a specific availability slot
   * @param {number} userId - User ID
   * @param {number} slotId - Slot ID to delete
   * @returns {Promise<Object>} Success response
   */
  deleteAvailabilitySlot: async (userId, slotId) => {
    try {
      const response = await apiClient.delete(
        `/api/commands/availability/${userId}/${slotId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Replace all availability slots for a user
   * @param {number} userId - User ID
   * @param {Array<string>} slots - Array of availability slot strings
   * @returns {Promise<Object>} Success response
   */
  updateAllAvailability: async (userId, slots) => {
    try {
      const response = await apiClient.put(
        `/api/commands/availability/${userId}`,
        {
          slots,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ============ QUERY API (Read Operations) ============

  /**
   * Get all availability slots for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of availability slot objects
   */
  getUserAvailability: async (userId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/availability/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default availabilityService;
