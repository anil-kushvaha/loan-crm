import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // User ke naam ka pehla letter nikalne ke liye safely
  const firstLetter = user.name ? user.name.charAt(0) : "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* LEFT: BRANDING */}
      <div className="navbar-left">
        <img src="/logo.png" alt="Loan CRM Logo" className="logo" />
        <span className="app-title">Loan CRM</span>
      </div>

      {/* RIGHT: ACCOUNT CONTROLS */}
      <div className="navbar-right">
        <div className="user-info-container">
          {/* Professional Avatar Bubble */}
          <div className="user-avatar">
            {firstLetter}
          </div>
          
          <div className="user-details">
            <span className="user-name">{user.name || "User"}</span>
            <span className="user-role">{user.role || "Staff"}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;