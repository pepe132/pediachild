import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Save, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../../api/client';
import type { CreatePatientInput } from './patients.api';

const patientSchema = z.object({
  firstName: z.string().trim().min(1, 'Escribe el nombre.').max(100, 'Máximo 100 caracteres.'),
  lastName: z.string().trim().min(1, 'Escribe los apellidos.').max(100, 'Máximo 100 caracteres.'),
  ageValue: z.number({ error: 'Escribe una edad válida.' }).int('La edad debe ser un número entero.').min(0, 'La edad no puede ser negativa.').max(10_000, 'La edad no es válida.'),
  ageUnit: z.enum(['DAYS', 'MONTHS', 'YEARS']),
  dateOfBirth: z.string().min(1, 'Registra la fecha para calcular las curvas.').refine((value) => !value || value <= new Date().toISOString().slice(0, 10), 'La fecha no puede estar en el futuro.'),
  sex: z.enum(['FEMALE', 'MALE']).nullable().refine(Boolean, 'Selecciona el sexo para las curvas OMS.'),
  placeOfBirth: z.string().trim().max(300, 'Máximo 300 caracteres.'),
});
type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  initialValues?: PatientFormValues;
  cancelTo: string;
  submitLabel: string;
  onSubmit: (input: CreatePatientInput) => Promise<void>;
}

export function PatientForm({ initialValues, cancelTo, submitLabel, onSubmit }: PatientFormProps) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialValues ?? { firstName: '', lastName: '', ageValue: 0, ageUnit: 'YEARS', dateOfBirth: '', sex: null, placeOfBirth: '' },
  });

  const submit = async (values: PatientFormValues) => {
    try {
      await onSubmit({ ...values, dateOfBirth: values.dateOfBirth || null, placeOfBirth: values.placeOfBirth.trim() || null });
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fields ?? {}).forEach(([field, message]) => {
          if (field in values) setError(field as keyof PatientFormValues, { message });
        });
        setError('root', { message: error.message });
        return;
      }
      setError('root', { message: 'No fue posible guardar los cambios.' });
    }
  };

  return <form onSubmit={handleSubmit(submit)} noValidate>
    <section className="panel form-section">
      <div className="form-section__heading"><span><UserRound size={21} /></span><div><h2>Datos generales</h2><p>Información para identificar al paciente.</p></div></div>
      <div className="form-grid">
        <label className="field"><span>Nombre <b aria-hidden="true">*</b></span><input autoFocus autoComplete="given-name" placeholder="Ej. Sofía" {...register('firstName')} />{errors.firstName && <small className="field__error">{errors.firstName.message}</small>}</label>
        <label className="field"><span>Apellidos <b aria-hidden="true">*</b></span><input autoComplete="family-name" placeholder="Ej. Hernández López" {...register('lastName')} />{errors.lastName && <small className="field__error">{errors.lastName.message}</small>}</label>
      </div>
    </section>
    <section className="panel form-section">
      <div className="form-section__heading"><span><CalendarDays size={21} /></span><div><h2>Edad</h2><p>Registra la edad como la proporcionó el especialista.</p></div></div>
      <div className="form-grid form-grid--three">
        <label className="field"><span>Edad <b aria-hidden="true">*</b></span><input type="number" min="0" step="1" inputMode="numeric" {...register('ageValue', { valueAsNumber: true })} />{errors.ageValue && <small className="field__error">{errors.ageValue.message}</small>}</label>
        <label className="field"><span>Unidad <b aria-hidden="true">*</b></span><select {...register('ageUnit')}><option value="DAYS">Días</option><option value="MONTHS">Meses</option><option value="YEARS">Años</option></select>{errors.ageUnit && <small className="field__error">{errors.ageUnit.message}</small>}</label>
        <label className="field"><span>Fecha de nacimiento <b aria-hidden="true">*</b></span><input type="date" max={new Date().toISOString().slice(0, 10)} {...register('dateOfBirth')} />{errors.dateOfBirth && <small className="field__error">{errors.dateOfBirth.message}</small>}</label>
        <label className="field"><span>Sexo para curvas OMS <b aria-hidden="true">*</b></span><select {...register('sex')}><option value="">Selecciona</option><option value="FEMALE">Femenino</option><option value="MALE">Masculino</option></select>{errors.sex && <small className="field__error">{errors.sex.message}</small>}</label>
      </div>
      <p className="form-note">La edad capturada se conservará aunque también registres la fecha de nacimiento.</p>
      <label className="field"><span>Lugar de nacimiento <em>Opcional</em></span><input placeholder="Ciudad y estado" {...register('placeOfBirth')} />{errors.placeOfBirth && <small className="field__error">{errors.placeOfBirth.message}</small>}</label>
    </section>
    {errors.root && <div className="alert alert--error" role="alert">{errors.root.message}</div>}
    <footer className="form-actions"><Link className="button button--ghost" to={cancelTo}>Cancelar</Link><button className="button button--primary" disabled={isSubmitting}><Save size={18} /> {isSubmitting ? 'Guardando…' : submitLabel}</button></footer>
  </form>;
}
