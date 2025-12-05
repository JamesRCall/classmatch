import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, InputGroup, Alert } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import CourseCard from "../../components/CourseCard/CourseCard";
import coursesService from "../../services/coursesService";
import usersService from "../../services/usersService";
import "./BrowseCourses.css";

const BrowseCourses = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all courses and user's enrolled courses on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesData = await coursesService.listCourses();
        // Backend returns array directly
        const courses = Array.isArray(coursesData) ? coursesData : [];
        setAllCourses(courses);
        setFilteredCourses(courses);

        if (user) {
          const overviewData = await usersService.getUserOverview(user.id);
          const enrolledIds = overviewData.courses?.map((c) => c.id) || [];
          setEnrolledCourseIds(enrolledIds);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter courses based on department and search term
  useEffect(() => {
    let filtered = [...allCourses];

    if (selectedDepartment !== "All") {
      filtered = filtered.filter((course) =>
        course.code.startsWith(selectedDepartment)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, selectedDepartment, allCourses]);

  // Enroll user in selected course
  const handleEnrollCourse = async (course) => {
    if (!user) {
      setError("Please login to enroll in courses");
      return;
    }

    if (enrolledCourseIds.includes(course.id)) {
      return;
    }

    try {
      await coursesService.enrollInCourse(course.id, user.id);
      setEnrolledCourseIds([...enrolledCourseIds, course.id]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error enrolling in course:", err);
      setError("Failed to enroll in course. Please try again.");
    }
  };

  const departments = ["All", "CS", "MATH"];

  return (
    <Container className="browse-courses-page py-4">
      <div className="page-header mb-4">
        <h1 className="display-5 fw-bold text-white mb-2">Browse Courses</h1>
        <p className="text-muted lead">
          Find and join courses to connect with classmates
        </p>
      </div>

      {showSuccess && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setShowSuccess(false)}
        >
          Course added successfully! Check your Dashboard to see matches.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={8}>
          <InputGroup size="lg">
            <Form.Control
              type="text"
              placeholder="Search by course name, code, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            size="lg"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="department-select"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "All" ? "All Departments" : dept}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <div className="results-header mb-3">
        <h5 className="text-light">
          {loading
            ? "Loading..."
            : `${filteredCourses.length} ${
                filteredCourses.length === 1 ? "Course" : "Courses"
              } Found`}
        </h5>
      </div>

      {loading ? (
        <Alert variant="info">Loading courses...</Alert>
      ) : filteredCourses.length === 0 ? (
        <Alert variant="info">
          No courses found matching your criteria. Try adjusting your search or
          filters.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredCourses.map((course) => (
            <Col key={course.id}>
              <CourseCard
                course={course}
                isEnrolled={enrolledCourseIds.includes(course.id)}
                onEnroll={handleEnrollCourse}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default BrowseCourses;
