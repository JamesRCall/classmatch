import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const messagesService = {
  // ============ COMMAND API (Write Operations) ============

  /**
   * Post a new message to a group
   * @param {Object} messageData - Message data
   * @param {number} messageData.group_id - Group ID
   * @param {number} messageData.user_id - User ID posting the message
   * @param {string} messageData.content - Message content
   * @returns {Promise<Object>} Response with message_id
   */
  postMessage: async (messageData) => {
    try {
      const response = await apiClient.post(
        "/api/commands/messages",
        messageData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a message
   * @param {number} messageId - Message ID to delete
   * @returns {Promise<Object>} Success response
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await apiClient.delete(
        `/api/commands/messages/${messageId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ============ QUERY API (Read Operations) ============

  /**
   * Get messages for a group
   * @param {number} groupId - Group ID
   * @param {Object} [pagination] - Pagination options
   * @param {number} [pagination.limit=50] - Number of messages to return
   * @param {number} [pagination.offset=0] - Offset for pagination
   * @returns {Promise<Array>} Array of message objects
   */
  getGroupMessages: async (groupId, pagination = {}) => {
    try {
      const params = new URLSearchParams();
      if (pagination.limit) params.append("limit", pagination.limit);
      if (pagination.offset) params.append("offset", pagination.offset);

      const response = await apiClient.get(
        `/api/queries/messages/group/${groupId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get a specific message detail
   * @param {number} messageId - Message ID
   * @returns {Promise<Object>} Message details
   */
  getMessage: async (messageId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/messages/${messageId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default messagesService;
