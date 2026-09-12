import 'reflect-metadata';
import { User } from '../modules/auth/user.entity';
import { Patient, AgeUnit } from '../modules/patients/patient.entity';
import { ClinicalHistoryService } from '../modules/clinical-histories/clinical-history.service';
import { FamilyRelationship } from '../modules/clinical-histories/family-member-history.entity';
import { FoodType } from '../modules/clinical-histories/food-frequency.entity';
import { ImmunizationStatus } from '../modules/clinical-histories/clinical-history.entity';
import { ClinicalPresenceStatus, PathologicalCategory } from '../modules/clinical-histories/pathological-history-item.entity';
import { appDataSource } from './data-source';

async function verify() {
  await appDataSource.initialize();
  const users = appDataSource.getRepository(User); const patients = appDataSource.getRepository(Patient);
  const pediatrician = await users.findOneByOrFail({ active: true }); let patientId: string | undefined;
  try {
    const patient = await patients.save(patients.create({ pediatricianId: pediatrician.id, firstName: 'Temporal', lastName: 'Historia', ageValue: 3, ageUnit: AgeUnit.YEARS, dateOfBirth: null, active: true }));
    patientId = patient.id; const service = new ClinicalHistoryService(appDataSource);
    const saved = await service.put(pediatrician.id, patient.id, {
      informantName: 'Madre', informantRelationship: 'Madre', immunizationStatus: ImmunizationStatus.INCOMPLETE,
      missingVaccines: 'Influenza', familyMembers: [{ relationship: FamilyRelationship.MOTHER, age: 30 }],
      nonPathologicalHistory: { bristolType: 4 }, nutritionHistory: { mealsPerDay: 4 },
      foodFrequencies: [{ foodType: FoodType.FRUITS, daysPerWeek: 7 }], perinatalHistory: { gestationalAgeWeeks: 39, apgar: '8/9' },
      pathologicalHistoryItems: [{ category: PathologicalCategory.ALLERGY, status: ClinicalPresenceStatus.DENIED }],
    });
    if (saved.familyMembers.length !== 1 || saved.foodFrequencies.length !== 1 || saved.nonPathologicalHistory?.bristolType !== 4) throw new Error('Clinical history sections were not persisted.');
    const updated = await service.put(pediatrician.id, patient.id, { immunizationStatus: ImmunizationStatus.COMPLETE, familyMembers: [], foodFrequencies: [], pathologicalHistoryItems: [] });
    if (updated.id !== saved.id || updated.familyMembers.length !== 0 || updated.immunizationStatus !== ImmunizationStatus.COMPLETE) throw new Error('Clinical history replacement was not persisted.');
    console.log('Clinical history smoke test passed: create, load and transactional replacement work.');
  } finally { if (patientId) await patients.delete({ id: patientId }); }
}
verify().catch((error: unknown) => { console.error(`Clinical history smoke test failed: ${error instanceof Error ? error.message : 'Unknown error'}`); process.exitCode = 1; }).finally(async () => { if (appDataSource.isInitialized) await appDataSource.destroy(); });
