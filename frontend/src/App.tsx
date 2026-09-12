import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { EditPatientPage } from './pages/EditPatientPage';
import { ConsultationDetailPage } from './pages/ConsultationDetailPage';
import { AppointmentFormPage } from './pages/AppointmentFormPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { LoginPage } from './pages/LoginPage';
import { NewPatientPage } from './pages/NewPatientPage';
import { NewConsultationPage } from './pages/NewConsultationPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { PatientsPage } from './pages/PatientsPage';
import { ClinicalHistoryPage } from './pages/ClinicalHistoryPage';
import { PrescriptionPage } from './pages/PrescriptionPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/new" element={<NewPatientPage />} />
        <Route path="/patients/:patientId" element={<PatientDetailPage />} />
        <Route path="/patients/:patientId/edit" element={<EditPatientPage />} />
        <Route path="/patients/:patientId/clinical-history" element={<ClinicalHistoryPage />} />
        <Route path="/patients/:patientId/consultations/new" element={<NewConsultationPage />} />
        <Route path="/patients/:patientId/consultations/:consultationId/edit" element={<NewConsultationPage />} />
        <Route path="/consultations/:consultationId" element={<ConsultationDetailPage />} />
        <Route path="/consultations/:consultationId/prescription" element={<PrescriptionPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/new" element={<AppointmentFormPage />} />
        <Route path="/appointments/:appointmentId/edit" element={<AppointmentFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/patients" replace />} />
  </Routes>;
}
