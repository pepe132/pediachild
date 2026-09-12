import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Check, Edit3, Play, UserX, XCircle } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { PageState } from '../components/PageState';
import { changeAppointmentStatus, listAppointments, startAppointmentConsultation } from '../features/appointments/appointments.api';
import type { Appointment, AppointmentStatus } from '../types/appointment';

const statusLabels: Record<AppointmentStatus, string> = { SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', COMPLETED: 'Atendida', CANCELLED: 'Cancelada', NO_SHOW: 'Inasistencia' };
const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
function dayRange(value: string) {
  const start = new Date(`${value}T00:00:00`);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function AppointmentsPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? today();
  const status = (params.get('status') || undefined) as AppointmentStatus | undefined;
  const range = dayRange(date);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { created?: boolean; updated?: boolean } | null;
  const appointments = useQuery({ queryKey: ['appointments', date, status], queryFn: () => listAppointments({ ...range, status }) });
  const action = useMutation({ mutationFn: ({ id, type }: { id: string; type: 'confirm' | 'cancel' | 'no-show' }) => changeAppointmentStatus(id, type), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }) });
  const start = useMutation({ mutationFn: startAppointmentConsultation, onSuccess: (result) => navigate(`/consultations/${result.consultation.id}`, { state: { created: true } }) });
  const error = action.error ?? start.error;

  return <div className="page-stack">
    <header className="page-header"><div><p className="eyebrow">Agenda clínica</p><h1>Citas</h1><p>Organiza las próximas atenciones de tu consultorio.</p></div><Link className="button button--primary" to="/appointments/new"><CalendarPlus size={19} /> Nueva cita</Link></header>
    {routeState?.created && <div className="alert alert--success">La cita se programó correctamente.</div>}
    {routeState?.updated && <div className="alert alert--success">La cita se actualizó correctamente.</div>}
    <section className="panel agenda-filters"><label className="field"><span>Fecha</span><input type="date" value={date} onChange={(event) => setParams((current) => { const next = new URLSearchParams(current); next.set('date', event.target.value); return next; })} /></label><label className="field"><span>Estado</span><select value={status ?? ''} onChange={(event) => setParams((current) => { const next = new URLSearchParams(current); if (event.target.value) next.set('status', event.target.value); else next.delete('status'); return next; })}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></section>
    {error && <div className="alert alert--error">{error instanceof ApiError ? error.message : 'No fue posible completar la acción.'}</div>}
    <section className="panel agenda-panel">
      <div className="panel__heading"><div><h2>{new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))}</h2><p>{appointments.data ? `${appointments.data.pagination.total} cita(s)` : 'Consultando agenda…'}</p></div></div>
      {appointments.isPending && <PageState title="Cargando agenda…" />}
      {appointments.isError && <PageState title="No pudimos cargar la agenda">{appointments.error instanceof ApiError ? appointments.error.message : 'Intenta nuevamente.'}</PageState>}
      {appointments.data?.data.length === 0 && <PageState title="No hay citas este día">Puedes programar una cita desde el botón superior.</PageState>}
      {appointments.data && appointments.data.data.length > 0 && <div className="agenda-list">{appointments.data.data.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} busy={action.isPending || start.isPending} onAction={(type) => action.mutate({ id: appointment.id, type })} onStart={() => start.mutate(appointment.id)} />)}</div>}
    </section>
  </div>;
}

function AppointmentRow({ appointment, busy, onAction, onStart }: { appointment: Appointment; busy: boolean; onAction: (type: 'confirm' | 'cancel' | 'no-show') => void; onStart: () => void }) {
  const active = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';
  return <article className="appointment-row">
    <div className="appointment-time"><strong>{new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(appointment.scheduledAt))}</strong><span>{appointment.durationMinutes} min</span></div>
    <div className="appointment-info"><div><span className={`appointment-status appointment-status--${appointment.status.toLowerCase()}`}>{statusLabels[appointment.status]}</span><span className="appointment-patient">{appointment.patient.firstName} {appointment.patient.lastName}</span></div><h3>{appointment.reason}</h3>{appointment.notes && <p>{appointment.notes}</p>}</div>
    <div className="appointment-actions">{appointment.status === 'SCHEDULED' && <button className="button button--ghost" disabled={busy} onClick={() => onAction('confirm')}><Check size={16} /> Confirmar</button>}{active && <><Link className="icon-button" to={`/appointments/${appointment.id}/edit`} aria-label="Editar cita"><Edit3 size={18} /></Link><button className="icon-button" disabled={busy} onClick={() => onAction('no-show')} aria-label="Marcar inasistencia"><UserX size={18} /></button><button className="icon-button icon-button--danger" disabled={busy} onClick={() => onAction('cancel')} aria-label="Cancelar cita"><XCircle size={18} /></button><button className="button button--primary" disabled={busy} onClick={onStart}><Play size={16} /> Iniciar consulta</button></>}</div>
  </article>;
}
