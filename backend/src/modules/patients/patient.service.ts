import { Brackets, type Repository } from 'typeorm';

import { AppError } from '../../shared/errors/app-error';
import { Patient } from './patient.entity';
import type { CreatePatientInput, ListPatientsInput, UpdatePatientInput } from './patient.schemas';

export interface PaginatedPatients {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientServiceContract {
  create(pediatricianId: string, input: CreatePatientInput): Promise<Patient>;
  list(pediatricianId: string, input: ListPatientsInput): Promise<PaginatedPatients>;
  getById(pediatricianId: string, patientId: string): Promise<Patient>;
  update(
    pediatricianId: string,
    patientId: string,
    input: UpdatePatientInput,
  ): Promise<Patient>;
}

export class PatientService implements PatientServiceContract {
  constructor(private readonly patients: Repository<Patient>) {}

  async create(pediatricianId: string, input: CreatePatientInput): Promise<Patient> {
    return this.patients.save(
      this.patients.create({
        ...input,
        dateOfBirth: input.dateOfBirth ?? null,
        pediatricianId,
        active: true,
      }),
    );
  }

  async list(pediatricianId: string, input: ListPatientsInput): Promise<PaginatedPatients> {
    const query = this.patients
      .createQueryBuilder('patient')
      .where('patient.pediatricianId = :pediatricianId', { pediatricianId })
      .andWhere('patient.active = :active', { active: input.active });

    if (input.search) {
      query.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            .where('patient.firstName ILIKE :search', { search: `%${input.search}%` })
            .orWhere('patient.lastName ILIKE :search', { search: `%${input.search}%` })
            .orWhere(`CONCAT(patient.firstName, ' ', patient.lastName) ILIKE :search`, {
              search: `%${input.search}%`,
            });
        }),
      );
    }

    if (input.registeredFrom) {
      query.andWhere('patient.createdAt >= :registeredFrom', {
        registeredFrom: `${input.registeredFrom}T00:00:00.000Z`,
      });
    }

    if (input.registeredTo) {
      query.andWhere('patient.createdAt < :registeredTo', {
        registeredTo: this.nextUtcDay(input.registeredTo),
      });
    }

    if (input.sort === 'name') {
      query
        .orderBy('patient.lastName', input.order.toUpperCase() as 'ASC' | 'DESC')
        .addOrderBy('patient.firstName', input.order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      query.orderBy('patient.createdAt', input.order.toUpperCase() as 'ASC' | 'DESC');
    }

    query.skip((input.page - 1) * input.limit).take(input.limit);
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

  async getById(pediatricianId: string, patientId: string): Promise<Patient> {
    const patient = await this.patients.findOneBy({ id: patientId, pediatricianId });
    if (!patient) {
      throw new AppError(404, 'PATIENT_NOT_FOUND', 'El paciente no existe.');
    }
    return patient;
  }

  async update(
    pediatricianId: string,
    patientId: string,
    input: UpdatePatientInput,
  ): Promise<Patient> {
    const patient = await this.getById(pediatricianId, patientId);
    this.patients.merge(patient, input);
    return this.patients.save(patient);
  }

  private nextUtcDay(value: string): string {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString();
  }
}
