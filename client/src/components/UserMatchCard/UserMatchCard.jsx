import React from "react";
import { Card, Badge, Button, Row, Col } from "react-bootstrap";
import {
  FaGraduationCap,
  FaBookOpen,
  FaClock,
  FaUserPlus,
} from "react-icons/fa";
import "./UserMatchCard.css";

const UserMatchCard = ({ user, onInviteToGroup }) => {
  // Parse shared course codes from backend
  const sharedCourseCodes = user.shared_course_codes
    ? user.shared_course_codes.split(", ")
    : [];
  const sharedCourses = user.sharedCourses || sharedCourseCodes;

  return (
    <Card className="user-match-card shadow-sm mb-3">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs="auto">
            <div className="user-avatar">{user.avatar}</div>
          </Col>
          <Col>
            <h5 className="mb-1 text-white">{user.name}</h5>
            <div className="text-muted small mb-2">
              <FaGraduationCap className="me-1" />
              {user.major} • {user.year}
            </div>

            {user.bio && (
              <p className="small text-light-emphasis mb-2 mt-2">{user.bio}</p>
            )}

            {sharedCourses.length > 0 && (
              <div className="mb-2">
                <FaBookOpen className="me-2 text-primary" size={14} />
                <span className="small text-muted">Matched in: </span>
                {sharedCourses.map((courseCode, idx) => (
                  <Badge key={idx} bg="primary" className="me-1" pill>
                    {courseCode}
                  </Badge>
                ))}
              </div>
            )}

            {user.studyPreferences && (
              <div className="mb-2">
                <FaClock className="me-2 text-primary" size={14} />
                <span className="small text-muted">Prefers: </span>
                <span className="small text-light">
                  {user.studyPreferences.times?.join(", ")} •{" "}
                  {user.studyPreferences.style}
                </span>
              </div>
            )}
          </Col>
          <Col
            xs="auto"
            className="text-end d-flex flex-column align-items-end"
          >
            <Badge bg="primary" pill className="mb-2">
              {user.shared_courses || user.matchScore || 0}{" "}
              {(user.shared_courses || user.matchScore) === 1
                ? "course"
                : "courses"}{" "}
              shared
            </Badge>

            {onInviteToGroup && (
              <Button
                variant="success"
                size="sm"
                className="mt-3"
                onClick={() => onInviteToGroup(user)}
              >
                <FaUserPlus className="me-2" />
                Invite
              </Button>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default UserMatchCard;
