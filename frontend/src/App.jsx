import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import ProjectDetails from "./pages/ProjectDetails";

import Employees from "./pages/Employees";
import ActivityLogs from "./pages/ActivityLogs";

import MyTasks from "./pages/MyTasks";
import TesterDashboard from "./pages/TesterDashboard";

// Placeholder components
// const Projects = () => <div className="text-2xl font-bold">Projects</div>;
// const Employees = () => <div className="text-2xl font-bold">Employees</div>;

const Unauthorized = () => (
  <div className="text-2xl font-bold text-red-600">Unauthorized</div>
);

import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tester-dashboard" element={<TesterDashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/activity" element={<ActivityLogs />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
