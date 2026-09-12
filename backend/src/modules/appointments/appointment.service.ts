import { QueryFailedError, type Repository } from 'typeorm';

import { AppError } from '../../shared/errors/app-error';
import { Patient } from '../patients/patient.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import type {
  CreateAppointmentInput,
  ListAppointmentsInput,
  UpdateAppointmentInput,
} from './appointment.schemas';

export interface PaginatedAppointments {
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AppointmentServiceContract {
  create(pediatricianId: string, input: CreateAppointmentInput): Promise<Appointment>;
  list(pediatricianId: string, input: ListAppointmentsInput): Promise<PaginatedAppointments>;
  getById(pediatricianId: string, appointmentId: string): Promise<Appointment>;
  update(
    pediatricianId: string,
    appointmentId: string,
    input: UpdateAppointmentInput,
  ): Promise<Appointment>;
  confirm(pediatricianId: string, appointmentId: string): Promise<Appointment>;
  cancel(pediatricianId: string, appointmentId: string): Promise<Appointment>;
  markNoShow(pediatricianId: string, appointmentId: string): Promise<Appointment>;
}

export class AppointmentService implements AppointmentServiceContract {
  constructor(
    private readonly appointments: Repository<Appointment>,
    private readonly patients: Repository<Patient>,
  ) {}

  async create(pediatricianId: string, input: CreateAppointmentInput): Promise<Appointment> {
    await this.ensurePatientOwnership(pediatricianId, input.patientId);

    const appointment = this.appointments.create({
      ...input,
      scheduledAt: new Date(input.scheduledAt),
      endsAt: this.calculateEnd(input.scheduledAt, input.durationMinutes),
      notes: input.notes ?? null,
      pediatricianId,
      status: AppointmentStatus.SCHEDULED,
    });

    return this.save(appointment);
  }

  async list(
    pediatricianId: string,
    input: ListAppointmentsInput,
  ): Promise<PaginatedAppointments> {
    const query = this.appointments
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.patient', 'patient')
      .where('appointment.pediatricianId = :pediatricianId', { pediatricianId });

    if (input.from) {
      query.andWhere('appointment.scheduledAt >= :from', { from: input.from });
    }
    if (input.to) {
      query.andWhere('appointment.scheduledAt < :to', { to: input.to });
    }
    if (input.status) {
      query.andWhere('appointment.status = :status', { status: input.status });
    }
    if (input.patientId) {
      query.andWhere('appointment.patientId = :patientId', { patientId: input.patientId });
    }

    query
      .orderBy('appointment.scheduledAt', 'ASC')
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

  async getById(pediatricianId: string, appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointments.findOne({
      where: { id: appointmentId, pediatricianId },
      relations: { patient: true },
    });

    if (!appointment) {
      throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'La cita no existe.');
    }
    return appointment;
  }

  async update(
    pediatricianId: string,
    appointmentId: string,
    input: UpdateAppointmentInput,
  ): Promise<Appointment> {
    const appointment = await this.getById(pediatricianId, appointmentId);
    this.ensureEditable(appointment);

    this.appointments.merge(appointment, {
      ...input,
      ...(input.scheduledAt ? { scheduledAt: new Date(input.scheduledAt) } : {}),
    });
    appointment.endsAt = this.calculateEnd(
      appointment.scheduledAt,
      appointment.durationMinutes,
    );

    return this.save(appointment);
  }

  async confirm(pediatricianId: string, appointmentId: string): Promise<Appointment> {
    const appointment = await this.getById(pediatricianId, appointmentId);
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw this.invalidTransition(appointment.status, AppointmentStatus.CONFIRMED);
    }
    appointment.status = AppointmentStatus.CONFIRMED;
    return this.save(appointment);
  }

  async cancel(pediatricianId: string, appointmentId: string): Promise<Appointment> {
    const appointment = await this.getById(pediatricianId, appointmentId);
    this.ensureActive(appointment, AppointmentStatus.CANCELLED);
    appointment.status = AppointmentStatus.CANCELLED;
    return this.save(appointment);
  }

  async markNoShow(pediatricianId: string, appointmentId: string): Promise<Appointment> {
    const appointment = await this.getById(pediatricianId, appointmentId);
    this.ensureActive(appointment, AppointmentStatus.NO_SHOW);
    appointment.status = AppointmentStatus.NO_SHOW;
    return this.save(appointment);
  }

  private async ensurePatientOwnership(pediatricianId: string, patientId: string): Promise<void> {
    const patient = await this.patients.findOneBy({ id: patientId, pediatricianId, active: true });
    if (!patient) {
      throw new AppError(404, 'PATIENT_NOT_FOUND', 'El paciente no existe.');
    }
  }

  private ensureEditable(appointment: Appointment): void {
    if (
      appointment.status !== AppointmentStatus.SCHEDULED &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new AppError(
        409,
        'APPOINTMENT_NOT_EDITABLE',
        'Una cita atendida, cancelada o marcada como inasistencia no puede modificarse.',
      );
    }
  }

  private ensureActive(appointment: Appointment, target: AppointmentStatus): void {
    if (
      appointment.status !== AppointmentStatus.SCHEDULED &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw this.invalidTransition(appointment.status, target);
    }
  }

  private invalidTransition(current: AppointmentStatus, target: AppointmentStatus): AppError {
    return new AppError(
      409,
      'INVALID_APPOINTMENT_STATUS_TRANSITION',
      `No se puede cambiar una cita de ${current} a ${target}.`,
    );
  }

  private async save(appointment: Appointment): Promise<Appointment> {
    try {
      return await this.appointments.save(appointment);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23P01'
      ) {
        throw new AppError(
          409,
          'APPOINTMENT_TIME_CONFLICT',
          'El pediatra ya tiene una cita programada en ese horario.',
        );
      }
      throw error;
    }
  }

  private calculateEnd(scheduledAt: string | Date, durationMinutes: number): Date {
    return new Date(new Date(scheduledAt).getTime() + durationMinutes * 60_000);
  }
}
