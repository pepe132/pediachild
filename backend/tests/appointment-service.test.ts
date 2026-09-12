import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import {
  Appointment,
  AppointmentStatus,
} from '../src/modules/appointments/appointment.entity';
import { AppointmentService } from '../src/modules/appointments/appointment.service';
import type { Patient } from '../src/modules/patients/patient.entity';

const pediatricianId = '11111111-1111-4111-8111-111111111111';
const appointmentId = '33333333-3333-4333-8333-333333333333';

function appointment(status: AppointmentStatus): Appointment {
  return {
    id: appointmentId,
    pediatricianId,
    status,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    durationMinutes: 30,
  } as Appointment;
}

describe('AppointmentService', () => {
  it('checks patient ownership before creating an appointment', async () => {
    const appointments = {} as Repository<Appointment>;
    const patients = {
      findOneBy: vi.fn().mockResolvedValue(null),
    } as unknown as Repository<Patient>;
    const service = new AppointmentService(appointments, patients);

    await expect(
      service.create(pediatricianId, {
        patientId: '22222222-2222-4222-8222-222222222222',
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        durationMinutes: 30,
        reason: 'Consulta',
      }),
    ).rejects.toEqual(expect.objectContaining({ code: 'PATIENT_NOT_FOUND', statusCode: 404 }));

    expect(patients.findOneBy).toHaveBeenCalledWith({
      id: '22222222-2222-4222-8222-222222222222',
      pediatricianId,
      active: true,
    });
  });

  it('does not allow confirming a cancelled appointment', async () => {
    const appointments = {
      findOne: vi.fn().mockResolvedValue(appointment(AppointmentStatus.CANCELLED)),
    } as unknown as Repository<Appointment>;
    const service = new AppointmentService(appointments, {} as Repository<Patient>);

    await expect(service.confirm(pediatricianId, appointmentId)).rejects.toEqual(
      expect.objectContaining({ code: 'INVALID_APPOINTMENT_STATUS_TRANSITION', statusCode: 409 }),
    );
  });

  it('does not allow editing a completed appointment', async () => {
    const appointments = {
      findOne: vi.fn().mockResolvedValue(appointment(AppointmentStatus.COMPLETED)),
    } as unknown as Repository<Appointment>;
    const service = new AppointmentService(appointments, {} as Repository<Patient>);

    await expect(
      service.update(pediatricianId, appointmentId, { reason: 'Nuevo motivo' }),
    ).rejects.toEqual(expect.objectContaining({ code: 'APPOINTMENT_NOT_EDITABLE', statusCode: 409 }));
  });
});
