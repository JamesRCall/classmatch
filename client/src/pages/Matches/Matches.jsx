import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Alert,
  Button,
  ButtonGroup,
} from "react-bootstrap";
import { FaFilter, FaSearch } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import UserMatchCard from "../../components/UserMatchCard/UserMatchCard";
import usersService from "../../services/usersService";
import "./Matches.css";

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("matchScore");
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user matches from backend on mount
  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await usersService.getUserMatches(user.id);
        const matchesData = response.matches || [];
        setMatches(matchesData);
        setFilteredMatches(matchesData);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  // Filter and sort matches based on search term and sort option
  useEffect(() => {
    let filtered = [...matches];

    if (searchTerm) {
      filtered = filtered.filter(
        (match) =>
          match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.major?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === "matchScore") {
      filtered.sort(
        (a, b) => (b.shared_courses || 0) - (a.shared_courses || 0)
      );
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredMatches(filtered);
  }, [searchTerm, sortBy, matches]);

  const handleMessage = (match) => {
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  if (!user) {
    return null;
  }

  return (
    <Container className="matches-page py-4">
      <div className="page-header mb-4">
        <h1 className="display-5 fw-bold text-white mb-2">
          Find Study Partners
        </h1>
        <p className="text-muted lead">
          Connect with classmates in your courses
        </p>
      </div>

      {showMessage && (
        <Alert variant="info" dismissible onClose={() => setShowMessage(false)}>
          Messaging feature coming soon! For now, reach out to your matches in
          class.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={8}>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search by name or major..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input ps-5"
              size="lg"
            />
          </div>
        </Col>
        <Col md={4}>
          <div className="d-flex align-items-center h-100">
            <FaFilter className="me-2 text-muted" />
            <ButtonGroup className="w-100">
              <Button
                variant={
                  sortBy === "matchScore" ? "primary" : "outline-secondary"
                }
                onClick={() => setSortBy("matchScore")}
              >
                Best Match
              </Button>
              <Button
                variant={sortBy === "name" ? "primary" : "outline-secondary"}
                onClick={() => setSortBy("name")}
              >
                Name
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      <div className="results-section">
        <h5 className="text-light mb-3">
          {loading
            ? "Loading..."
            : `${filteredMatches.length} ${
                filteredMatches.length === 1 ? "Match" : "Matches"
              } Found`}
        </h5>

        {loading ? (
          <Alert variant="info">Loading matches...</Alert>
        ) : filteredMatches.length === 0 ? (
          <Alert variant="info">
            {searchTerm
              ? "No matches found for your search. Try different keywords."
              : "No matches yet. Add more courses to find study partners!"}
          </Alert>
        ) : (
          <Row>
            <Col lg={12}>
              {filteredMatches.map((match, idx) => (
                <UserMatchCard
                  key={idx}
                  user={match}
                  onMessage={handleMessage}
                />
              ))}
            </Col>
          </Row>
        )}
      </div>
    </Container>
  );
}
