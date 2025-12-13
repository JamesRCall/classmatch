import React, { useState, useEffect } from "react";
import groupsService from "../../services/groupsService";
import usersService from "../../services/usersService";
import { Modal, Spinner, Alert, Badge, ListGroup, Form, Button } from "react-bootstrap";
import { FaBook, FaClock, FaMapMarkerAlt, FaUsers, FaTag, FaUserPlus } from "react-icons/fa";
import "./GroupDetailModal.css";

const GroupDetailModal = ({ show, onHide, groupId, currentUserId, preSelectedUser }) => {
  const [groupDetail, setGroupDetail] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch group details and potential invitees when modal opens
  useEffect(() => {
    if (show && groupId) {
      fetchGroupData();
    }
  }, [show, groupId]);

  // Handle pre-selected user from Matches page
  useEffect(() => {
    if (preSelectedUser && matches.length > 0) {
      // Check if preSelectedUser is in the matches list
      const matchExists = matches.some(match => match.id === preSelectedUser.id);
      if (matchExists && !selectedUsers.includes(preSelectedUser.id)) {
        setSelectedUsers([preSelectedUser.id]);
      }
    }
  }, [preSelectedUser, matches]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError("");

      const [detail, matchesData] = await Promise.all([
        groupsService.getGroup(groupId),
        usersService.getUserMatches(currentUserId),
      ]);

      setGroupDetail(detail);

      // Filter matches to only show users in the same course who aren't already members
      const memberIds = detail.members?.map((m) => m.id) || [];
      const eligibleMatches = (matchesData.matches || []).filter(
        (match) => !memberIds.includes(match.id)
      );

      setMatches(eligibleMatches);
    } catch (err) {
      console.error("Error fetching group data:", err);
      setError("Failed to load group details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection for invitation
  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Send invitations to selected users
  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setInviting(true);
      setError("");

      // Invite each selected user to the group with current user as inviter
      await Promise.all(
        selectedUsers.map((userId) => 
          groupsService.joinGroup(groupId, userId, currentUserId)
        )
      );

      setSuccess(`Successfully invited ${selectedUsers.length} user(s)!`);
      setSelectedUsers([]);

      // Refresh group data
      await fetchGroupData();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error inviting users:", err);
      setError("Failed to send invitations. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setError("");
    setSuccess("");
    onHide();
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Group Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading group details...</p>
          </div>
        ) : groupDetail ? (
          <>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                variant="success"
                dismissible
                onClose={() => setSuccess("")}
              >
                {success}
              </Alert>
            )}

            {/* Group Info */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="mb-0">{groupDetail.name}</h4>
                <Badge bg="primary">
                  <FaBook className="me-1" />
                  {groupDetail.course_code}
                </Badge>
              </div>

              <p className="text-muted">{groupDetail.description}</p>

              <div className="group-info mt-3">
                <div className="mb-2">
                  <FaClock className="me-2 text-primary" />
                  <strong>Meeting Time:</strong> {groupDetail.meeting_time}
                </div>
                <div className="mb-2">
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  <strong>Location:</strong> {groupDetail.location}
                </div>
                <div className="mb-3">
                  <FaUsers className="me-2 text-primary" />
                  <strong>Members:</strong> {groupDetail.members?.length || 0} /{" "}
                  {groupDetail.max_members}
                </div>

                {groupDetail.tags &&
                  Array.isArray(groupDetail.tags) &&
                  groupDetail.tags.length > 0 && (
                    <div className="mb-3">
                      {groupDetail.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          bg="secondary"
                          className="me-1 mb-1"
                          pill
                        >
                          <FaTag className="me-1" size={10} />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Current Members */}
            <div className="mb-4">
              <h5 className="mb-3">Current Members</h5>
              <ListGroup>
                {groupDetail.members?.map((member) => (
                  <ListGroup.Item
                    key={member.id}
                    className="d-flex align-items-center"
                  >
                    <div className="member-avatar me-3">{member.avatar}</div>
                    <div className="flex-grow-1">
                      <strong>{member.name}</strong>
                      <div className="text-muted small">
                        {member.major} • {member.year}
                      </div>
                    </div>
                    {member.role === "admin" && (
                      <Badge bg="warning" text="dark">
                        Admin
                      </Badge>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>

            {/* Invite Users Section */}
            {matches.length > 0 && (
              <div className="invite-section">
                <h5 className="mb-3">
                  <FaUserPlus className="me-2" />
                  Invite Classmates
                </h5>
                <p className="text-muted small mb-3">
                  Select users from your matches to invite to this group
                </p>

                <ListGroup
                  className="mb-3"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  {matches.map((match) => (
                    <ListGroup.Item
                      key={match.id}
                      className="d-flex align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleUserSelect(match.id)}
                    >
                      <Form.Check
                        type="checkbox"
                        checked={selectedUsers.includes(match.id)}
                        onChange={() => handleUserSelect(match.id)}
                        className="me-3"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="member-avatar me-3">{match.avatar}</div>
                      <div className="flex-grow-1">
                        <strong>{match.name}</strong>
                        <div className="text-muted small">
                          {match.major} • {match.year}
                        </div>
                      </div>
                      <Badge bg="info" pill>
                        {match.shared_courses || 0} shared
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                <Button
                  variant="primary"
                  onClick={handleInviteUsers}
                  disabled={selectedUsers.length === 0 || inviting}
                  className="w-100"
                >
                  {inviting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Sending Invitations...
                    </>
                  ) : (
                    `Invite ${selectedUsers.length} Selected User${
                      selectedUsers.length !== 1 ? "s" : ""
                    }`
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Alert variant="warning">Group not found.</Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default GroupDetailModal;
