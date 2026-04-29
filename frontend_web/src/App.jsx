import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import MainLayout from "./layouts/MainLayout";
import ConsultantLayout from "./layouts/ConsultantLayout";
import ConsultantRequestPage from "./pages/consultant/RequestManagement";
import CustomerCarePage from "./pages/consultant/CustomerCarePage";
import ConsultantAppointmentManager from "./pages/consultant/ConsultantAppointmentManager";
import AdminRequestPage from "./pages/admin/RequestManagement";
import AdminAppoimentPage from "./pages/admin/AdminAppointmentManager";
import LawKnowledgeManager from "./pages/admin/LawKnowledgeManager";
import ServiceManagement from "./pages/admin/ServiceManagement";
import UserManagement from "./pages/admin/UserManagement";
import LawyerLayout from "./layouts/LawyerLayout";
import AssignedCases from "./pages/lawyer/AssignedCases";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientDashboard from "./pages/client/ClientDashboard";
import AssignedAppointment from "./pages/lawyer/AssignedAppointments";
import AssistantLayout from "./layouts/AssistantLayout";
import AssistantAssignedCases from "./pages/assistant/AssistantAssignedCases";
import AssistantAppointmentManager from "./pages/assistant/AssistantAppointmentManager";
import AssistantTaskCenter from "./pages/assistant/AssistantTaskCenter";
import UserProfile from "./pages/client/UserProfile";
import StaffProfile from "./pages/StaffProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />


      {/* --- KHU VỰC QUẢN LÝ / ADMIN (Role 4) --- */}
      <Route element={<ProtectedRoute allowedRoles={[4]} />}>
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<AdminRequestPage />} />
          <Route path="appoiment" element={<AdminAppoimentPage />} />
          <Route path="laws" element={<LawKnowledgeManager />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>
      </Route>

      {/* --- KHU VỰC TƯ VẤN VIÊN (Role 1) --- */}
      <Route element={<ProtectedRoute allowedRoles={[1]} />}>
        <Route path="/consultant" element={<ConsultantLayout />}>
          <Route index element={<Navigate to="requests" replace />} />
          <Route path="requests" element={<ConsultantRequestPage />} />
          <Route path="customer-care" element={<CustomerCarePage />} />
          <Route path="appoiment" element={<ConsultantAppointmentManager />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>
      </Route>

      {/* --- KHU VỰC TRỢ LÝ LUẬT SƯ (Role 2) --- */}
      <Route element={<ProtectedRoute allowedRoles={[2]} />}>
        <Route path="/assistant" element={<AssistantLayout />}>
          <Route index element={<AssistantAssignedCases />} />
          <Route path="cases" element={<AssistantAssignedCases />} />
          <Route path="appointments" element={<AssistantAppointmentManager />} />
          <Route path="tasks" element={<AssistantTaskCenter />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>
      </Route>

      {/* --- KHU VỰC LUẬT SƯ (Role 3) --- */}
      <Route element={<ProtectedRoute allowedRoles={[3]} />}>
        <Route path="/lawyer" element={<LawyerLayout />}>
          <Route index element={<Navigate to="cases" replace />} />
          <Route path="cases" element={<AssignedCases />} />
          <Route path="appointments" element={<AssignedAppointment />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>
      </Route>
      
      {/* --- KHU VỰC KHÁCH HÀNG (Role 0) --- */}
      <Route element={<ProtectedRoute allowedRoles={[0]} />}>
        <Route path="/my-account" element={<ClientDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;