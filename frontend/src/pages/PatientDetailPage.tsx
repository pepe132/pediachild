import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CalendarPlus, ChevronRight, Edit3, UserRound } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { formatPatientAge } from '../components/PatientAge';
import { PageState } from '../components/PageState';
import { listPatientConsultations } from '../features/consultations/consultations.api';
import { listAppointments } from '../features/appointments/appointments.api';
import { getPatient } from '../features/patients/patients.api';
import { getPatientGrowth } from '../features/growth/growth.api';
import { GrowthCharts } from '../features/growth/GrowthCharts';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

export function PatientDetailPage() {
  const { patientId = '' } = useParams();
  const location = useLocation();
  const patient = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId), enabled: Boolean(patientId), retry: false });
  const consultations = useQuery({ queryKey: ['consultations', patientId], queryFn: () => listPatientConsultations(patientId), enabled: Boolean(patientId) });
  const appointments = useQuery({ queryKey: ['appointments', 'patient', patientId], queryFn: () => listAppointments({ patientId }), enabled: Boolean(patientId) });
  const growth = useQuery({ queryKey: ['growth', patientId], queryFn: () => getPatientGrowth(patientId), enabled: Boolean(patientId) });
  const routeState = location.state as { created?: boolean; updated?: boolean; consultationCreated?: string; appointmentCreated?: boolean; appointmentUpdated?: boolean } | null;
  const justCreated = Boolean(routeState?.created);
  const justUpdated = Boolean(routeState?.updated);
  const consultationCreated = Boolean(routeState?.consultationCreated);

  if (patient.isPending) return <div className="panel"><PageState title="Cargando expediente…" /></div>;
  if (patient.isError) return <div className="panel"><PageState title="No pudimos abrir el expediente">{patient.error instanceof ApiError ? patient.error.message : 'Intenta nuevamente.'}</PageState></div>;
  const record = patient.data.patient;

  return <div className="page-stack">
    <Link className="back-link" to="/patients"><ArrowLeft size={18} /> Volver a pacientes</Link>
    {justCreated && <div className="alert alert--success" role="status">El paciente se registró correctamente.</div>}
    {justUpdated && <div className="alert alert--success" role="status">Los datos del paciente se actualizaron correctamente.</div>}
    {consultationCreated && <div className="alert alert--success" role="status">La consulta se guardó correctamente.</div>}
    {routeState?.appointmentCreated && <div className="alert alert--success" role="status">La cita se programó correctamente.</div>}
    {routeState?.appointmentUpdated && <div className="alert alert--success" role="status">La cita se actualizó correctamente.</div>}
    <header className="patient-header panel">
      <div className="patient-header__identity"><span className="patient-header__avatar"><UserRound /></span><div><p className="eyebrow">Expediente activo</p><h1>{record.firstName} {record.lastName}</h1><p>{formatPatientAge(record.ageValue, record.ageUnit)}</p></div></div>
      <div className="patient-header__actions"><Link className="button button--ghost" to={`/patients/${record.id}/edit`}><Edit3 size={17} /> Editar</Link><Link className="button button--primary" to={`/patients/${record.id}/consultations/new`}><CalendarPlus size={18} /> Nueva consulta</Link></div>
    </header>
    <section className="detail-grid">
      <article className="panel detail-card"><p className="eyebrow">Datos generales</p><dl><div><dt>Edad registrada</dt><dd>{formatPatientAge(record.ageValue, record.ageUnit)}</dd></div><div><dt>Fecha de nacimiento</dt><dd>{record.dateOfBirth ? dateFormatter.format(new Date(`${record.dateOfBirth}T12:00:00`)) : 'No registrada'}</dd></div><div><dt>Lugar de nacimiento</dt><dd>{record.placeOfBirth || 'No registrado'}</dd></div><div><dt>Fecha de registro</dt><dd>{dateFormatter.format(new Date(record.createdAt))}</dd></div></dl></article>
      <article className="panel empty-module"><h2>Historia clínica</h2><p>Antecedentes heredofamiliares, perinatales, nutricionales, patológicos y de vacunación.</p><Link className="button button--ghost history-card__action" to={`/patients/${record.id}/clinical-history`}><BookOpen size={17} /> Abrir historia clínica</Link></article>
    </section>
    {growth.data && <GrowthCharts data={growth.data} />}
    <section className="panel"><div className="panel__heading"><div><h2>Consultas</h2><p>{consultations.data ? `${consultations.data.pagination.total} en el historial` : 'Historial clínico del paciente'}</p></div><Link className="button button--ghost" to={`/patients/${record.id}/consultations/new`}><CalendarPlus size={17} /> Agregar</Link></div>
      {consultations.isPending && <PageState title="Cargando consultas…" />}
      {consultations.isError && <PageState title="No pudimos cargar las consultas">Intenta nuevamente.</PageState>}
      {consultations.data?.data.length === 0 && <PageState title="Sin consultas registradas">Crea una consulta para comenzar el seguimiento.</PageState>}
      {consultations.data && consultations.data.data.length > 0 && <div className="consultation-list">{consultations.data.data.map((consultation) => <Link className="consultation-item" to={`/consultations/${consultation.id}`} key={consultation.id}>
        <div className="consultation-date"><strong>{new Intl.DateTimeFormat('es-MX', { day: '2-digit' }).format(new Date(consultation.consultationDate))}</strong><span>{new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(new Date(consultation.consultationDate))}</span></div>
        <div className="consultation-summary"><div><span className={`status-badge ${consultation.status === 'COMPLETED' ? 'status-badge--complete' : ''}`}>{consultation.status === 'COMPLETED' ? 'Completada' : 'En progreso'}</span><small>{new Intl.DateTimeFormat('es-MX', { year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(consultation.consultationDate))}</small></div><h3>{consultation.reason}</h3><p>{consultation.currentIllness || consultation.notes || 'Sin notas adicionales.'}</p><div className="consultation-meta"><span>{consultation.diagnoses.length} diagnóstico(s)</span><span>{consultation.treatments.length} tratamiento(s)</span></div></div>
        <span className="icon-button" aria-hidden="true"><ChevronRight /></span>
      </Link>)}</div>}
    </section>
    <section className="panel"><div className="panel__heading"><div><h2>Citas</h2><p>{appointments.data ? `${appointments.data.pagination.total} programada(s) en total` : 'Agenda de este paciente'}</p></div><Link className="button button--ghost" to={`/appointments/new?patientId=${record.id}`}><CalendarPlus size={17} /> Programar cita</Link></div>
      {appointments.isPending && <PageState title="Cargando citas…" />}
      {appointments.isError && <PageState title="No pudimos cargar las citas">Intenta nuevamente.</PageState>}
      {appointments.data?.data.length === 0 && <PageState title="Sin citas registradas">Programa una cita para este paciente.</PageState>}
      {appointments.data && appointments.data.data.length > 0 && <div className="patient-appointments">{appointments.data.data.map((appointment) => <article key={appointment.id} className="patient-appointment-row"><div><strong>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(appointment.scheduledAt))}</strong><span>{appointment.durationMinutes} minutos</span></div><div><strong>{appointment.reason}</strong><span>{patientAppointmentStatus[appointment.status]}</span></div>{appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' ? <Link className="button button--ghost" to={`/appointments/${appointment.id}/edit`}>Editar</Link> : <span />}</article>)}</div>}
    </section>
  </div>;
}

const patientAppointmentStatus = { SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', COMPLETED: 'Atendida', CANCELLED: 'Cancelada', NO_SHOW: 'Inasistencia' } as const;
