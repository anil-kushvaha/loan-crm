import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Components
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";

// Admin/Employee pages
import EmployeeManagement from "./pages/Add/EmployeeManagement";
import List from "./pages/List/List";
import ConvertEnquiry from "./pages/inEnquiry/Enquiry";
import LoanApplications from "./pages/LoanApplications/LoanApplications";
import EnquiryForm from "./pages/Enquiry/EnquiryForm"; // ✅ already imported

// Customer Dashboard
import CustomerDashboard from "./components/customer/CustomerDashboard";

const App = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const getDefaultRoute = () => {
    if (!token) return "/login";
    if (role === "customer") return "/customer/dashboard";
    return "/";
  };

  return (
    <div className="app">
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/enquiry" element={<EnquiryForm />} />  {/* ✅ Add this line */}

        {/* Customer routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <div className="customer-layout">
                <Navbar />
                <div className="customer-main">
                  <CustomerDashboard />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Admin/Employee routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "employee"]}>
              <div className="admin-layout">
                <Navbar />
                <div className="admin-wrapper">
                  <Sidebar />
                  <div className="admin-content">
                    <EmployeeManagement />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rd/ConvertEnquiry"
          element={
            <ProtectedRoute allowedRoles={["admin", "employee"]}>
              <div className="admin-layout">
                <Navbar />
                <div className="admin-wrapper">
                  <Sidebar />
                  <div className="admin-content">
                    <ConvertEnquiry />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/list"
          element={
            <ProtectedRoute allowedRoles={["admin", "employee"]}>
              <div className="admin-layout">
                <Navbar />
                <div className="admin-wrapper">
                  <Sidebar />
                  <div className="admin-content">
                    <List />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loan-applications"
          element={
            <ProtectedRoute allowedRoles={["admin", "employee"]}>
              <div className="admin-layout">
                <Navbar />
                <div className="admin-wrapper">
                  <Sidebar />
                  <div className="admin-content">
                    <LoanApplications />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect to default */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </div>
  );
};

export default App;