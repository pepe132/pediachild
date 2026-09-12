import type { DataSource } from 'typeorm';
import { AppError } from '../../shared/errors/app-error';
import { Patient, PatientSex } from '../patients/patient.entity';
import who from './data/who-0-5-lms.json';

type SexKey = 'female' | 'male';
type Indicator = 'weight' | 'height' | 'head';
type Lms = [number, number, number, number];
const curvePercentiles = [3, 15, 50, 85, 97] as const;
const zForPercentile = { 3: -1.880793608, 15: -1.036433389, 50: 0, 85: 1.036433389, 97: 1.880793608 } as const;

export class GrowthService {
  constructor(private readonly dataSource: DataSource) {}

  async getForPatient(ownerId: string, patientId: string) {
    const patient = await this.dataSource.getRepository(Patient).findOneBy({ id: patientId, pediatricianId: ownerId });
    if (!patient) throw new AppError(404, 'PATIENT_NOT_FOUND', 'El paciente no existe.');

    const missing = [!patient.dateOfBirth && 'dateOfBirth', !patient.sex && 'sex'].filter(Boolean) as string[];
    if (missing.length) return { available: false, missing, patient, observations: [], charts: [] };

    const perinatal = await this.dataSource.query(`
      SELECT ph.gestational_age_weeks AS "weeks", ph.gestational_age_days AS "days"
      FROM clinical_histories ch JOIN perinatal_histories ph ON ph.clinical_history_id = ch.id
      WHERE ch.patient_id = $1 LIMIT 1`, [patientId]);
    const gestationalDays = perinatal[0]?.weeks == null ? null : Number(perinatal[0].weeks) * 7 + Number(perinatal[0].days ?? 0);
    const measurements = await this.dataSource.query(`
      SELECT c.id AS "consultationId", c.consultation_date AS "measuredAt",
        a.weight_kg AS "weightKg", a.length_height_cm AS "heightCm", a.head_circumference_cm AS "headCm"
      FROM consultations c JOIN anthropometric_measurements a ON a.consultation_id = c.id
      WHERE c.patient_id = $1 AND c.pediatrician_id = $2 ORDER BY c.consultation_date`, [patientId, ownerId]);
    const sex: SexKey = patient.sex === PatientSex.FEMALE ? 'female' : 'male';
    const observations = measurements.map((row: Record<string, unknown>) => {
      const chronologicalDays = daysBetween(patient.dateOfBirth!, new Date(String(row.measuredAt)));
      const ageDays = correctedAgeDays(chronologicalDays, gestationalDays);
      const correctionDays = chronologicalDays - ageDays;
      const values = { weight: numberOrNull(row.weightKg), height: numberOrNull(row.heightCm), head: numberOrNull(row.headCm) };
      return {
        consultationId: row.consultationId, measuredAt: row.measuredAt, chronologicalDays, correctedAgeDays: ageDays,
        ageCorrected: correctionDays > 0, values,
        percentiles: {
          weight: percentileFor('weight', sex, ageDays, values.weight),
          height: percentileFor('height', sex, ageDays, values.height),
          head: percentileFor('head', sex, ageDays, values.head),
        },
      };
    });
    const charts = (['weight', 'height', 'head'] as Indicator[]).map((indicator) => ({
      indicator,
      unit: indicator === 'weight' ? 'kg' : 'cm',
      curves: curvePercentiles.map((percentile) => ({ percentile, points: referencePoints(indicator, sex, percentile) })),
    }));
    return { available: true, missing: [], patient, gestationalAgeDays: gestationalDays, observations, charts, source: who.source };
  }
}

function rows(indicator: Indicator, sex: SexKey): Lms[] { return (who.indicators[indicator][sex] as number[][]) as Lms[]; }
function lmsAt(indicator: Indicator, sex: SexKey, ageDays: number): Lms | null {
  if (ageDays < 0 || ageDays > 1856) return null;
  const data = rows(indicator, sex);
  if (indicator === 'height') return data[Math.min(Math.round(ageDays), data.length - 1)] ?? null;
  const month = ageDays / 30.4375, lower = Math.floor(month), upper = Math.min(60, Math.ceil(month));
  const a = data[lower], b = data[upper]; if (!a || !b) return null;
  const ratio = upper === lower ? 0 : (month - lower) / (upper - lower);
  return [month, a[1] + (b[1]-a[1])*ratio, a[2] + (b[2]-a[2])*ratio, a[3] + (b[3]-a[3])*ratio];
}
function valueAtZ(lms: Lms, z: number) { const [,l,m,s]=lms; return l === 0 ? m*Math.exp(s*z) : m*Math.pow(1+l*s*z,1/l); }
export function percentileFor(indicator: Indicator, sex: SexKey, ageDays: number, value: number | null) {
  if (value == null) return null; const lms=lmsAt(indicator,sex,ageDays); if(!lms) return null;
  const [,l,m,s]=lms; const z=l===0 ? Math.log(value/m)/s : (Math.pow(value/m,l)-1)/(l*s);
  return { zScore: round(z,3), percentile: round(normalCdf(z)*100,1) };
}
export function correctedAgeDays(chronologicalDays:number, gestationalDays:number|null){
  const correction=chronologicalDays<730&&gestationalDays!=null&&gestationalDays<280?280-gestationalDays:0;
  return Math.max(0,chronologicalDays-correction);
}
function referencePoints(indicator: Indicator, sex: SexKey, percentile: keyof typeof zForPercentile) {
  return Array.from({length:61},(_,month)=>{const ageDays=Math.round(month*30.4375),lms=lmsAt(indicator,sex,ageDays)!; return {ageDays,value:round(valueAtZ(lms,zForPercentile[percentile]),2)};});
}
function normalCdf(z:number){const t=1/(1+0.2316419*Math.abs(z));const d=0.3989423*Math.exp(-z*z/2);const p=1-d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>=0?p:1-p;}
function daysBetween(date:string, measured:Date){return Math.max(0,Math.floor((Date.UTC(measured.getUTCFullYear(),measured.getUTCMonth(),measured.getUTCDate())-Date.parse(`${date}T00:00:00Z`))/86400000));}
function numberOrNull(v:unknown){return v==null?null:Number(v);}
function round(v:number,n:number){const f=10**n;return Math.round(v*f)/f;}
