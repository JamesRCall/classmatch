import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { FaUsers, FaClock, FaMapMarkerAlt, FaTag, FaEye } from "react-icons/fa";
import "./GroupCard.css";

const GroupCard = ({ group, onJoin, onViewMore, isMember = false }) => {
  const memberCount = group.member_count || group.members?.length || 0;
  const maxMembers = group.max_members || group.maxMembers || 0;
  const spotsLeft = maxMembers - memberCount;

  return (
    <Card className="group-card h-100 shadow-sm">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0 h5">{group.name}</Card.Title>
          <Badge bg={spotsLeft > 0 ? "success" : "secondary"} className="ms-2">
            {spotsLeft > 0 ? `${spotsLeft} spots` : "Full"}
          </Badge>
        </div>

        <div className="text-muted small mb-3">
          <Badge bg="primary" className="me-1">
            {group.course_name || group.courseName}
          </Badge>
        </div>

        <Card.Text className="flex-grow-1 text-light-emphasis">
          {group.description}
        </Card.Text>

        <div className="group-details mt-3">
          <div className="detail-item mb-2">
            <FaClock className="me-2 text-primary" />
            <span className="small">
              {group.meeting_time || group.meetingTime}
            </span>
          </div>
          <div className="detail-item mb-2">
            <FaMapMarkerAlt className="me-2 text-primary" />
            <span className="small">{group.location}</span>
          </div>
          <div className="detail-item mb-3">
            <FaUsers className="me-2 text-primary" />
            <span className="small">
              {memberCount} / {maxMembers} members
            </span>
          </div>

          {group.tags && Array.isArray(group.tags) && group.tags.length > 0 && (
            <div className="mb-3">
              {group.tags.map((tag, idx) => (
                <Badge key={idx} bg="secondary" className="me-1 mb-1" pill>
                  <FaTag className="me-1" size={10} />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex gap-2 mt-auto">
          {onViewMore && (
            <Button
              variant="outline-primary"
              className="flex-grow-1"
              onClick={() => onViewMore(group)}
            >
              <FaEye className="me-1" />
              View More
            </Button>
          )}

          {!isMember && onJoin && spotsLeft > 0 && (
            <Button
              variant="primary"
              className="flex-grow-1"
              onClick={() => onJoin(group)}
            >
              Join Group
            </Button>
          )}

          {isMember && (
            <Button variant="outline-success" className="flex-grow-1" disabled>
              Already a Member
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default GroupCard;
