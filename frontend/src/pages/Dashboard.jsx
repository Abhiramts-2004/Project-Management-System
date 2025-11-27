import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  return user.role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />;
};

export default Dashboard;
