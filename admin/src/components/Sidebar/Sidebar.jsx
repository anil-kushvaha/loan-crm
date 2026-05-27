// Sidebar.js
import React, { useState } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { NavLink } from 'react-router-dom';
import { Receipt } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle button for mobile */}
      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-options">
          <NavLink to="/" className="sidebar-option" onClick={() => setIsOpen(false)}>
            <img src={assets.add_icon} alt="Add" className="sidebar-icon" />
            <p>Add Employees</p>
          </NavLink>
          <NavLink to="/list" className="sidebar-option" onClick={() => setIsOpen(false)}>
            <img src={assets.order_icon} alt="List" className="sidebar-icon" />
            <p>Customer List</p>
          </NavLink>
          <NavLink to="/rd/ConvertEnquiry" className="sidebar-option" onClick={() => setIsOpen(false)}>
            <img src={assets.order_icon} alt="Convert Enquiry" />
            <p>Convert Enquiry</p>
          </NavLink>
          {/* ✅ New Loan Applications Link */}
          <NavLink to="/loan-applications" className="sidebar-option" onClick={() => setIsOpen(false)}>
            <img src={assets.order_icon} alt="Loans" className="sidebar-icon" />
            <p>Loan Applications</p>
          </NavLink>
          
        </div>
      </div>
    </>
  );
};

export default Sidebar;