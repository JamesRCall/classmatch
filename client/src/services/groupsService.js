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

const groupsService = {
  // ============ COMMAND API (Write Operations) ============

  /**
   * Create a new study group
   * @param {Object} groupData - Group data
   * @param {number} groupData.owner_user_id - Owner's user ID
   * @param {string} groupData.course_id - Course ID
   * @param {string} groupData.name - Group name
   * @param {string} [groupData.description] - Group description
   * @param {string} [groupData.meeting_time] - Meeting time
   * @param {string} [groupData.location] - Meeting location
   * @param {number} [groupData.max_members=5] - Maximum members
   * @returns {Promise<Object>} Response with group_id
   */
  createGroup: async (groupData) => {
    try {
      const response = await apiClient.post("/api/commands/groups", groupData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update group details
   * @param {number} groupId - Group ID
   * @param {Object} updates - Fields to update (name, description, meeting_time, location, max_members, tags)
   * @returns {Promise<Object>} Success response
   */
  updateGroup: async (groupId, updates) => {
    try {
      const response = await apiClient.put(
        `/api/commands/groups/${groupId}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete or archive a group
   * @param {number} groupId - Group ID
   * @param {boolean} [hardDelete=false] - Whether to permanently delete
   * @returns {Promise<Object>} Success response
   */
  deleteGroup: async (groupId, hardDelete = false) => {
    try {
      const params = hardDelete ? "?hard_delete=true" : "";
      const response = await apiClient.delete(
        `/api/commands/groups/${groupId}${params}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Join a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID to add
   * @returns {Promise<Object>} Success response
   */
  joinGroup: async (groupId, userId) => {
    try {
      const response = await apiClient.post(
        `/api/commands/groups/${groupId}/join`,
        {
          user_id: userId,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Leave a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID to remove
   * @returns {Promise<Object>} Success response
   */
  leaveGroup: async (groupId, userId) => {
    try {
      const response = await apiClient.post(
        `/api/commands/groups/${groupId}/leave`,
        {
          user_id: userId,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Transfer group ownership
   * @param {number} groupId - Group ID
   * @param {number} newOwnerId - New owner's user ID
   * @returns {Promise<Object>} Success response
   */
  transferOwnership: async (groupId, newOwnerId) => {
    try {
      const response = await apiClient.patch(
        `/api/commands/groups/${groupId}/transfer-ownership`,
        {
          new_owner_id: newOwnerId,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ============ QUERY API (Read Operations) ============

  /**
   * List groups with optional course filter
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.course_id] - Filter by course ID
   * @returns {Promise<Array>} Array of group objects
   */
  listGroups: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.course_id) params.append("course_id", filters.course_id);

      const response = await apiClient.get(
        `/api/queries/groups?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get detailed group information
   * @param {number} groupId - Group ID
   * @returns {Promise<Object>} Group details with members and messages
   */
  getGroup: async (groupId) => {
    try {
      const response = await apiClient.get(`/api/queries/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all members of a group
   * @param {number} groupId - Group ID
   * @returns {Promise<Array>} Array of member objects
   */
  getGroupMembers: async (groupId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/groups/${groupId}/members`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

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
        `/api/queries/groups/${groupId}/messages?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default groupsService;
