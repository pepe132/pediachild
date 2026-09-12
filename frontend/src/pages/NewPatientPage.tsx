import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PatientForm } from '../features/patients/PatientForm';
import { createPatient } from '../features/patients/patients.api';

export function NewPatientPage() {
  const navigate = useNavigate();
  return <div className="page-stack form-page">
    <Link className="back-link" to="/patients"><ArrowLeft size={18} /> Volver a pacientes</Link>
    <header className="page-header"><div><p className="eyebrow">Nuevo expediente</p><h1>Registrar paciente</h1><p>Captura los datos generales. La historia clínica se agregará desde el expediente.</p></div></header>
    <PatientForm cancelTo="/patients" submitLabel="Guardar paciente" onSubmit={async (input) => {
      const result = await createPatient(input);
      navigate(`/patients/${result.patient.id}`, { replace: true, state: { created: true } });
    }} />
  </div>;
}
