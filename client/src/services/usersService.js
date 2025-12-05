import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if exists
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

const usersService = {
  // ============ COMMAND API (Write Operations) ============

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User full name
   * @param {string} [userData.major] - User's major
   * @param {string} [userData.year] - User's year (e.g., "Freshman", "Sophomore")
   * @param {string} [userData.bio] - User bio
   * @returns {Promise<Object>} Response with user_id
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post(
        "/api/commands/users/register",
        userData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with user object
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/api/commands/users/login", {
        email,
        password,
      });

      // Store user data if login successful
      if (response.data.ok && response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updates - Fields to update (name, major, year, avatar, bio, study_prefs)
   * @returns {Promise<Object>} Success response
   */
  updateUser: async (userId, updates) => {
    try {
      const response = await apiClient.put(
        `/api/commands/users/${userId}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete user account
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Success response
   */
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/api/commands/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ============ QUERY API (Read Operations) ============

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  getUser: async (userId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/users/detail/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * List all users with optional filtering
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.major] - Filter by major
   * @param {string} [filters.year] - Filter by year
   * @returns {Promise<Array>} Array of user objects
   */
  listUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.major) params.append("major", filters.major);
      if (filters.year) params.append("year", filters.year);

      const response = await apiClient.get(
        `/api/queries/users/detail?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get user overview (profile + availability + courses)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User overview with availability and courses
   */
  getUserOverview: async (userId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/users/${userId}/overview`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get user matches (users sharing courses)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Object with matches array
   */
  getUserMatches: async (userId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/users/${userId}/matches`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get user's groups
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of group objects
   */
  getUserGroups: async (userId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/users/${userId}/groups`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Search users by query string, major, or year
   * @param {Object} searchParams - Search parameters
   * @param {string} [searchParams.q] - Search query string
   * @param {string} [searchParams.major] - Filter by major
   * @param {string} [searchParams.year] - Filter by year
   * @param {number} [searchParams.limit=20] - Result limit
   * @returns {Promise<Array>} Array of matching users
   */
  searchUsers: async (searchParams = {}) => {
    try {
      const params = new URLSearchParams();
      if (searchParams.q) params.append("q", searchParams.q);
      if (searchParams.major) params.append("major", searchParams.major);
      if (searchParams.year) params.append("year", searchParams.year);
      if (searchParams.limit) params.append("limit", searchParams.limit);

      const response = await apiClient.get(
        `/api/queries/users/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Logout user (clear local storage)
   */
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  },
};

export default usersService;
