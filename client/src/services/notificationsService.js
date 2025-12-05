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

const notificationsService = {
  // ============ COMMAND API (Write Operations) ============

  /**
   * Create a new notification for a user
   * @param {number} userId - User ID
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.type - Notification type
   * @param {string} [notificationData.data] - Additional notification data (JSON string)
   * @returns {Promise<Object>} Response with notification_id
   */
  createNotification: async (userId, notificationData) => {
    try {
      const response = await apiClient.post(
        `/api/commands/notifications/${userId}`,
        notificationData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Mark a notification as read
   * @param {number} userId - User ID
   * @param {number} notificationId - Notification ID
   * @returns {Promise<Object>} Success response
   */
  markNotificationRead: async (userId, notificationId) => {
    try {
      const response = await apiClient.patch(
        `/api/commands/notifications/${userId}/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Response with updated_count
   */
  markAllNotificationsRead: async (userId) => {
    try {
      const response = await apiClient.patch(
        `/api/commands/notifications/${userId}/read-all`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a notification
   * @param {number} userId - User ID
   * @param {number} notificationId - Notification ID
   * @returns {Promise<Object>} Success response
   */
  deleteNotification: async (userId, notificationId) => {
    try {
      const response = await apiClient.delete(
        `/api/commands/notifications/${userId}/${notificationId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ============ QUERY API (Read Operations) ============

  /**
   * Get all notifications for a user
   * @param {number} userId - User ID
   * @param {Object} [options] - Query options
   * @param {boolean} [options.unread_only=false] - Return only unread notifications
   * @returns {Promise<Array>} Array of notification objects
   */
  getUserNotifications: async (userId, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.unread_only) params.append("unread_only", "true");

      const response = await apiClient.get(
        `/api/queries/notifications/${userId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get count of unread notifications
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Object with unread_count
   */
  getUnreadCount: async (userId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/notifications/${userId}/count`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default notificationsService;
