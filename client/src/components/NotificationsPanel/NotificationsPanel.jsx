import React, { useState, useEffect } from "react";
import {
  Offcanvas,
  ListGroup,
  Badge,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { FaBell, FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import notificationsService from "../../services/notificationsService";
import groupsService from "../../services/groupsService";
import "./NotificationsPanel.css";

const NotificationsPanel = ({ show, onHide, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (show && userId) {
      fetchNotifications();
    }
  }, [show, userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await notificationsService.getUserNotifications(userId, {
        unread_only: true,
      });

      // data is already an array
      const invitations = Array.isArray(data)
        ? data.filter((n) => n.type === "group_invitation")
        : [];

      setNotifications(invitations);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (notification) => {
    const notifId = notification.id;
    setProcessing((prev) => ({ ...prev, [notifId]: "accepting" }));

    try {
      const data = JSON.parse(notification.data);
      const groupId = data.group_id;

      await groupsService.acceptInvitation(groupId, userId);

      // Remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Failed to accept invitation");
    } finally {
      setProcessing((prev) => {
        const updated = { ...prev };
        delete updated[notifId];
        return updated;
      });
    }
  };

  const handleDeclineInvitation = async (notification) => {
    const notifId = notification.id;
    setProcessing((prev) => ({ ...prev, [notifId]: "declining" }));

    try {
      const data = JSON.parse(notification.data);
      const groupId = data.group_id;

      await groupsService.declineInvitation(groupId, userId);

      // Remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err) {
      console.error("Error declining invitation:", err);
      setError("Failed to decline invitation");
    } finally {
      setProcessing((prev) => {
        const updated = { ...prev };
        delete updated[notifId];
        return updated;
      });
    }
  };

  const renderNotification = (notification) => {
    const data = JSON.parse(notification.data);
    const isProcessing = processing[notification.id];

    return (
      <ListGroup.Item key={notification.id} className="notification-item">
        <div className="d-flex align-items-start">
          <div className="notification-icon me-3">
            <FaUserPlus size={20} className="text-primary" />
          </div>
          <div className="flex-grow-1">
            <div className="notification-content">
              <strong>Group Invitation</strong>
              <p className="mb-1">
                You've been invited to join <strong>{data.group_name}</strong>
              </p>
              <small className="text-muted">Course: {data.course_id}</small>
            </div>
            <div className="notification-actions mt-2">
              <Button
                size="sm"
                variant="success"
                className="me-2"
                onClick={() => handleAcceptInvitation(notification)}
                disabled={!!isProcessing}
              >
                {isProcessing === "accepting" ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-1"
                    />
                    Accepting...
                  </>
                ) : (
                  <>
                    <FaCheck className="me-1" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleDeclineInvitation(notification)}
                disabled={!!isProcessing}
              >
                {isProcessing === "declining" ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-1"
                    />
                    Declining...
                  </>
                ) : (
                  <>
                    <FaTimes className="me-1" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <FaBell className="me-2" />
          Notifications
          {notifications.length > 0 && (
            <Badge bg="primary" pill className="ms-2">
              {notifications.length}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state text-center py-5">
            <FaBell size={48} className="text-muted mb-3" />
            <p className="text-muted">No new notifications</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {notifications.map(renderNotification)}
          </ListGroup>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default NotificationsPanel;
