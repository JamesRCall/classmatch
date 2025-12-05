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

const coursesService = {
  // ============ COMMAND API (Write Operations) ============

  /**
   * Create a new course (admin operation)
   * @param {Object} courseData - Course data
   * @param {string} courseData.id - Course ID
   * @param {string} courseData.code - Course code (e.g., "CS101")
   * @param {string} courseData.name - Course name
   * @param {string} courseData.section - Section number
   * @param {string} courseData.instructor - Instructor name
   * @param {string} courseData.schedule - Course schedule
   * @param {number} [courseData.students] - Number of students
   * @param {string} [courseData.building] - Building name
   * @param {string} [courseData.room] - Room number
   * @returns {Promise<Object>} Response with course_id
   */
  createCourse: async (courseData) => {
    try {
      const response = await apiClient.post(
        "/api/commands/courses",
        courseData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Enroll a user in a course
   * @param {string} courseId - Course ID
   * @param {number} userId - User ID to enroll
   * @returns {Promise<Object>} Success response
   */
  enrollInCourse: async (courseId, userId) => {
    try {
      const response = await apiClient.post(
        `/api/commands/courses/${courseId}/enroll`,
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
   * Unenroll a user from a course
   * @param {string} courseId - Course ID
   * @param {number} userId - User ID to unenroll
   * @returns {Promise<Object>} Success response
   */
  unenrollFromCourse: async (courseId, userId) => {
    try {
      const response = await apiClient.delete(
        `/api/commands/courses/${courseId}/enroll`,
        {
          data: { user_id: userId },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ============ QUERY API (Read Operations) ============

  /**
   * List all courses with optional filtering
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.search] - Search in code or name
   * @param {string} [filters.instructor] - Filter by instructor
   * @returns {Promise<Array>} Array of course objects
   */
  listCourses: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.instructor) params.append("instructor", filters.instructor);

      const response = await apiClient.get(
        `/api/queries/courses?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get detailed course information
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course details with enrolled_count
   */
  getCourse: async (courseId) => {
    try {
      const response = await apiClient.get(`/api/queries/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get list of students enrolled in a course
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} Array of enrolled students
   */
  getCourseStudents: async (courseId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/courses/${courseId}/students`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all study groups for a course
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} Array of group objects
   */
  getCourseGroups: async (courseId) => {
    try {
      const response = await apiClient.get(
        `/api/queries/courses/${courseId}/groups`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default coursesService;
