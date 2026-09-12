import { useEffect } from 'react';
import { useForm, type Path, type UseFormRegister } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Baby, BookOpen, HeartPulse, Home, Save, ShieldCheck, UsersRound, Utensils } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { PageState } from '../components/PageState';
import { getClinicalHistory, saveClinicalHistory } from '../features/clinical-histories/clinical-histories.api';
import { getPatient } from '../features/patients/patients.api';
import type { ClinicalHistoryInput, ClinicalPresenceStatus, FoodType, PathologicalCategory } from '../types/clinical-history';

const foodOptions: { value: FoodType; label: string }[] = [
  ['RED_MEAT', 'Carne roja'], ['CHICKEN', 'Pollo'], ['EGG', 'Huevo'], ['MILK', 'Leche'], ['FISH', 'Pescado'], ['CEREALS', 'Cereales'],
  ['TORTILLA', 'Tortilla'], ['LEGUMES', 'Leguminosas'], ['VEGETABLES', 'Verduras'], ['FRUITS', 'Frutas'], ['SODA', 'Refresco'], ['BREAD', 'Pan'],
].map(([value, label]) => ({ value: value as FoodType, label }));
const pathologicalOptions: { value: PathologicalCategory; label: string }[] = [
  { value: 'ALLERGY', label: 'Alergias' }, { value: 'SURGERY', label: 'Cirugías' }, { value: 'TRAUMA', label: 'Traumatismos' },
  { value: 'EXANTHEMATIC_DISEASE', label: 'Enfermedades exantemáticas' }, { value: 'HOSPITALIZATION', label: 'Hospitalizaciones' },
];

export function ClinicalHistoryPage() {
  const { patientId = '' } = useParams();
  const queryClient = useQueryClient();
  const patient = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId), enabled: Boolean(patientId), retry: false });
  const history = useQuery({ queryKey: ['clinical-history', patientId], queryFn: () => getClinicalHistory(patientId), enabled: Boolean(patientId), retry: false });
  const form = useForm<ClinicalHistoryInput>({ defaultValues: emptyHistory() });
  useEffect(() => { if (history.data) form.reset(normalizeHistory(history.data.clinicalHistory)); }, [history.data, form]);
  const mutation = useMutation({
    mutationFn: (input: ClinicalHistoryInput) => saveClinicalHistory(patientId, input),
    onSuccess: async (result) => { form.reset(normalizeHistory(result.clinicalHistory)); queryClient.setQueryData(['clinical-history', patientId], result); await queryClient.invalidateQueries({ queryKey: ['patient', patientId] }); },
  });
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root');
    if (values.immunizationStatus === 'INCOMPLETE' && !values.missingVaccines.trim()) { form.setError('missingVaccines', { message: 'Indica qué vacunas faltan.' }); return; }
    const incomplete = values.pathologicalHistoryItems.findIndex((item) => item.status === 'PRESENT' && !item.description.trim());
    if (incomplete >= 0) { form.setError(`pathologicalHistoryItems.${incomplete}.description`, { message: 'Describe este antecedente.' }); return; }
    try { await mutation.mutateAsync(values); } catch (error) { form.setError('root', { message: error instanceof ApiError ? error.message : 'No fue posible guardar la historia clínica.' }); }
  });

  if (patient.isPending || history.isPending) return <div className="panel"><PageState title="Preparando historia clínica…" /></div>;
  if (patient.isError || history.isError) return <div className="panel"><PageState title="No pudimos abrir la historia clínica">{(patient.error ?? history.error) instanceof ApiError ? (patient.error ?? history.error as ApiError).message : 'Intenta nuevamente.'}</PageState></div>;
  const record = patient.data.patient;
  const errors = form.formState.errors;
  return <div className="page-stack consultation-page clinical-history-page">
    <Link className="back-link" to={`/patients/${patientId}`}><ArrowLeft size={18} /> Volver al expediente</Link>
    <header className="page-header"><div><p className="eyebrow">Historia clínica pediátrica</p><h1>{record.firstName} {record.lastName}</h1><p>{history.data.clinicalHistory ? 'Actualiza los antecedentes permanentes del paciente.' : 'Captura los antecedentes permanentes del paciente.'}</p></div></header>
    {mutation.isSuccess && !form.formState.isDirty && <div className="alert alert--success" role="status">La historia clínica se guardó correctamente.</div>}
    <form className="clinical-form" onSubmit={submit}>
      <Section icon={<BookOpen />} title="Informante y desarrollo" subtitle="Persona que proporciona los datos y desarrollo del paciente.">
        <div className="form-grid"><Field label="Nombre del informante"><input {...form.register('informantName')} /></Field><Field label="Parentesco"><input placeholder="Ej. madre, padre o tutor" {...form.register('informantRelationship')} /></Field></div>
        <div className="form-grid form-grid--three"><Field label="Hitos del desarrollo"><textarea rows={4} {...form.register('neurodevelopmentNotes')} /></Field><Field label="Resultado de prueba EDI"><textarea rows={4} {...form.register('ediResultNotes')} /></Field><Field label="Escolaridad y desempeño"><textarea rows={4} {...form.register('schoolingNotes')} /></Field></div>
      </Section>
      <Section icon={<UsersRound />} title="Antecedentes heredofamiliares" subtitle="Datos de madre, padre, hermanos y abuelos.">
        {(['Madre', 'Padre'] as const).map((label, index) => <div className="history-subsection" key={label}><h3>{label}</h3><div className="form-grid form-grid--four"><Field label="Edad"><NumberInput register={form.register} name={`familyMembers.${index}.age`} min={0} max={130} /></Field><Field label="Origen"><input {...form.register(`familyMembers.${index}.origin`)} /></Field><Field label="Residencia"><input {...form.register(`familyMembers.${index}.residence`)} /></Field><Field label="Grupo sanguíneo"><input {...form.register(`familyMembers.${index}.bloodType`)} /></Field></div><div className="form-grid form-grid--four"><Field label="Escolaridad"><input {...form.register(`familyMembers.${index}.schooling`)} /></Field><Field label="Idioma"><input {...form.register(`familyMembers.${index}.language`)} /></Field><Field label="Ocupación"><input {...form.register(`familyMembers.${index}.occupation`)} /></Field><Field label="Religión"><input {...form.register(`familyMembers.${index}.religion`)} /></Field></div><div className="form-grid form-grid--three"><Field label="Comorbilidades"><textarea rows={3} {...form.register(`familyMembers.${index}.comorbidities`)} /></Field><Field label="Toxicomanías"><textarea rows={3} {...form.register(`familyMembers.${index}.substanceUse`)} /></Field><Field label="Tatuajes o perforaciones"><textarea rows={3} {...form.register(`familyMembers.${index}.tattoosPiercings`)} /></Field></div></div>)}
        <div className="form-grid"><Field label="Hermanos"><textarea rows={3} {...form.register('siblingsHistory')} /></Field><Field label="Abuelos"><textarea rows={3} {...form.register('grandparentsHistory')} /></Field></div>
      </Section>
      <Section icon={<Home />} title="Antecedentes no patológicos" subtitle="Entorno, vivienda, higiene y hábitos fisiológicos.">
        <p className="form-note">El lugar de nacimiento del niño se registra en sus datos generales.</p>
        <div className="form-grid form-grid--three"><Field label="Vivienda"><textarea rows={3} {...form.register('nonPathologicalHistory.housingNotes')} /></Field><Field label="Servicios"><textarea rows={3} {...form.register('nonPathologicalHistory.servicesNotes')} /></Field><Field label="Agua"><textarea rows={3} {...form.register('nonPathologicalHistory.waterNotes')} /></Field></div>
        <div className="form-grid"><Field label="Baño / sanitario"><textarea rows={3} {...form.register('nonPathologicalHistory.bathroomNotes')} /></Field><Field label="Combustible para cocinar"><textarea rows={3} {...form.register('nonPathologicalHistory.cookingFuelNotes')} /></Field></div>
        <div className="form-grid form-grid--three"><Field label="Habitantes y habitaciones"><textarea rows={3} {...form.register('nonPathologicalHistory.cohabitantsNotes')} /></Field><Field label="Animales"><textarea rows={3} {...form.register('nonPathologicalHistory.animalContactNotes')} /></Field><Field label="Biomasa / combustible"><textarea rows={3} {...form.register('nonPathologicalHistory.biomassExposureNotes')} /></Field></div>
        <div className="form-grid form-grid--four"><Field label="Cepillados al día"><NumberInput register={form.register} name="nonPathologicalHistory.toothBrushingsPerDay" min={0} max={20} /></Field><Field label="Evacuaciones al día"><NumberInput register={form.register} name="nonPathologicalHistory.bowelMovementsPerDay" min={0} max={50} step="0.1" /></Field><Field label="Bristol (1–7)" error={errors.nonPathologicalHistory?.bristolType?.message}><NumberInput register={form.register} name="nonPathologicalHistory.bristolType" min={1} max={7} /></Field><Field label="Micciones"><input {...form.register('nonPathologicalHistory.urinationNotes')} /></Field></div>
        <div className="form-grid form-grid--three"><Field label="Frecuencia de baño"><textarea rows={3} {...form.register('nonPathologicalHistory.bathingNotes')} /></Field><Field label="Cambio de ropa"><textarea rows={3} {...form.register('nonPathologicalHistory.clothingChangeNotes')} /></Field><Field label="Otras observaciones"><textarea rows={3} {...form.register('nonPathologicalHistory.roomNotes')} /></Field></div>
      </Section>
      <Section icon={<Utensils />} title="Nutrición" subtitle="Lactancia, alimentación y frecuencia semanal.">
        <div className="form-grid"><Field label="Lactancia materna exclusiva"><textarea rows={3} {...form.register('nutritionHistory.exclusiveBreastfeedingNotes')} /></Field><Field label="Alimentación complementaria"><textarea rows={3} {...form.register('nutritionHistory.complementaryFeedingNotes')} /></Field></div>
        <div className="form-grid"><Field label="Dieta familiar"><textarea rows={3} {...form.register('nutritionHistory.familyDietNotes')} /></Field><Field label="Recordatorio de 24 horas"><textarea rows={3} {...form.register('nutritionHistory.twentyFourHourRecall')} /></Field></div>
        <Field label="Comidas al día"><NumberInput register={form.register} name="nutritionHistory.mealsPerDay" min={0} max={20} /></Field>
        <div className="food-frequency-grid">{foodOptions.map((food, index) => <Field label={`${food.label} (días/semana)`} key={food.value}><NumberInput register={form.register} name={`foodFrequencies.${index}.daysPerWeek`} min={0} max={7} /></Field>)}</div>
      </Section>
      <Section icon={<Baby />} title="Antecedentes perinatales" subtitle="Embarazo, nacimiento, APGAR y tamizajes.">
        <div className="form-grid form-grid--four"><Field label="Edad materna"><NumberInput register={form.register} name="perinatalHistory.maternalAgeAtPregnancy" min={0} max={70} /></Field><Field label="Gestas"><NumberInput register={form.register} name="perinatalHistory.pregnancies" min={0} max={30} /></Field><Field label="Partos"><NumberInput register={form.register} name="perinatalHistory.births" min={0} max={30} /></Field><Field label="Cesáreas"><NumberInput register={form.register} name="perinatalHistory.cesareans" min={0} max={30} /></Field></div>
        <div className="form-grid form-grid--four"><Field label="Abortos"><NumberInput register={form.register} name="perinatalHistory.abortions" min={0} max={30} /></Field><Field label="Número de embarazo"><NumberInput register={form.register} name="perinatalHistory.pregnancyNumber" min={1} max={30} /></Field><Field label="Consultas prenatales"><NumberInput register={form.register} name="perinatalHistory.prenatalVisits" min={0} max={100} /></Field><Field label="APGAR"><input placeholder="Ej. 8/9" {...form.register('perinatalHistory.apgar')} /></Field></div>
        <div className="form-grid form-grid--three"><Field label="Capurro (semanas)"><NumberInput register={form.register} name="perinatalHistory.gestationalAgeWeeks" min={15} max={50} /></Field><Field label="Días adicionales"><NumberInput register={form.register} name="perinatalHistory.gestationalAgeDays" min={0} max={6} /></Field><Field label="Vía de nacimiento"><select {...form.register('perinatalHistory.birthRoute')}><option value="">No registrada</option><option value="VAGINAL">Vaginal</option><option value="ABDOMINAL_CESAREAN">Abdominal (cesárea)</option></select></Field></div>
        <div className="form-grid form-grid--three"><Field label="Lugar de nacimiento"><input {...form.register('perinatalHistory.birthPlace')} /></Field><Field label="Peso al nacer (g)"><NumberInput register={form.register} name="perinatalHistory.birthWeightGrams" min={100} max={10000} /></Field><Field label="Talla al nacer (cm)"><NumberInput register={form.register} name="perinatalHistory.birthLengthCm" min={10} max={100} step="0.01" /></Field></div>
        <div className="form-grid form-grid--three"><TriState label="Embarazo planeado" register={form.register} name="perinatalHistory.pregnancyPlanned" /><TriState label="Embarazo deseado" register={form.register} name="perinatalHistory.pregnancyDesired" /><TriState label="Lloró y respiró al nacer" register={form.register} name="perinatalHistory.criedAndBreathedAtBirth" /></div>
        <div className="form-grid"><Field label="Notas del embarazo"><textarea rows={4} {...form.register('perinatalHistory.pregnancyNotes')} /></Field><Field label="Consultas y ultrasonidos"><textarea rows={4} {...form.register('perinatalHistory.ultrasoundNotes')} /></Field></div>
        <div className="form-grid"><Field label="Vacunas maternas"><textarea rows={4} {...form.register('perinatalHistory.maternalVaccinesNotes')} /></Field><Field label="Enfermedades maternas"><textarea rows={4} {...form.register('perinatalHistory.maternalConditionsNotes')} /></Field></div>
        <div className="screening-grid"><Field label="Tamiz metabólico"><textarea rows={3} {...form.register('perinatalHistory.metabolicScreeningNotes')} /></Field><Field label="Tamiz auditivo"><textarea rows={3} {...form.register('perinatalHistory.hearingScreeningNotes')} /></Field><Field label="Tamiz cardiaco"><textarea rows={3} {...form.register('perinatalHistory.cardiacScreeningNotes')} /></Field><Field label="Tamiz oftalmológico"><textarea rows={3} {...form.register('perinatalHistory.ophthalmologicalScreeningNotes')} /></Field><Field label="Tamiz de cadera"><textarea rows={3} {...form.register('perinatalHistory.hipScreeningNotes')} /></Field></div>
        <Field label="Hospitalización perinatal"><textarea rows={3} {...form.register('perinatalHistory.perinatalHospitalizationNotes')} /></Field>
      </Section>
      <Section icon={<ShieldCheck />} title="Vacunación" subtitle="Estado general del esquema y vacunas pendientes.">
        <div className="form-grid form-grid--three"><Field label="Estado"><select {...form.register('immunizationStatus')}><option value="UNKNOWN">No registrado</option><option value="COMPLETE">Completo</option><option value="INCOMPLETE">Incompleto</option></select></Field><Field label="Vacunas faltantes" error={errors.missingVaccines?.message}><input disabled={form.watch('immunizationStatus') !== 'INCOMPLETE'} {...form.register('missingVaccines')} /></Field><Field label="Observaciones"><input {...form.register('immunizationNotes')} /></Field></div>
      </Section>
      <Section icon={<HeartPulse />} title="Antecedentes patológicos" subtitle="Selecciona el estado y describe únicamente cuando esté presente.">
        <div className="pathological-grid">{pathologicalOptions.map((item, index) => <div className="pathological-card" key={item.value}><strong>{item.label}</strong><select {...form.register(`pathologicalHistoryItems.${index}.status`)}><option value="UNKNOWN">No registrado</option><option value="DENIED">Negado</option><option value="PRESENT">Presente</option></select><textarea rows={3} placeholder="Descripción" {...form.register(`pathologicalHistoryItems.${index}.description`)} />{errors.pathologicalHistoryItems?.[index]?.description && <small className="field__error">{errors.pathologicalHistoryItems[index]?.description?.message}</small>}</div>)}</div>
      </Section>
      {errors.root && <div className="alert alert--error" role="alert">{errors.root.message}</div>}
      <footer className="form-actions"><Link className="button button--ghost" to={`/patients/${patientId}`}>Cancelar</Link><button className="button button--primary" disabled={mutation.isPending}><Save size={18} /> {mutation.isPending ? 'Guardando…' : 'Guardar historia clínica'}</button></footer>
    </form>
  </div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}{error && <small className="field__error">{error}</small>}</label>; }
function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) { return <section className="panel form-section"><div className="form-section__heading"><span>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</section>; }
function NumberInput({ register, name, min, max, step = '1' }: { register: UseFormRegister<ClinicalHistoryInput>; name: Path<ClinicalHistoryInput>; min: number; max: number; step?: string }) { return <input type="number" min={min} max={max} step={step} {...register(name, { setValueAs: optionalNumber })} />; }
function TriState({ label, register, name }: { label: string; register: UseFormRegister<ClinicalHistoryInput>; name: Path<ClinicalHistoryInput> }) { return <Field label={label}><select {...register(name, { setValueAs: (value) => value === '' ? null : value === 'true' })}><option value="">No registrado</option><option value="true">Sí</option><option value="false">No</option></select></Field>; }
function optionalNumber(value: unknown) { return value === '' || value === null || value === undefined ? null : Number(value); }

function emptyHistory(): ClinicalHistoryInput {
  const blankParent = (relationship: 'MOTHER' | 'FATHER') => ({ relationship, age: null, origin: '', residence: '', schooling: '', language: '', occupation: '', religion: '', substanceUse: '', tattoosPiercings: '', comorbidities: '', bloodType: '' });
  return {
    informantName: '', informantRelationship: '', siblingsHistory: '', grandparentsHistory: '', neurodevelopmentNotes: '', ediResultNotes: '', schoolingNotes: '', immunizationStatus: 'UNKNOWN', missingVaccines: '', immunizationNotes: '',
    familyMembers: [blankParent('MOTHER'), blankParent('FATHER')],
    nonPathologicalHistory: { origin: '', residence: '', housingNotes: '', servicesNotes: '', cookingFuelNotes: '', waterNotes: '', bathroomNotes: '', cohabitantsNotes: '', roomNotes: '', animalContactNotes: '', biomassExposureNotes: '', bathingNotes: '', clothingChangeNotes: '', toothBrushingsPerDay: null, urinationNotes: '', bowelMovementsPerDay: null, bristolType: null },
    nutritionHistory: { exclusiveBreastfeedingNotes: '', complementaryFeedingNotes: '', familyDietNotes: '', mealsPerDay: null, twentyFourHourRecall: '' },
    foodFrequencies: foodOptions.map(({ value }) => ({ foodType: value, daysPerWeek: 0 })),
    perinatalHistory: { maternalAgeAtPregnancy: null, pregnancies: null, births: null, cesareans: null, abortions: null, pregnancyNumber: null, pregnancyPlanned: null, pregnancyDesired: null, pregnancyNotes: '', prenatalVisits: null, ultrasoundNotes: '', maternalVaccinesNotes: '', maternalConditionsNotes: '', birthRoute: '', birthPlace: '', gestationalAgeWeeks: null, gestationalAgeDays: null, birthWeightGrams: null, birthLengthCm: null, apgar: '', criedAndBreathedAtBirth: null, metabolicScreeningNotes: '', hearingScreeningNotes: '', cardiacScreeningNotes: '', ophthalmologicalScreeningNotes: '', hipScreeningNotes: '', perinatalHospitalizationNotes: '' },
    pathologicalHistoryItems: pathologicalOptions.map(({ value }) => ({ category: value, status: 'UNKNOWN' as ClinicalPresenceStatus, description: '' })),
  };
}
function normalizeHistory(history: Partial<ClinicalHistoryInput> | null): ClinicalHistoryInput {
  const base = emptyHistory(); if (!history) return base;
  const parents = base.familyMembers.map((parent) => ({ ...parent, ...history.familyMembers?.find((item) => item.relationship === parent.relationship) }));
  const foods = base.foodFrequencies.map((food) => ({ ...food, ...history.foodFrequencies?.find((item) => item.foodType === food.foodType) }));
  const pathological = base.pathologicalHistoryItems.map((item) => ({ ...item, ...history.pathologicalHistoryItems?.find((entry) => entry.category === item.category) }));
  return { ...base, ...history, familyMembers: parents, foodFrequencies: foods, pathologicalHistoryItems: pathological, nonPathologicalHistory: { ...base.nonPathologicalHistory, ...history.nonPathologicalHistory }, nutritionHistory: { ...base.nutritionHistory, ...history.nutritionHistory }, perinatalHistory: { ...base.perinatalHistory, ...history.perinatalHistory } };
}
