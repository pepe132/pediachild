import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowLeft, ClipboardPlus, FileText, HeartPulse, Plus, Ruler, Save, Stethoscope, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../api/client';
import { PageState } from '../components/PageState';
import { createConsultation, getConsultation, updateConsultation } from '../features/consultations/consultations.api';
import { getPatient } from '../features/patients/patients.api';

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max.toLocaleString('es-MX')} caracteres.`);
const optionalNumber = (min: number, max: number) => z.number().min(min).max(max).nullable();
const optionalInteger = (min: number, max: number) => z.number().int().min(min).max(max).nullable();
const percentile = z.union([z.literal(3), z.literal(15), z.literal(50), z.literal(85), z.literal(97)]).nullable();
const schema = z.object({
  consultationDate: z.string().min(1, 'Selecciona la fecha y hora.'),
  patientAgeValue: z.number({ error: 'Escribe una edad válida.' }).int().min(0).max(10_000),
  patientAgeUnit: z.enum(['DAYS', 'MONTHS', 'YEARS']),
  reason: z.string().trim().min(1, 'Escribe el motivo de consulta.').max(500),
  currentIllness: optionalText(10_000), physicalExamination: optionalText(10_000), notes: optionalText(10_000), laboratoryNotes: optionalText(10_000), imagingNotes: optionalText(10_000),
  diagnoses: z.array(z.object({ description: z.string().max(1_000), code: z.string().max(50) })).max(50),
  treatments: z.array(z.object({ description: z.string().max(500), dose: z.string().max(200), route: z.string().max(100), frequency: z.string().max(200), duration: z.string().max(200), instructions: z.string().max(5_000) })).max(50),
  vitalSigns: z.object({
    heartRateBpm: optionalInteger(0, 400), respiratoryRateRpm: optionalInteger(0, 200), systolicPressureMmhg: optionalInteger(0, 400), diastolicPressureMmhg: optionalInteger(0, 300), oxygenSaturationPercent: optionalInteger(0, 100), temperatureC: optionalNumber(20, 50), pulsesDescription: z.string().max(1_000), capillaryRefillSeconds: optionalNumber(0, 60),
  }),
  anthropometricMeasurement: z.object({
    weightKg: optionalNumber(0, 500), lengthHeightCm: optionalNumber(0, 300), headCircumferenceCm: optionalNumber(0, 100), measurementPosition: z.enum(['RECUMBENT_LENGTH', 'STANDING_HEIGHT']).nullable(), weightForAgePercentile: percentile, weightForLengthHeightPercentile: percentile, lengthHeightForAgePercentile: percentile, nutritionalDiagnosis: z.string().max(2_000),
  }),
}).superRefine((values, context) => {
  if (values.anthropometricMeasurement.lengthHeightCm !== null && values.anthropometricMeasurement.measurementPosition === null) {
    context.addIssue({ code: 'custom', message: 'Selecciona el tipo de medición.', path: ['anthropometricMeasurement', 'measurementPosition'] });
  }
});
type FormValues = z.infer<typeof schema>;

const localDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};
const nullable = (value: string) => value.trim() || null;

export function NewConsultationPage() {
  const { patientId = '', consultationId } = useParams();
  const isEditing = Boolean(consultationId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patient = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId), enabled: Boolean(patientId), retry: false });
  const consultation = useQuery({ queryKey: ['consultation', consultationId], queryFn: () => getConsultation(consultationId!), enabled: isEditing, retry: false });
  const source = consultation.data?.consultation;
  const form = useForm<FormValues>({ resolver: zodResolver(schema), values: patient.data && (!isEditing || source) ? {
    consultationDate: source ? toLocalInput(source.consultationDate) : localDateTime(), patientAgeValue: source?.patientAgeValue ?? patient.data.patient.ageValue, patientAgeUnit: source?.patientAgeUnit ?? patient.data.patient.ageUnit, reason: source?.reason ?? '', currentIllness: source?.currentIllness ?? '', physicalExamination: source?.physicalExamination ?? '', notes: source?.notes ?? '', laboratoryNotes: source?.laboratoryNotes ?? '', imagingNotes: source?.imagingNotes ?? '', diagnoses: source?.diagnoses.map(({ description, code }) => ({ description, code: code ?? '' })) ?? [{ description: '', code: '' }], treatments: source?.treatments.map(({ description, dose, route, frequency, duration, instructions }) => ({ description, dose: dose ?? '', route: route ?? '', frequency: frequency ?? '', duration: duration ?? '', instructions: instructions ?? '' })) ?? [{ description: '', dose: '', route: '', frequency: '', duration: '', instructions: '' }],
    vitalSigns: { heartRateBpm: source?.vitalSigns?.heartRateBpm ?? null, respiratoryRateRpm: source?.vitalSigns?.respiratoryRateRpm ?? null, systolicPressureMmhg: source?.vitalSigns?.systolicPressureMmhg ?? null, diastolicPressureMmhg: source?.vitalSigns?.diastolicPressureMmhg ?? null, oxygenSaturationPercent: source?.vitalSigns?.oxygenSaturationPercent ?? null, temperatureC: source?.vitalSigns?.temperatureC ?? null, pulsesDescription: source?.vitalSigns?.pulsesDescription ?? '', capillaryRefillSeconds: source?.vitalSigns?.capillaryRefillSeconds ?? null },
    anthropometricMeasurement: { weightKg: source?.anthropometricMeasurement?.weightKg ?? null, lengthHeightCm: source?.anthropometricMeasurement?.lengthHeightCm ?? null, headCircumferenceCm: source?.anthropometricMeasurement?.headCircumferenceCm ?? null, measurementPosition: source?.anthropometricMeasurement?.measurementPosition ?? null, weightForAgePercentile: asPercentile(source?.anthropometricMeasurement?.weightForAgePercentile), weightForLengthHeightPercentile: asPercentile(source?.anthropometricMeasurement?.weightForLengthHeightPercentile), lengthHeightForAgePercentile: asPercentile(source?.anthropometricMeasurement?.lengthHeightForAgePercentile), nutritionalDiagnosis: source?.anthropometricMeasurement?.nutritionalDiagnosis ?? '' },
  } : undefined });
  const diagnoses = useFieldArray({ control: form.control, name: 'diagnoses' });
  const treatments = useFieldArray({ control: form.control, name: 'treatments' });
  const currentWeight = form.watch('anthropometricMeasurement.weightKg');
  const currentHeight = form.watch('anthropometricMeasurement.lengthHeightCm');
  const calculatedBmi = calculateBmi(currentWeight, currentHeight);

  if (patient.isPending || (isEditing && consultation.isPending)) return <div className="panel"><PageState title="Preparando consulta…" /></div>;
  if (patient.isError || (isEditing && consultation.isError)) return <div className="panel"><PageState title="No pudimos cargar la consulta">Intenta nuevamente.</PageState></div>;
  const record = patient.data.patient;

  const submit = form.handleSubmit(async (values) => {
    try {
      const input = {
        ...values,
        consultationDate: new Date(values.consultationDate).toISOString(),
        currentIllness: nullable(values.currentIllness), physicalExamination: nullable(values.physicalExamination), notes: nullable(values.notes), laboratoryNotes: nullable(values.laboratoryNotes), imagingNotes: nullable(values.imagingNotes),
        diagnoses: values.diagnoses.filter((item) => item.description.trim()).map((item) => ({ description: item.description.trim(), code: nullable(item.code) })),
        treatments: values.treatments.filter((item) => item.description.trim()).map((item) => ({ description: item.description.trim(), dose: nullable(item.dose), route: nullable(item.route), frequency: nullable(item.frequency), duration: nullable(item.duration), instructions: nullable(item.instructions) })),
        vitalSigns: hasValue(values.vitalSigns) ? { ...values.vitalSigns, pulsesDescription: nullable(values.vitalSigns.pulsesDescription) } : null,
        anthropometricMeasurement: hasValue(values.anthropometricMeasurement) ? { ...values.anthropometricMeasurement, nutritionalDiagnosis: nullable(values.anthropometricMeasurement.nutritionalDiagnosis) } : null,
      };
      const result = isEditing ? await updateConsultation(consultationId!, input) : await createConsultation(patientId, input);
      await queryClient.invalidateQueries({ queryKey: ['consultations', patientId] });
      queryClient.setQueryData(['consultation', result.consultation.id], result);
      navigate(`/consultations/${result.consultation.id}`, { replace: true, state: { [isEditing ? 'updated' : 'created']: true } });
    } catch (error) {
      form.setError('root', { message: error instanceof ApiError ? error.message : 'No fue posible guardar la consulta.' });
    }
  });

  return <div className="page-stack consultation-page">
    <Link className="back-link" to={isEditing ? `/consultations/${consultationId}` : `/patients/${patientId}`}><ArrowLeft size={18} /> {isEditing ? 'Volver a la consulta' : 'Volver al expediente'}</Link>
    <header className="page-header"><div><p className="eyebrow">{isEditing ? 'Editar consulta' : 'Nueva consulta'}</p><h1>{record.firstName} {record.lastName}</h1><p>{isEditing ? 'Actualiza la información registrada en esta atención.' : 'Registra la atención clínica. Podrás editarla y completarla después.'}</p></div></header>
    <form onSubmit={submit} className="clinical-form" noValidate>
      <FormSection icon={<Activity />} title="Información de la consulta" subtitle="Fecha, edad y motivo de atención.">
        <div className="form-grid form-grid--three"><Field label="Fecha y hora" error={form.formState.errors.consultationDate?.message}><input type="datetime-local" {...form.register('consultationDate')} /></Field><Field label="Edad" error={form.formState.errors.patientAgeValue?.message}><input type="number" min="0" step="1" {...form.register('patientAgeValue', { valueAsNumber: true })} /></Field><Field label="Unidad"><select {...form.register('patientAgeUnit')}><option value="DAYS">Días</option><option value="MONTHS">Meses</option><option value="YEARS">Años</option></select></Field></div>
        <Field label="Motivo de consulta" error={form.formState.errors.reason?.message}><input placeholder="Describe brevemente el motivo principal" {...form.register('reason')} /></Field>
      </FormSection>
      <FormSection icon={<HeartPulse />} title="Signos vitales" subtitle="Todos los campos son opcionales y muestran su unidad.">
        <div className="clinical-measure-grid">
          <MeasureField label="Frecuencia cardiaca" unit="lpm"><input type="number" min="0" max="400" {...form.register('vitalSigns.heartRateBpm', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Frecuencia respiratoria" unit="rpm"><input type="number" min="0" max="200" {...form.register('vitalSigns.respiratoryRateRpm', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Presión sistólica" unit="mmHg"><input type="number" min="0" max="400" {...form.register('vitalSigns.systolicPressureMmhg', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Presión diastólica" unit="mmHg"><input type="number" min="0" max="300" {...form.register('vitalSigns.diastolicPressureMmhg', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Saturación de oxígeno" unit="%"><input type="number" min="0" max="100" {...form.register('vitalSigns.oxygenSaturationPercent', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Temperatura" unit="°C"><input type="number" min="20" max="50" step="0.1" {...form.register('vitalSigns.temperatureC', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Llenado capilar" unit="seg"><input type="number" min="0" max="60" step="0.1" {...form.register('vitalSigns.capillaryRefillSeconds', { setValueAs: toOptionalNumber })} /></MeasureField>
          <Field label="Pulsos"><input placeholder="Descripción libre" {...form.register('vitalSigns.pulsesDescription')} /></Field>
        </div>
      </FormSection>
      <FormSection icon={<Ruler />} title="Somatometría" subtitle="Las curvas y percentiles OMS se calculan automáticamente con estas mediciones.">
        <div className="clinical-measure-grid">
          <MeasureField label="Peso" unit="kg"><input type="number" min="0" max="500" step="0.001" {...form.register('anthropometricMeasurement.weightKg', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Longitud o estatura" unit="cm" error={form.formState.errors.anthropometricMeasurement?.lengthHeightCm?.message}><input type="number" min="0" max="300" step="0.01" {...form.register('anthropometricMeasurement.lengthHeightCm', { setValueAs: toOptionalNumber })} /></MeasureField>
          <MeasureField label="Perímetro cefálico" unit="cm"><input type="number" min="0" max="100" step="0.01" {...form.register('anthropometricMeasurement.headCircumferenceCm', { setValueAs: toOptionalNumber })} /></MeasureField>
          <Field label="IMC calculado"><div className="readonly-field">{calculatedBmi === null ? 'Se calcula con peso y talla' : calculatedBmi.toFixed(2)}</div></Field>
          <Field label="Tipo de medición" error={form.formState.errors.anthropometricMeasurement?.measurementPosition?.message}><select {...form.register('anthropometricMeasurement.measurementPosition', { setValueAs: (value) => value || null })}><option value="">Selecciona</option><option value="RECUMBENT_LENGTH">Longitud acostado</option><option value="STANDING_HEIGHT">Estatura de pie</option></select></Field>
        </div>
        <Field label="Diagnóstico nutricional"><textarea rows={3} placeholder="Descripción libre" {...form.register('anthropometricMeasurement.nutritionalDiagnosis')} /></Field>
      </FormSection>
      <FormSection icon={<Stethoscope />} title="Evaluación clínica" subtitle="Campos narrativos de la atención.">
        <Field label="Padecimiento actual"><textarea rows={5} placeholder="Evolución, características y síntomas relevantes…" {...form.register('currentIllness')} /></Field>
        <Field label="Exploración física"><textarea rows={6} placeholder="Hallazgos de la exploración…" {...form.register('physicalExamination')} /></Field>
        <div className="form-grid"><Field label="Laboratorios"><textarea rows={4} placeholder="Resultados o comentarios…" {...form.register('laboratoryNotes')} /></Field><Field label="Imagenología"><textarea rows={4} placeholder="Hallazgos o comentarios…" {...form.register('imagingNotes')} /></Field></div>
      </FormSection>
      <FormSection icon={<ClipboardPlus />} title="Diagnósticos" subtitle="Agrega únicamente los diagnósticos correspondientes a esta consulta." action={<button type="button" className="button button--ghost" onClick={() => diagnoses.append({ description: '', code: '' })}><Plus size={17} /> Agregar</button>}>
        <div className="dynamic-list">{diagnoses.fields.map((item, index) => <div className="dynamic-row" key={item.id}><Field label={`Diagnóstico ${index + 1}`}><input placeholder="Descripción" {...form.register(`diagnoses.${index}.description`)} /></Field><Field label="Código opcional"><input placeholder="Ej. CIE-10" {...form.register(`diagnoses.${index}.code`)} /></Field><button type="button" className="icon-button icon-button--danger" onClick={() => diagnoses.remove(index)} aria-label={`Eliminar diagnóstico ${index + 1}`}><Trash2 size={18} /></button></div>)}</div>
      </FormSection>
      <FormSection icon={<FileText />} title="Tratamientos" subtitle="Indicaciones libres y datos opcionales de administración." action={<button type="button" className="button button--ghost" onClick={() => treatments.append({ description: '', dose: '', route: '', frequency: '', duration: '', instructions: '' })}><Plus size={17} /> Agregar</button>}>
        <div className="dynamic-list">{treatments.fields.map((item, index) => <div className="treatment-card" key={item.id}><div className="treatment-card__header"><strong>Tratamiento {index + 1}</strong><button type="button" className="icon-button icon-button--danger" onClick={() => treatments.remove(index)} aria-label={`Eliminar tratamiento ${index + 1}`}><Trash2 size={18} /></button></div><Field label="Descripción"><input placeholder="Medicamento o indicación" {...form.register(`treatments.${index}.description`)} /></Field><div className="form-grid form-grid--four"><Field label="Dosis"><input {...form.register(`treatments.${index}.dose`)} /></Field><Field label="Vía"><input {...form.register(`treatments.${index}.route`)} /></Field><Field label="Frecuencia"><input {...form.register(`treatments.${index}.frequency`)} /></Field><Field label="Duración"><input {...form.register(`treatments.${index}.duration`)} /></Field></div><Field label="Indicaciones"><textarea rows={2} {...form.register(`treatments.${index}.instructions`)} /></Field></div>)}</div>
      </FormSection>
      <FormSection icon={<FileText />} title="Notas adicionales" subtitle="Información complementaria de esta consulta."><Field label="Notas"><textarea rows={4} {...form.register('notes')} /></Field></FormSection>
      {form.formState.errors.root && <div className="alert alert--error" role="alert">{form.formState.errors.root.message}</div>}
      <footer className="form-actions"><Link className="button button--ghost" to={isEditing ? `/consultations/${consultationId}` : `/patients/${patientId}`}>Cancelar</Link><button className="button button--primary" disabled={form.formState.isSubmitting}><Save size={18} /> {form.formState.isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar consulta'}</button></footer>
    </form>
  </div>;
}

function toLocalInput(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toOptionalNumber(value: unknown) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}

function hasValue(value: Record<string, unknown>) {
  return Object.values(value).some((item) => item !== null && item !== undefined && item !== '');
}

function asPercentile(value?: number | null): 3 | 15 | 50 | 85 | 97 | null {
  return value === 3 || value === 15 || value === 50 || value === 85 || value === 97 ? value : null;
}

function calculateBmi(weightKg: number | null, heightCm: number | null) {
  if (weightKg == null || heightCm == null || heightCm <= 0) return null;
  const heightMeters = heightCm / 100;
  return Math.round((weightKg / (heightMeters * heightMeters)) * 100) / 100;
}

function FormSection({ icon, title, subtitle, action, children }: { icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel form-section"><div className="form-section__heading"><span>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <div className="form-section__action">{action}</div>}</div>{children}</section>;
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{error && <small className="field__error">{error}</small>}</label>;
}
function MeasureField({ label, unit, error, children }: { label: string; unit: string; error?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span><div className="measure-input">{children}<span>{unit}</span></div>{error && <small className="field__error">{error}</small>}</label>;
}
