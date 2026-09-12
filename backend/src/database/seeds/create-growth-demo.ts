import { appDataSource } from '../data-source';
import { User } from '../../modules/auth/user.entity';
import { Patient, AgeUnit, PatientSex } from '../../modules/patients/patient.entity';
import { PatientService } from '../../modules/patients/patient.service';
import { ConsultationService } from '../../modules/consultations/consultation.service';
import { Consultation } from '../../modules/consultations/consultation.entity';
import { MeasurementPosition } from '../../modules/consultations/anthropometric-measurement.entity';
import { ClinicalHistoryService } from '../../modules/clinical-histories/clinical-history.service';
import { ImmunizationStatus } from '../../modules/clinical-histories/clinical-history.entity';
import { FamilyRelationship } from '../../modules/clinical-histories/family-member-history.entity';
import { FoodType } from '../../modules/clinical-histories/food-frequency.entity';
import {
  ClinicalPresenceStatus,
  PathologicalCategory,
} from '../../modules/clinical-histories/pathological-history-item.entity';

const DEMO_FIRST_NAME = 'Sofía';
const DEMO_LAST_NAME = 'Paciente Demo Crecimiento';

const visits = [
  { date: '2025-03-15T16:00:00.000Z', age: 14, unit: AgeUnit.DAYS, weight: 2.2, height: 46.5, head: 32.2, reason: 'Control del recién nacido prematuro' },
  { date: '2025-04-15T16:00:00.000Z', age: 1, unit: AgeUnit.MONTHS, weight: 3.25, height: 51.2, head: 35.1, reason: 'Control de crecimiento al mes' },
  { date: '2025-06-01T16:00:00.000Z', age: 3, unit: AgeUnit.MONTHS, weight: 5.05, height: 58.4, head: 38.5, reason: 'Seguimiento de crecimiento y desarrollo' },
  { date: '2025-09-01T16:00:00.000Z', age: 6, unit: AgeUnit.MONTHS, weight: 6.85, height: 65.1, head: 41.7, reason: 'Control del niño sano' },
  { date: '2026-03-02T16:00:00.000Z', age: 12, unit: AgeUnit.MONTHS, weight: 9.15, height: 75.2, head: 45.1, reason: 'Control anual de crecimiento' },
  { date: '2026-09-10T16:00:00.000Z', age: 18, unit: AgeUnit.MONTHS, weight: 10.7, height: 82.4, head: 47.0, reason: 'Seguimiento de peso, talla y neurodesarrollo' },
] as const;

async function run() {
  await appDataSource.initialize();
  try {
    const user = await appDataSource.getRepository(User).createQueryBuilder('user')
      .where('user.active = true')
      .andWhere('user.approvedAt IS NOT NULL')
      .orderBy('user.createdAt', 'ASC')
      .getOne();

    if (!user) throw new Error('No existe un especialista activo y aprobado. Registra o aprueba uno primero.');

    const patients = appDataSource.getRepository(Patient);
    let patient = await patients.findOneBy({
      pediatricianId: user.id,
      firstName: DEMO_FIRST_NAME,
      lastName: DEMO_LAST_NAME,
    });

    if (!patient) {
      patient = await new PatientService(patients).create(user.id, {
        firstName: DEMO_FIRST_NAME,
        lastName: DEMO_LAST_NAME,
        ageValue: 18,
        ageUnit: AgeUnit.MONTHS,
        dateOfBirth: '2025-03-01',
        sex: PatientSex.FEMALE,
        placeOfBirth: 'Aguascalientes, Aguascalientes',
      });
    }

    const existingVisits = await appDataSource.getRepository(Consultation).countBy({ patientId: patient.id });
    if (existingVisits > 0) {
      console.log(`Demo existente: ${patient.firstName} ${patient.lastName} (${patient.id}), ${existingVisits} consultas.`);
      return;
    }

    await new ClinicalHistoryService(appDataSource).put(user.id, patient.id, {
      informantName: 'Mariana López',
      informantRelationship: 'Madre',
      siblingsHistory: 'Hermano de 6 años sano.',
      grandparentsHistory: 'Abuela materna con hipertensión arterial.',
      neurodevelopmentNotes: 'Hitos acordes con la edad corregida. Camina con apoyo y utiliza palabras simples.',
      ediResultNotes: 'Resultado EDI sin datos de alarma.',
      schoolingNotes: 'Permanece al cuidado de sus padres.',
      immunizationStatus: ImmunizationStatus.INCOMPLETE,
      missingVaccines: 'Refuerzo pendiente de acuerdo con cartilla; verificar en próxima consulta.',
      immunizationNotes: 'Cartilla revisada durante consulta.',
      familyMembers: [
        { relationship: FamilyRelationship.MOTHER, age: 29, origin: 'Aguascalientes', residence: 'Aguascalientes', occupation: 'Docente', bloodType: 'O+' },
        { relationship: FamilyRelationship.FATHER, age: 31, origin: 'Zacatecas', residence: 'Aguascalientes', occupation: 'Ingeniero', bloodType: 'A+' },
      ],
      nonPathologicalHistory: {
        origin: 'Aguascalientes', residence: 'Aguascalientes', housingNotes: 'Casa con ventilación e iluminación adecuadas.',
        servicesNotes: 'Cuenta con agua, electricidad y drenaje.', cookingFuelNotes: 'Gas LP.', waterNotes: 'Agua purificada.',
        bathroomNotes: 'Baño intradomiciliario.', cohabitantsNotes: 'Vive con padres y hermano.', roomNotes: 'Dos habitaciones.',
        animalContactNotes: 'Un perro vacunado.', biomassExposureNotes: 'Negada.', bathingNotes: 'Baño diario.',
        clothingChangeNotes: 'Cambio diario.', toothBrushingsPerDay: 2, urinationNotes: 'Diuresis normal.', bowelMovementsPerDay: 1, bristolType: 4,
      },
      nutritionHistory: {
        exclusiveBreastfeedingNotes: 'Lactancia materna exclusiva hasta los 6 meses de edad cronológica.',
        complementaryFeedingNotes: 'Alimentación complementaria iniciada a los 6 meses.', familyDietNotes: 'Dieta familiar variada.',
        mealsPerDay: 5, twentyFourHourRecall: 'Leche, fruta, huevo, sopa de verduras, pollo, tortilla y agua simple.',
      },
      foodFrequencies: [
        { foodType: FoodType.EGG, daysPerWeek: 4 }, { foodType: FoodType.MILK, daysPerWeek: 7 },
        { foodType: FoodType.VEGETABLES, daysPerWeek: 6 }, { foodType: FoodType.FRUITS, daysPerWeek: 7 },
        { foodType: FoodType.CHICKEN, daysPerWeek: 3 }, { foodType: FoodType.FISH, daysPerWeek: 1 },
      ],
      perinatalHistory: {
        maternalAgeAtPregnancy: 27, pregnancies: 2, births: 1, cesareans: 1, abortions: 0, pregnancyNumber: 2,
        pregnancyPlanned: true, pregnancyDesired: true, pregnancyNotes: 'Amenaza de parto prematuro en tercer trimestre.',
        prenatalVisits: 8, ultrasoundNotes: 'Consultas y ultrasonidos sin malformaciones reportadas.', maternalVaccinesNotes: 'Esquema materno completo.',
        maternalConditionsNotes: 'Preeclampsia controlada.', birthRoute: 'ABDOMINAL_CESAREAN', birthPlace: 'Hospital General de Aguascalientes',
        gestationalAgeWeeks: 34, gestationalAgeDays: 0, birthWeightGrams: 2050, birthLengthCm: 45.5, apgar: '8/9',
        criedAndBreathedAtBirth: true, metabolicScreeningNotes: 'Normal.', hearingScreeningNotes: 'Normal.', cardiacScreeningNotes: 'Normal.',
        ophthalmologicalScreeningNotes: 'Normal.', hipScreeningNotes: 'Normal.', perinatalHospitalizationNotes: 'Observación neonatal durante 5 días.',
      },
      pathologicalHistoryItems: [
        { category: PathologicalCategory.ALLERGY, status: ClinicalPresenceStatus.DENIED, description: null },
        { category: PathologicalCategory.SURGERY, status: ClinicalPresenceStatus.DENIED, description: null },
        { category: PathologicalCategory.HOSPITALIZATION, status: ClinicalPresenceStatus.PRESENT, description: 'Hospitalización neonatal por prematurez.' },
      ],
    });

    const consultations = new ConsultationService(appDataSource);
    for (const [index, visit] of visits.entries()) {
      const consultation = await consultations.createForPatient(user.id, patient.id, {
        consultationDate: visit.date,
        patientAgeValue: visit.age,
        patientAgeUnit: visit.unit,
        reason: visit.reason,
        currentIllness: index === 0 ? 'Acude para vigilancia posterior al egreso neonatal.' : 'Paciente sin síntomas agudos; acude para valoración programada.',
        physicalExamination: 'Paciente alerta, reactiva, hidratada, con adecuada coloración. Sin datos de dificultad respiratoria.',
        notes: 'Continuar vigilancia de crecimiento con edad corregida hasta los 2 años.',
        laboratoryNotes: index === 0 ? 'Tamiz metabólico reportado normal.' : null,
        imagingNotes: null,
        diagnoses: [{ description: index === 0 ? 'Recién nacida prematura en seguimiento' : 'Control del niño sano' }],
        treatments: [{ description: 'Cuidados generales y alimentación acorde con la edad', frequency: 'Diario', duration: 'Hasta próxima valoración', instructions: 'Regresar ante signos de alarma.' }],
        vitalSigns: { heartRateBpm: 132 - index * 4, respiratoryRateRpm: 38 - index * 2, oxygenSaturationPercent: 98, temperatureC: 36.6, pulsesDescription: 'Pulsos periféricos presentes y simétricos.', capillaryRefillSeconds: 2 },
        anthropometricMeasurement: {
          weightKg: visit.weight, lengthHeightCm: visit.height, headCircumferenceCm: visit.head,
          measurementPosition: MeasurementPosition.RECUMBENT_LENGTH, nutritionalDiagnosis: 'Crecimiento en vigilancia de acuerdo con edad corregida.',
        },
      });
      await consultations.complete(user.id, consultation.id);
    }

    console.log(`Demo creada: ${patient.firstName} ${patient.lastName}`);
    console.log(`Paciente: ${patient.id}`);
    console.log(`Especialista propietario: ${user.email}`);
    console.log(`Consultas históricas: ${visits.length}`);
  } finally {
    await appDataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
