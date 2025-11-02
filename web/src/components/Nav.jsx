import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary">
      <div className="container-fluid cm-container">
        <a className="navbar-brand" href="/">ClassMatch</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#cmNav" aria-controls="cmNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="cmNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink className="nav-link" to="/">Login</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/signup">Signup</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/matches">Matches</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/create-group">Create Group</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/dashboard">Dashboard</NavLink></li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
