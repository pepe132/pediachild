import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, SlidersHorizontal } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { formatPatientAge } from '../components/PatientAge';
import { PageState } from '../components/PageState';
import { getClinicalHistory } from '../features/clinical-histories/clinical-histories.api';
import { getConsultation } from '../features/consultations/consultations.api';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function PrescriptionPage() {
  const { consultationId = '' } = useParams();
  const consultationQuery = useQuery({ queryKey: ['consultation', consultationId], queryFn: () => getConsultation(consultationId), enabled: Boolean(consultationId), retry: false });
  const patientId = consultationQuery.data?.consultation.patientId ?? '';
  const historyQuery = useQuery({ queryKey: ['clinical-history', patientId], queryFn: () => getClinicalHistory(patientId), enabled: Boolean(patientId), retry: false });
  const [offsetX, setOffsetX] = useState(() => loadOffset('prescription-offset-x'));
  const [offsetY, setOffsetY] = useState(() => loadOffset('prescription-offset-y'));

  if (consultationQuery.isPending) return <div className="panel"><PageState title="Preparando receta…" /></div>;
  if (consultationQuery.isError) return <div className="panel"><PageState title="No pudimos preparar la receta">{consultationQuery.error instanceof ApiError ? consultationQuery.error.message : 'Intenta nuevamente.'}</PageState></div>;
  const consultation = consultationQuery.data.consultation;
  const patient = consultation.patient;
  if (!patient) return <div className="panel"><PageState title="Faltan los datos del paciente">Regresa a la consulta e intenta nuevamente.</PageState></div>;
  const allergies = historyQuery.data?.clinicalHistory?.pathologicalHistoryItems
    .find((item) => item.category === 'ALLERGY' && item.status === 'PRESENT')?.description ?? '';
  const metrics = consultation.anthropometricMeasurement;
  const vitals = consultation.vitalSigns;
  const changeOffset = (axis: 'x' | 'y', value: number) => {
    const safe = Math.max(-15, Math.min(15, Number.isFinite(value) ? value : 0));
    localStorage.setItem(`prescription-offset-${axis}`, String(safe));
    if (axis === 'x') setOffsetX(safe);
    else setOffsetY(safe);
  };

  return <div className="page-stack prescription-page">
    <Link className="back-link" to={`/consultations/${consultationId}`}><ArrowLeft size={18} /> Volver a la consulta</Link>
    <header className="page-header prescription-controls"><div><p className="eyebrow">Receta médica</p><h1>Vista previa de impresión</h1><p>Coloca la hoja preimpresa en orientación horizontal. Solamente se imprimirán los datos variables.</p></div><button className="button button--primary" onClick={() => window.print()}><Printer size={18} /> Imprimir receta</button></header>
    <section className="panel calibration-panel prescription-controls"><div><SlidersHorizontal size={20} /><div><strong>Calibración de impresora</strong><p>Si el texto queda desplazado, corrige los milímetros y vuelve a imprimir.</p></div></div><label>Horizontal (mm)<input type="number" min="-15" max="15" step="0.5" value={offsetX} onChange={(event) => changeOffset('x', Number(event.target.value))} /></label><label>Vertical (mm)<input type="number" min="-15" max="15" step="0.5" value={offsetY} onChange={(event) => changeOffset('y', Number(event.target.value))} /></label></section>
    {consultation.treatments.length === 0 && <div className="alert alert--error prescription-controls">Esta consulta no tiene tratamientos. La receta se imprimirá sin indicaciones.</div>}
    <div className="prescription-preview-wrap">
      <article className={`prescription-sheet ${consultation.treatments.length > 5 ? 'prescription-sheet--compact' : ''}`} style={{ '--offset-x': `${offsetX}mm`, '--offset-y': `${offsetY}mm` } as React.CSSProperties}>
        <span className="prescription-value prescription-patient">{patient.firstName} {patient.lastName}</span>
        <span className="prescription-value prescription-age">{formatPatientAge(consultation.patientAgeValue, consultation.patientAgeUnit)}</span>
        <span className="prescription-value prescription-date">{dateFormatter.format(new Date(consultation.consultationDate))}</span>
        <dl className="prescription-side-values">
          <div><dt>PC</dt><dd>{number(metrics?.headCircumferenceCm, 'cm')}</dd></div>
          <div><dt>FC</dt><dd>{number(vitals?.heartRateBpm, 'lpm')}</dd></div>
          <div><dt>FR</dt><dd>{number(vitals?.respiratoryRateRpm, 'rpm')}</dd></div>
          <div><dt>Temp.</dt><dd>{number(vitals?.temperatureC, '°C')}</dd></div>
          <div><dt>Peso</dt><dd>{number(metrics?.weightKg, 'kg')}</dd></div>
          <div><dt>Talla</dt><dd>{number(metrics?.lengthHeightCm, 'cm')}</dd></div>
          <div><dt>IMC</dt><dd>{number(metrics?.bmi, '')}</dd></div>
          <div><dt>Alergias</dt><dd>{allergies}</dd></div>
        </dl>
        <ol className="prescription-treatments">{consultation.treatments.map((treatment) => <li key={treatment.id}><strong>{treatment.description}{treatment.dose ? ` — ${treatment.dose}` : ''}</strong>{[treatment.route, treatment.frequency, treatment.duration].filter(Boolean).length > 0 && <span>{[treatment.route && `Vía ${treatment.route}`, treatment.frequency, treatment.duration].filter(Boolean).join(' · ')}</span>}{treatment.instructions && <span>{treatment.instructions}</span>}</li>)}</ol>
        <div className="prescription-diagnoses">{consultation.diagnoses.map((diagnosis) => diagnosis.description).join(' · ')}</div>
      </article>
    </div>
  </div>;
}

function number(value: number | null | undefined, unit: string) { return value == null ? '' : `${value}${unit ? ` ${unit}` : ''}`; }
function loadOffset(key: string) { const value = Number(localStorage.getItem(key)); return Number.isFinite(value) ? value : 0; }
