import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../api/client';
import { PageState } from '../components/PageState';
import { createAppointment, getAppointment, updateAppointment } from '../features/appointments/appointments.api';
import { getPatient } from '../features/patients/patients.api';
import { PatientSearchSelect } from '../features/patients/PatientSearchSelect';

const schema = z.object({
  patientId: z.string().uuid('Selecciona un paciente.'),
  scheduledAt: z.string().min(1, 'Selecciona fecha y hora.').refine((value) => new Date(value).getTime() > Date.now(), 'La cita debe programarse en el futuro.'),
  durationMinutes: z.number({ error: 'Escribe una duración válida.' }).int().min(5, 'Mínimo 5 minutos.').max(480, 'Máximo 480 minutos.'),
  reason: z.string().trim().min(1, 'Escribe el motivo de la cita.').max(500),
  notes: z.string().trim().max(5_000),
});
type Values = z.infer<typeof schema>;
function toLocalInput(value: string) { const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); }
function defaultTime() { const date = new Date(); date.setHours(date.getHours() + 1, 0, 0, 0); return toLocalInput(date.toISOString()); }

export function AppointmentFormPage() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const presetPatientId = searchParams.get('patientId') ?? '';
  const editing = Boolean(appointmentId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const appointment = useQuery({ queryKey: ['appointment', appointmentId], queryFn: () => getAppointment(appointmentId!), enabled: editing, retry: false });
  const presetPatient = useQuery({ queryKey: ['patient', presetPatientId], queryFn: () => getPatient(presetPatientId), enabled: Boolean(presetPatientId) && !editing, retry: false });
  const current = appointment.data?.appointment;
  const form = useForm<Values>({ resolver: zodResolver(schema), values: (!editing || current) ? { patientId: current?.patientId ?? presetPatientId, scheduledAt: current ? toLocalInput(current.scheduledAt) : defaultTime(), durationMinutes: current?.durationMinutes ?? 30, reason: current?.reason ?? '', notes: current?.notes ?? '' } : undefined });
  const returnTo = presetPatientId && !editing ? `/patients/${presetPatientId}` : '/appointments';

  if ((editing && appointment.isPending) || (presetPatientId && !editing && presetPatient.isPending)) return <div className="panel"><PageState title="Preparando la cita…" /></div>;
  if ((editing && appointment.isError) || (presetPatientId && !editing && presetPatient.isError)) return <div className="panel"><PageState title="No pudimos preparar la cita">Intenta nuevamente.</PageState></div>;
  const lockedPatientId = current?.patientId ?? presetPatientId;
  const lockedPatient = current?.patient ?? presetPatient.data?.patient;

  const submit = form.handleSubmit(async (values) => {
    try {
      const input = { ...values, scheduledAt: new Date(values.scheduledAt).toISOString(), notes: values.notes || null };
      if (editing) await updateAppointment(appointmentId!, { scheduledAt: input.scheduledAt, durationMinutes: input.durationMinutes, reason: input.reason, notes: input.notes });
      else await createAppointment(input);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      navigate(returnTo, { replace: true, state: editing ? { updated: true } : presetPatientId ? { appointmentCreated: true } : { created: true } });
    } catch (error) {
      form.setError('root', { message: error instanceof ApiError ? error.message : 'No fue posible guardar la cita.' });
    }
  });

  return <div className="page-stack form-page">
    <Link className="back-link" to={returnTo}><ArrowLeft size={18} /> {presetPatientId && !editing ? 'Volver al expediente' : 'Volver a la agenda'}</Link>
    <header className="page-header"><div><p className="eyebrow">{editing ? 'Reprogramar atención' : 'Agenda clínica'}</p><h1>{editing ? 'Editar cita' : 'Nueva cita'}</h1><p>{editing ? 'Actualiza el horario o los datos de la cita.' : 'Programa una atención para un paciente registrado.'}</p></div></header>
    <form onSubmit={submit} noValidate>
      <section className="panel form-section"><div className="form-section__heading"><span><CalendarDays size={21} /></span><div><h2>Datos de la cita</h2><p>Todos los horarios se muestran en tu hora local.</p></div></div>
        <div className="form-grid"><label className="field"><span>Paciente <b>*</b></span>{lockedPatientId ? <><div className="readonly-field">{lockedPatient ? `${lockedPatient.firstName} ${lockedPatient.lastName}` : 'Paciente seleccionado'}</div><input type="hidden" {...form.register('patientId')} /></> : <><input type="hidden" {...form.register('patientId')} /><PatientSearchSelect value={form.watch('patientId')} invalid={Boolean(form.formState.errors.patientId)} onChange={(patientId) => form.setValue('patientId', patientId, { shouldDirty: true, shouldValidate: true })} /></>}{form.formState.errors.patientId && <small className="field__error">{form.formState.errors.patientId.message}</small>}</label><label className="field"><span>Fecha y hora <b>*</b></span><input type="datetime-local" {...form.register('scheduledAt')} />{form.formState.errors.scheduledAt && <small className="field__error">{form.formState.errors.scheduledAt.message}</small>}</label></div>
        <div className="form-grid"><label className="field"><span>Duración en minutos <b>*</b></span><input type="number" min="5" max="480" step="5" {...form.register('durationMinutes', { valueAsNumber: true })} />{form.formState.errors.durationMinutes && <small className="field__error">{form.formState.errors.durationMinutes.message}</small>}</label><label className="field"><span>Motivo <b>*</b></span><input placeholder="Ej. Consulta de seguimiento" {...form.register('reason')} />{form.formState.errors.reason && <small className="field__error">{form.formState.errors.reason.message}</small>}</label></div>
        <label className="field"><span>Notas <em>Opcional</em></span><textarea rows={4} placeholder="Información útil antes de la consulta…" {...form.register('notes')} /></label>
      </section>
      {form.formState.errors.root && <div className="alert alert--error">{form.formState.errors.root.message}</div>}
      <footer className="form-actions"><Link className="button button--ghost" to={returnTo}>Cancelar</Link><button className="button button--primary" disabled={form.formState.isSubmitting}><Save size={18} /> {form.formState.isSubmitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Programar cita'}</button></footer>
    </form>
  </div>;
}
