import type { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { AppError } from '../../shared/errors/app-error';
import { Patient } from '../patients/patient.entity';
import { ClinicalHistory, ImmunizationStatus } from './clinical-history.entity';
import { FamilyMemberHistory } from './family-member-history.entity';
import { FoodFrequency } from './food-frequency.entity';
import { NonPathologicalHistory } from './non-pathological-history.entity';
import { NutritionHistory } from './nutrition-history.entity';
import { PathologicalHistoryItem } from './pathological-history-item.entity';
import { PerinatalHistory } from './perinatal-history.entity';
import type { ClinicalHistoryInput } from './clinical-history.schemas';
import { ClinicalHistoryRevision } from './clinical-history-revision.entity';

export interface CompleteClinicalHistory extends ClinicalHistory {
  familyMembers: FamilyMemberHistory[]; nonPathologicalHistory: NonPathologicalHistory | null;
  nutritionHistory: NutritionHistory | null; foodFrequencies: FoodFrequency[];
  perinatalHistory: PerinatalHistory | null; pathologicalHistoryItems: PathologicalHistoryItem[];
}
export interface ClinicalHistoryServiceContract {
  get(pediatricianId: string, patientId: string): Promise<CompleteClinicalHistory | null>;
  put(pediatricianId: string, patientId: string, input: ClinicalHistoryInput): Promise<CompleteClinicalHistory>;
}

export class ClinicalHistoryService implements ClinicalHistoryServiceContract {
  constructor(private readonly dataSource: DataSource) {}

  async get(pediatricianId: string, patientId: string): Promise<CompleteClinicalHistory | null> {
    await this.ensurePatient(this.dataSource.manager, pediatricianId, patientId);
    return this.load(patientId);
  }

  async put(pediatricianId: string, patientId: string, input: ClinicalHistoryInput): Promise<CompleteClinicalHistory> {
    const previous = await this.get(pediatricianId, patientId);
    await this.dataSource.transaction(async (manager) => {
      await this.ensurePatient(manager, pediatricianId, patientId);
      const histories = manager.getRepository(ClinicalHistory);
      let history = await histories.findOneBy({ patientId });
      if (history && previous) await manager.getRepository(ClinicalHistoryRevision).save(
        manager.getRepository(ClinicalHistoryRevision).create({ clinicalHistoryId: history.id, changedBy: pediatricianId, snapshot: JSON.parse(JSON.stringify(previous)) as Record<string, unknown> }),
      );
      const { familyMembers, nonPathologicalHistory, nutritionHistory, foodFrequencies, perinatalHistory, pathologicalHistoryItems, ...main } = input;
      if (main.immunizationStatus !== ImmunizationStatus.INCOMPLETE) main.missingVaccines = null;
      history = await histories.save(history ? histories.merge(history, main) : histories.create({ patientId, ...main }));
      const id = history.id;
      await this.replaceMany(manager, FamilyMemberHistory, id, familyMembers);
      await this.replaceOne(manager, NonPathologicalHistory, id, nonPathologicalHistory);
      await this.replaceOne(manager, NutritionHistory, id, nutritionHistory);
      await this.replaceMany(manager, FoodFrequency, id, foodFrequencies);
      await this.replaceOne(manager, PerinatalHistory, id, perinatalHistory);
      await this.replaceMany(manager, PathologicalHistoryItem, id, pathologicalHistoryItems);
    });
    return (await this.load(patientId))!;
  }

  private async load(patientId: string): Promise<CompleteClinicalHistory | null> {
    const history = await this.dataSource.getRepository(ClinicalHistory).findOneBy({ patientId });
    if (!history) return null;
    const id = history.id;
    const [familyMembers, nonPathologicalHistory, nutritionHistory, foodFrequencies, perinatalHistory, pathologicalHistoryItems] = await Promise.all([
      this.dataSource.getRepository(FamilyMemberHistory).findBy({ clinicalHistoryId: id }),
      this.dataSource.getRepository(NonPathologicalHistory).findOneBy({ clinicalHistoryId: id }),
      this.dataSource.getRepository(NutritionHistory).findOneBy({ clinicalHistoryId: id }),
      this.dataSource.getRepository(FoodFrequency).findBy({ clinicalHistoryId: id }),
      this.dataSource.getRepository(PerinatalHistory).findOneBy({ clinicalHistoryId: id }),
      this.dataSource.getRepository(PathologicalHistoryItem).findBy({ clinicalHistoryId: id }),
    ]);
    return Object.assign(history, { familyMembers, nonPathologicalHistory, nutritionHistory, foodFrequencies, perinatalHistory, pathologicalHistoryItems });
  }

  private async ensurePatient(manager: EntityManager, pediatricianId: string, patientId: string) {
    const patient = await manager.getRepository(Patient).findOneBy({ id: patientId, pediatricianId, active: true });
    if (!patient) throw new AppError(404, 'PATIENT_NOT_FOUND', 'El paciente no existe.');
  }

  private async replaceMany(manager: EntityManager, entity: EntityTarget<ObjectLiteral>, id: string, values: object[]) {
    const repository = manager.getRepository<ObjectLiteral>(entity);
    await repository.delete({ clinicalHistoryId: id });
    if (values.length) await repository.save(values.map((value) => repository.create({ clinicalHistoryId: id, ...value })));
  }

  private async replaceOne(manager: EntityManager, entity: EntityTarget<ObjectLiteral>, id: string, value: object | null | undefined) {
    const repository = manager.getRepository<ObjectLiteral>(entity);
    await repository.delete({ clinicalHistoryId: id });
    if (value) await repository.save(repository.create({ clinicalHistoryId: id, ...value } as never));
  }
}
