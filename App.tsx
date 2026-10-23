import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Patient/Home';
import HospitalList from './pages/Patient/HospitalList';
import DoctorList from './pages/Patient/DoctorList';
import Booking from './pages/Patient/Booking';
import MyBookings from './pages/Patient/MyBookings';
import PatientManage from './pages/Patient/PatientManage';
import Triage from './pages/Patient/Triage';
import VisitService from './pages/Patient/VisitService';
import Dashboard from './pages/Admin/Dashboard';
import ScheduleManage from './pages/Admin/ScheduleManage';
import OrderManage from './pages/Admin/OrderManage';
import HospitalApproval from './pages/Admin/HospitalApproval';
import HospitalApply from './pages/Admin/HospitalApply';
import BlacklistManage from './pages/Admin/BlacklistManage';
import Workbench from './pages/Doctor/Workbench';
import CallingSystem from './pages/Doctor/CallingSystem';
import MedicalRecordEditor from './pages/Doctor/MedicalRecordEditor';
import PrescriptionEditor from './pages/Doctor/PrescriptionEditor';
import MainLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { UserType } from './config';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 带布局的路由 */}
          <Route element={<MainLayout />}>
            {/* 患者端路由 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospitals" 
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <HospitalList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospitals/:hospitalId/doctors" 
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <DoctorList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/booking/:doctorId" 
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <Booking />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/manage"
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <PatientManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/triage"
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <Triage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/visit-service"
              element={
                <ProtectedRoute allowedRoles={[UserType.PATIENT]}>
                  <VisitService />
                </ProtectedRoute>
              }
            />
            
            {/* 医院管理员路由 */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={[UserType.HOSPITAL_ADMIN, UserType.PLATFORM_ADMIN]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedule"
              element={
                <ProtectedRoute allowedRoles={[UserType.HOSPITAL_ADMIN, UserType.PLATFORM_ADMIN]}>
                  <ScheduleManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={[UserType.HOSPITAL_ADMIN, UserType.PLATFORM_ADMIN]}>
                  <OrderManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hospital-apply"
              element={
                <ProtectedRoute allowedRoles={[UserType.HOSPITAL_ADMIN]}>
                  <HospitalApply />
                </ProtectedRoute>
              }
            />

            {/* 平台管理员路由 */}
            <Route
              path="/admin/hospital-approval"
              element={
                <ProtectedRoute allowedRoles={[UserType.PLATFORM_ADMIN]}>
                  <HospitalApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blacklist"
              element={
                <ProtectedRoute allowedRoles={[UserType.PLATFORM_ADMIN]}>
                  <BlacklistManage />
                </ProtectedRoute>
              }
            />
            
            {/* 医生工作台路由 */}
            <Route 
              path="/doctor/workbench" 
              element={
                <ProtectedRoute allowedRoles={[UserType.DOCTOR]}>
                  <Workbench />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/calling" 
              element={
                <ProtectedRoute allowedRoles={[UserType.DOCTOR]}>
                  <CallingSystem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/medical-record/:regId" 
              element={
                <ProtectedRoute allowedRoles={[UserType.DOCTOR]}>
                  <MedicalRecordEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/prescription/:regId?" 
              element={
                <ProtectedRoute allowedRoles={[UserType.DOCTOR]}>
                  <PrescriptionEditor />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* 404 重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
