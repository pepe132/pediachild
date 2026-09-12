import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { PageState } from '../components/PageState';
import { PatientForm } from '../features/patients/PatientForm';
import { getPatient, updatePatient } from '../features/patients/patients.api';

export function EditPatientPage() {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patient = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId), enabled: Boolean(patientId), retry: false });

  if (patient.isPending) return <div className="panel"><PageState title="Cargando paciente…" /></div>;
  if (patient.isError) return <div className="panel"><PageState title="No pudimos cargar el paciente">{patient.error instanceof ApiError ? patient.error.message : 'Intenta nuevamente.'}</PageState></div>;
  const record = patient.data.patient;

  return <div className="page-stack form-page">
    <Link className="back-link" to={`/patients/${patientId}`}><ArrowLeft size={18} /> Volver al expediente</Link>
    <header className="page-header"><div><p className="eyebrow">Expediente clínico</p><h1>Editar paciente</h1><p>Actualiza los datos generales de {record.firstName}.</p></div></header>
    <PatientForm
      cancelTo={`/patients/${patientId}`}
      submitLabel="Guardar cambios"
      initialValues={{ firstName: record.firstName, lastName: record.lastName, ageValue: record.ageValue, ageUnit: record.ageUnit, dateOfBirth: record.dateOfBirth ?? '', sex: record.sex, placeOfBirth: record.placeOfBirth ?? '' }}
      onSubmit={async (input) => {
        const result = await updatePatient(patientId, input);
        queryClient.setQueryData(['patient', patientId], result);
        await queryClient.invalidateQueries({ queryKey: ['patients'] });
        navigate(`/patients/${patientId}`, { replace: true, state: { updated: true } });
      }}
    />
  </div>;
}
