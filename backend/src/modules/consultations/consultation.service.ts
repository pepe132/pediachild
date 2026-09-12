import type { DataSource, EntityManager, Repository } from 'typeorm';

import { AppError } from '../../shared/errors/app-error';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Patient } from '../patients/patient.entity';
import { Consultation, ConsultationStatus } from './consultation.entity';
import { Diagnosis } from './diagnosis.entity';
import type {
  CreateConsultationInput,
  DiagnosisInput,
  ListConsultationsInput,
  TreatmentInput,
  UpdateConsultationInput,
} from './consultation.schemas';
import { Treatment } from './treatment.entity';
import { VitalSigns } from './vital-signs.entity';
import { AnthropometricMeasurement } from './anthropometric-measurement.entity';
import { ConsultationRevision } from './consultation-revision.entity';

export interface PaginatedConsultations {
  data: Consultation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConsultationServiceContract {
  createForPatient(
    pediatricianId: string,
    patientId: string,
    input: CreateConsultationInput,
  ): Promise<Consultation>;
  startFromAppointment(pediatricianId: string, appointmentId: string): Promise<Consultation>;
  listForPatient(
    pediatricianId: string,
    patientId: string,
    input: ListConsultationsInput,
  ): Promise<PaginatedConsultations>;
  getById(pediatricianId: string, consultationId: string): Promise<Consultation>;
  update(
    pediatricianId: string,
    consultationId: string,
    input: UpdateConsultationInput,
  ): Promise<Consultation>;
  complete(pediatricianId: string, consultationId: string): Promise<Consultation>;
}

export class ConsultationService implements ConsultationServiceContract {
  constructor(private readonly dataSource: DataSource) {}

  async createForPatient(
    pediatricianId: string,
    patientId: string,
    input: CreateConsultationInput,
  ): Promise<Consultation> {
    const consultationId = await this.dataSource.transaction(async (manager) => {
      const patient = await this.findOwnedPatient(manager, pediatricianId, patientId);
      const consultation = await manager.getRepository(Consultation).save(
        manager.getRepository(Consultation).create({
          patientId: patient.id,
          pediatricianId,
          appointmentId: null,
          consultationDate: input.consultationDate ? new Date(input.consultationDate) : new Date(),
          patientAgeValue: input.patientAgeValue ?? patient.ageValue,
          patientAgeUnit: input.patientAgeUnit ?? patient.ageUnit,
          reason: input.reason,
          currentIllness: input.currentIllness ?? null,
          physicalExamination: input.physicalExamination ?? null,
          notes: input.notes ?? null,
          laboratoryNotes: input.laboratoryNotes ?? null,
          imagingNotes: input.imagingNotes ?? null,
          status: ConsultationStatus.IN_PROGRESS,
          completedAt: null,
        }),
      );

      await this.replaceDiagnoses(manager, consultation.id, input.diagnoses);
      await this.replaceTreatments(manager, consultation.id, input.treatments);
      if (input.vitalSigns) {
        await manager.getRepository(VitalSigns).save(
          manager.getRepository(VitalSigns).create({ consultationId: consultation.id, ...input.vitalSigns }),
        );
      }
      if (input.anthropometricMeasurement) {
        await manager.getRepository(AnthropometricMeasurement).save(
          manager.getRepository(AnthropometricMeasurement).create({ consultationId: consultation.id, ...withCalculatedBmi(input.anthropometricMeasurement) }),
        );
      }
      return consultation.id;
    });

    return this.getById(pediatricianId, consultationId);
  }

  async startFromAppointment(
    pediatricianId: string,
    appointmentId: string,
  ): Promise<Consultation> {
    const consultationId = await this.dataSource.transaction(async (manager) => {
      const appointments = manager.getRepository(Appointment);
      const appointment = await appointments
        .createQueryBuilder('appointment')
        .innerJoinAndSelect('appointment.patient', 'patient')
        .where('appointment.id = :appointmentId', { appointmentId })
        .andWhere('appointment.pediatricianId = :pediatricianId', { pediatricianId })
        .setLock('pessimistic_write')
        .getOne();

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'La cita no existe.');
      }
      if (
        appointment.status !== AppointmentStatus.SCHEDULED &&
        appointment.status !== AppointmentStatus.CONFIRMED
      ) {
        throw new AppError(
          409,
          'APPOINTMENT_CANNOT_START_CONSULTATION',
          'La cita no puede iniciar una consulta en su estado actual.',
        );
      }

      const consultations = manager.getRepository(Consultation);
      const existingConsultation = await consultations.findOneBy({ appointmentId });
      if (existingConsultation) {
        throw new AppError(
          409,
          'APPOINTMENT_ALREADY_HAS_CONSULTATION',
          'La cita ya tiene una consulta relacionada.',
        );
      }

      const consultation = await consultations.save(
        consultations.create({
          patientId: appointment.patientId,
          pediatricianId,
          appointmentId: appointment.id,
          consultationDate: new Date(),
          patientAgeValue: appointment.patient.ageValue,
          patientAgeUnit: appointment.patient.ageUnit,
          reason: appointment.reason,
          currentIllness: null,
          physicalExamination: null,
          notes: appointment.notes,
          laboratoryNotes: null,
          imagingNotes: null,
          status: ConsultationStatus.IN_PROGRESS,
          completedAt: null,
        }),
      );

      appointment.status = AppointmentStatus.COMPLETED;
      await appointments.save(appointment);
      return consultation.id;
    });

    return this.getById(pediatricianId, consultationId);
  }

  async listForPatient(
    pediatricianId: string,
    patientId: string,
    input: ListConsultationsInput,
  ): Promise<PaginatedConsultations> {
    await this.findOwnedPatient(this.dataSource.manager, pediatricianId, patientId);

    const query = this.dataSource
      .getRepository(Consultation)
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.diagnoses', 'diagnosis')
      .leftJoinAndSelect('consultation.treatments', 'treatment')
      .leftJoinAndSelect('consultation.vitalSigns', 'vitalSigns')
      .leftJoinAndSelect('consultation.anthropometricMeasurement', 'anthropometricMeasurement')
      .where('consultation.pediatricianId = :pediatricianId', { pediatricianId })
      .andWhere('consultation.patientId = :patientId', { patientId });

    if (input.status) {
      query.andWhere('consultation.status = :status', { status: input.status });
    }
    if (input.from) {
      query.andWhere('consultation.consultationDate >= :from', { from: input.from });
    }
    if (input.to) {
      query.andWhere('consultation.consultationDate < :to', { to: input.to });
    }

    query
      .orderBy('consultation.consultationDate', 'DESC')
      .skip((input.page - 1) * input.limit)
      .take(input.limit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }

  async getById(pediatricianId: string, consultationId: string): Promise<Consultation> {
    const consultation = await this.dataSource.getRepository(Consultation).findOne({
      where: { id: consultationId, pediatricianId },
      relations: { patient: true, diagnoses: true, treatments: true, vitalSigns: true, anthropometricMeasurement: true },
      order: { diagnoses: { createdAt: 'ASC' }, treatments: { createdAt: 'ASC' } },
    });

    if (!consultation) {
      throw new AppError(404, 'CONSULTATION_NOT_FOUND', 'La consulta no existe.');
    }
    return consultation;
  }

  async update(
    pediatricianId: string,
    consultationId: string,
    input: UpdateConsultationInput,
  ): Promise<Consultation> {
    await this.dataSource.transaction(async (manager) => {
      const consultations = manager.getRepository(Consultation);
      const consultation = await consultations.findOneBy({ id: consultationId, pediatricianId });
      if (!consultation) {
        throw new AppError(404, 'CONSULTATION_NOT_FOUND', 'La consulta no existe.');
      }

      const previous = await this.getById(pediatricianId, consultationId);
      await manager.getRepository(ConsultationRevision).save(manager.getRepository(ConsultationRevision).create({
        consultationId, changedBy: pediatricianId, snapshot: JSON.parse(JSON.stringify(previous)) as Record<string, unknown>,
      }));

      const { diagnoses, treatments, vitalSigns, anthropometricMeasurement, consultationDate, ...fields } = input;
      consultations.merge(consultation, {
        ...fields,
        ...(consultationDate ? { consultationDate: new Date(consultationDate) } : {}),
      });
      await consultations.save(consultation);

      if (diagnoses) {
        await this.replaceDiagnoses(manager, consultation.id, diagnoses);
      }
      if (treatments) {
        await this.replaceTreatments(manager, consultation.id, treatments);
      }
      if (vitalSigns !== undefined) {
        await this.replaceVitalSigns(manager, consultation.id, vitalSigns);
      }
      if (anthropometricMeasurement !== undefined) {
        await this.replaceAnthropometricMeasurement(
          manager,
          consultation.id,
          anthropometricMeasurement,
        );
      }
    });

    return this.getById(pediatricianId, consultationId);
  }

  async complete(pediatricianId: string, consultationId: string): Promise<Consultation> {
    const consultations = this.dataSource.getRepository(Consultation);
    const consultation = await consultations.findOneBy({ id: consultationId, pediatricianId });
    if (!consultation) {
      throw new AppError(404, 'CONSULTATION_NOT_FOUND', 'La consulta no existe.');
    }
    if (consultation.status === ConsultationStatus.COMPLETED) {
      return this.getById(pediatricianId, consultationId);
    }

    consultation.status = ConsultationStatus.COMPLETED;
    consultation.completedAt = new Date();
    await consultations.save(consultation);
    return this.getById(pediatricianId, consultationId);
  }

  private async findOwnedPatient(
    manager: EntityManager,
    pediatricianId: string,
    patientId: string,
  ): Promise<Patient> {
    const patient = await manager.getRepository(Patient).findOneBy({
      id: patientId,
      pediatricianId,
      active: true,
    });
    if (!patient) {
      throw new AppError(404, 'PATIENT_NOT_FOUND', 'El paciente no existe.');
    }
    return patient;
  }

  private async replaceDiagnoses(
    manager: EntityManager,
    consultationId: string,
    inputs: DiagnosisInput[],
  ): Promise<void> {
    const diagnoses = manager.getRepository(Diagnosis);
    await diagnoses.delete({ consultationId });
    if (inputs.length > 0) {
      await diagnoses.save(
        inputs.map((input) =>
          diagnoses.create({
            consultationId,
            description: input.description,
            code: input.code ?? null,
          }),
        ),
      );
    }
  }

  private async replaceTreatments(
    manager: EntityManager,
    consultationId: string,
    inputs: TreatmentInput[],
  ): Promise<void> {
    const treatments = manager.getRepository(Treatment);
    await treatments.delete({ consultationId });
    if (inputs.length > 0) {
      await treatments.save(
        inputs.map((input) =>
          treatments.create({
            consultationId,
            description: input.description,
            dose: input.dose ?? null,
            route: input.route ?? null,
            frequency: input.frequency ?? null,
            duration: input.duration ?? null,
            instructions: input.instructions ?? null,
          }),
        ),
      );
    }
  }

  private async replaceVitalSigns(
    manager: EntityManager,
    consultationId: string,
    input: UpdateConsultationInput['vitalSigns'],
  ): Promise<void> {
    const repository = manager.getRepository(VitalSigns);
    await repository.delete({ consultationId });
    if (input) {
      await repository.save(repository.create({ consultationId, ...input }));
    }
  }

  private async replaceAnthropometricMeasurement(
    manager: EntityManager,
    consultationId: string,
    input: UpdateConsultationInput['anthropometricMeasurement'],
  ): Promise<void> {
    const repository = manager.getRepository(AnthropometricMeasurement);
    await repository.delete({ consultationId });
    if (input) {
      await repository.save(repository.create({ consultationId, ...withCalculatedBmi(input) }));
    }
  }
}

function withCalculatedBmi(input: NonNullable<UpdateConsultationInput['anthropometricMeasurement']>) {
  const { weightKg, lengthHeightCm } = input;
  const heightMeters = lengthHeightCm == null ? null : lengthHeightCm / 100;
  const bmi = weightKg != null && heightMeters != null && heightMeters > 0
    ? Math.round((weightKg / (heightMeters * heightMeters)) * 100) / 100
    : null;
  return { ...input, bmi };
}
