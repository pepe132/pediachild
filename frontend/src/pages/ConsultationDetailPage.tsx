import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Edit3, FileText, FlaskConical, HeartPulse, Image, Pill, Printer, Ruler, Stethoscope } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { formatPatientAge } from '../components/PatientAge';
import { PageState } from '../components/PageState';
import { completeConsultation, getConsultation } from '../features/consultations/consultations.api';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' });

export function ConsultationDetailPage() {
  const { consultationId = '' } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['consultation', consultationId], queryFn: () => getConsultation(consultationId), enabled: Boolean(consultationId), retry: false });
  const complete = useMutation({ mutationFn: () => completeConsultation(consultationId), onSuccess: async (result) => {
    queryClient.setQueryData(['consultation', consultationId], result);
    await queryClient.invalidateQueries({ queryKey: ['consultations', result.consultation.patientId] });
  }});

  if (query.isPending) return <div className="panel"><PageState title="Cargando consulta…" /></div>;
  if (query.isError) return <div className="panel"><PageState title="No pudimos abrir la consulta">{query.error instanceof ApiError ? query.error.message : 'Intenta nuevamente.'}</PageState></div>;
  const consultation = query.data.consultation;
  const state = location.state as { created?: boolean; updated?: boolean } | null;

  return <div className="page-stack consultation-detail">
    <Link className="back-link" to={`/patients/${consultation.patientId}`}><ArrowLeft size={18} /> Volver al expediente</Link>
    {state?.created && <div className="alert alert--success">La consulta se registró correctamente.</div>}
    {state?.updated && <div className="alert alert--success">La consulta se actualizó correctamente.</div>}
    {complete.isSuccess && <div className="alert alert--success">La consulta se marcó como completada.</div>}
    {complete.isError && <div className="alert alert--error">{complete.error instanceof ApiError ? complete.error.message : 'No fue posible completar la consulta.'}</div>}
    <header className="patient-header panel">
      <div><div className="consultation-title-row"><span className={`status-badge ${consultation.status === 'COMPLETED' ? 'status-badge--complete' : ''}`}>{consultation.status === 'COMPLETED' ? 'Completada' : 'En progreso'}</span><span>{dateFormatter.format(new Date(consultation.consultationDate))}</span></div><h1>{consultation.reason}</h1><p>{consultation.patient ? `${consultation.patient.firstName} ${consultation.patient.lastName}` : 'Consulta pediátrica'} · {formatPatientAge(consultation.patientAgeValue, consultation.patientAgeUnit)}</p></div>
      <div className="patient-header__actions"><Link className="button button--ghost" to={`/consultations/${consultation.id}/prescription`}><Printer size={17} /> Receta</Link><Link className="button button--ghost" to={`/patients/${consultation.patientId}/consultations/${consultation.id}/edit`}><Edit3 size={17} /> Editar</Link>{consultation.status === 'IN_PROGRESS' && <button className="button button--primary" disabled={complete.isPending} onClick={() => complete.mutate()}><CheckCircle2 size={18} /> {complete.isPending ? 'Completando…' : 'Completar consulta'}</button>}</div>
    </header>
    <div className="clinical-detail-grid">
      <MetricsCard icon={<HeartPulse />} title="Signos vitales" values={consultation.vitalSigns ? [
        ['Frecuencia cardiaca', formatMeasure(consultation.vitalSigns.heartRateBpm, 'lpm')],
        ['Frecuencia respiratoria', formatMeasure(consultation.vitalSigns.respiratoryRateRpm, 'rpm')],
        ['Tensión arterial', formatBloodPressure(consultation.vitalSigns.systolicPressureMmhg, consultation.vitalSigns.diastolicPressureMmhg)],
        ['Saturación', formatMeasure(consultation.vitalSigns.oxygenSaturationPercent, '%')],
        ['Temperatura', formatMeasure(consultation.vitalSigns.temperatureC, '°C')],
        ['Llenado capilar', formatMeasure(consultation.vitalSigns.capillaryRefillSeconds, 'seg')],
        ['Pulsos', consultation.vitalSigns.pulsesDescription || 'Sin registrar'],
      ] : []} />
      <MetricsCard icon={<Ruler />} title="Somatometría" values={consultation.anthropometricMeasurement ? [
        ['Peso', formatMeasure(consultation.anthropometricMeasurement.weightKg, 'kg')],
        ['Longitud/estatura', formatMeasure(consultation.anthropometricMeasurement.lengthHeightCm, 'cm')],
        ['IMC', formatMeasure(consultation.anthropometricMeasurement.bmi, '')],
        ['Perímetro cefálico', formatMeasure(consultation.anthropometricMeasurement.headCircumferenceCm, 'cm')],
        ['Tipo de medición', measurementPositionLabel(consultation.anthropometricMeasurement.measurementPosition)],
        ['P/E', formatPercentile(consultation.anthropometricMeasurement.weightForAgePercentile)],
        ['P/T', formatPercentile(consultation.anthropometricMeasurement.weightForLengthHeightPercentile)],
        ['T/E', formatPercentile(consultation.anthropometricMeasurement.lengthHeightForAgePercentile)],
        ['Diagnóstico nutricional', consultation.anthropometricMeasurement.nutritionalDiagnosis || 'Sin registrar'],
      ] : []} />
      <ClinicalCard icon={<Stethoscope />} title="Padecimiento actual" text={consultation.currentIllness} />
      <ClinicalCard icon={<Stethoscope />} title="Exploración física" text={consultation.physicalExamination} />
      <ListCard icon={<FileText />} title="Diagnósticos" empty="Sin diagnósticos registrados.">{consultation.diagnoses.map((item) => <li key={item.id}><strong>{item.description}</strong>{item.code && <small>Código: {item.code}</small>}</li>)}</ListCard>
      <ListCard icon={<Pill />} title="Tratamientos" empty="Sin tratamientos registrados.">{consultation.treatments.map((item) => <li key={item.id}><strong>{item.description}</strong><small>{[item.dose, item.route, item.frequency, item.duration].filter(Boolean).join(' · ') || 'Sin detalles de administración'}</small>{item.instructions && <p>{item.instructions}</p>}</li>)}</ListCard>
      <ClinicalCard icon={<FlaskConical />} title="Laboratorios" text={consultation.laboratoryNotes} />
      <ClinicalCard icon={<Image />} title="Imagenología" text={consultation.imagingNotes} />
      <ClinicalCard icon={<FileText />} title="Notas adicionales" text={consultation.notes} wide />
    </div>
  </div>;
}

function ClinicalCard({ icon, title, text, wide = false }: { icon: React.ReactNode; title: string; text: string | null; wide?: boolean }) {
  return <article className={`panel clinical-card ${wide ? 'clinical-card--wide' : ''}`}><header><span>{icon}</span><h2>{title}</h2></header><p>{text || 'Sin información registrada.'}</p></article>;
}
function ListCard({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode[] }) {
  return <article className="panel clinical-card"><header><span>{icon}</span><h2>{title}</h2></header>{children.length ? <ul className="clinical-list">{children}</ul> : <p>{empty}</p>}</article>;
}
function MetricsCard({ icon, title, values }: { icon: React.ReactNode; title: string; values: Array<[string, string]> }) {
  return <article className="panel clinical-card"><header><span>{icon}</span><h2>{title}</h2></header>{values.length ? <dl className="measurement-list">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p>Sin información registrada.</p>}</article>;
}
function formatMeasure(value: number | null, unit: string) { return value === null ? 'Sin registrar' : `${value} ${unit}`; }
function formatBloodPressure(systolic: number | null, diastolic: number | null) { return systolic === null && diastolic === null ? 'Sin registrar' : `${systolic ?? '—'}/${diastolic ?? '—'} mmHg`; }
function formatPercentile(value: number | null) { return value === null ? 'Sin registrar' : `Percentil ${value}`; }
function measurementPositionLabel(value: 'RECUMBENT_LENGTH' | 'STANDING_HEIGHT' | null) { return value === 'RECUMBENT_LENGTH' ? 'Longitud acostado' : value === 'STANDING_HEIGHT' ? 'Estatura de pie' : 'Sin registrar'; }
