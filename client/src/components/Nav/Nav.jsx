import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button, Badge } from "react-bootstrap";
import {
  FaGraduationCap,
  FaHome,
  FaUsers,
  FaSearch,
  FaPlus,
  FaSignOutAlt,
  FaBell,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import NotificationsPanel from "../NotificationsPanel/NotificationsPanel";
import notificationsService from "../../services/notificationsService";
import "./Nav.css";

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count periodically
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const data = await notificationsService.getUserNotifications(user.id, {
        unread_only: true,
      });

      // data is an array, count only group invitations
      const invitationCount = Array.isArray(data)
        ? data.filter((n) => n.type === "group_invitation").length
        : 0;

      setUnreadCount(invitationCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const handleNotificationsToggle = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationsClose = () => {
    setShowNotifications(false);
    fetchUnreadCount(); // Refresh count when panel closes
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Navbar expand="lg" className="navbar-custom shadow-sm" variant="dark">
      <Container>
        <Navbar.Brand
          as={NavLink}
          to={isAuthenticated ? "/dashboard" : "/"}
          className="brand-logo"
        >
          <FaGraduationCap className="me-2" size={28} />
          <span className="fw-bold">ClassMatch</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          {isAuthenticated ? (
            <>
              <Nav className="me-auto">
                <Nav.Link
                  as={NavLink}
                  to="/dashboard"
                  className="nav-item-custom"
                >
                  <FaHome className="me-1" />
                  Dashboard
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/browse-courses"
                  className="nav-item-custom"
                >
                  <FaSearch className="me-1" />
                  Browse Courses
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/matches"
                  className="nav-item-custom"
                >
                  <FaUsers className="me-1" />
                  Find Partners
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/create-group"
                  className="nav-item-custom"
                >
                  <FaPlus className="me-1" />
                  Create Group
                </Nav.Link>
              </Nav>

              <Nav>
                <div className="d-flex align-items-center">
                  <Button
                    variant="link"
                    className="notification-btn position-relative me-2"
                    onClick={handleNotificationsToggle}
                  >
                    <FaBell size={20} />
                    {unreadCount > 0 && (
                      <Badge
                        bg="danger"
                        pill
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <div className="user-info me-3 d-none d-lg-block">
                    <small className="text-muted d-block">Welcome,</small>
                    <span className="text-white fw-semibold">
                      {user?.name?.split(" ")[0] || "Student"}
                    </span>
                  </div>
                  <div className="user-avatar-nav me-3">
                    {user?.avatar || "U"}
                  </div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={handleLogout}
                    className="logout-btn"
                  >
                    <FaSignOutAlt className="me-1" />
                    Logout
                  </Button>
                </div>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/" className="nav-item-custom">
                Login
              </Nav.Link>
              <Nav.Link as={NavLink} to="/signup" className="nav-item-custom">
                Sign Up
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>

      {/* Notifications Panel */}
      {isAuthenticated && user && (
        <NotificationsPanel
          show={showNotifications}
          onHide={handleNotificationsClose}
          userId={user.id}
        />
      )}
    </Navbar>
  );
}
