import 'reflect-metadata';

import { QueryFailedError } from 'typeorm';

import { Appointment, AppointmentStatus } from '../modules/appointments/appointment.entity';
import { User } from '../modules/auth/user.entity';
import { AgeUnit, Patient } from '../modules/patients/patient.entity';
import { appDataSource } from './data-source';

async function verifyAppointments() {
  await appDataSource.initialize();
  const queryRunner = appDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const users = queryRunner.manager.getRepository(User);
    const patients = queryRunner.manager.getRepository(Patient);
    const appointments = queryRunner.manager.getRepository(Appointment);
    const pediatrician = await users.findOneByOrFail({ active: true });

    const patient = await patients.save(
      patients.create({
        pediatricianId: pediatrician.id,
        firstName: 'Temporal',
        lastName: 'Verificación',
        ageValue: 1,
        ageUnit: AgeUnit.YEARS,
        dateOfBirth: null,
        active: true,
      }),
    );

    const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await appointments.save(
      appointments.create({
        patientId: patient.id,
        pediatricianId: pediatrician.id,
        scheduledAt,
        durationMinutes: 30,
        endsAt: new Date(scheduledAt.getTime() + 30 * 60 * 1000),
        reason: 'Verificación temporal',
        notes: null,
        status: AppointmentStatus.SCHEDULED,
      }),
    );

    let overlapWasRejected = false;
    try {
      await appointments.save(
        appointments.create({
          patientId: patient.id,
          pediatricianId: pediatrician.id,
          scheduledAt: new Date(scheduledAt.getTime() + 10 * 60 * 1000),
          durationMinutes: 30,
          endsAt: new Date(scheduledAt.getTime() + 40 * 60 * 1000),
          reason: 'Traslape temporal',
          notes: null,
          status: AppointmentStatus.SCHEDULED,
        }),
      );
    } catch (error) {
      overlapWasRejected =
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23P01';
    }

    if (!overlapWasRejected) {
      throw new Error('PostgreSQL did not reject an overlapping appointment.');
    }

    console.log('Appointment smoke test passed: overlapping schedules are rejected.');
  } finally {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  }
}

verifyAppointments()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown appointment error';
    console.error(`Appointment smoke test failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
