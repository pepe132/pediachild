import 'reflect-metadata';

import { Appointment, AppointmentStatus } from '../modules/appointments/appointment.entity';
import { User } from '../modules/auth/user.entity';
import { Consultation } from '../modules/consultations/consultation.entity';
import { ConsultationService } from '../modules/consultations/consultation.service';
import { MeasurementPosition } from '../modules/consultations/anthropometric-measurement.entity';
import { AgeUnit, Patient } from '../modules/patients/patient.entity';
import { appDataSource } from './data-source';

async function verifyConsultations() {
  await appDataSource.initialize();
  const users = appDataSource.getRepository(User);
  const patients = appDataSource.getRepository(Patient);
  const appointments = appDataSource.getRepository(Appointment);
  const consultations = appDataSource.getRepository(Consultation);
  const pediatrician = await users.findOneByOrFail({ active: true });

  let patientId: string | undefined;
  let appointmentId: string | undefined;

  try {
    const patient = await patients.save(
      patients.create({
        pediatricianId: pediatrician.id,
        firstName: 'Temporal',
        lastName: 'Consulta',
        ageValue: 2,
        ageUnit: AgeUnit.YEARS,
        dateOfBirth: null,
        active: true,
      }),
    );
    patientId = patient.id;

    const scheduledAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const appointment = await appointments.save(
      appointments.create({
        patientId: patient.id,
        pediatricianId: pediatrician.id,
        scheduledAt,
        durationMinutes: 30,
        endsAt: new Date(scheduledAt.getTime() + 30 * 60 * 1000),
        reason: 'Consulta temporal',
        notes: null,
        status: AppointmentStatus.SCHEDULED,
      }),
    );
    appointmentId = appointment.id;

    const service = new ConsultationService(appDataSource);
    const consultation = await service.startFromAppointment(pediatrician.id, appointment.id);
    if (consultation.appointmentId !== appointment.id) {
      throw new Error('Consultation was not linked to its appointment.');
    }

    const updatedAppointment = await appointments.findOneByOrFail({ id: appointment.id });
    if (updatedAppointment.status !== AppointmentStatus.COMPLETED) {
      throw new Error('Appointment was not marked as completed.');
    }

    const directConsultation = await service.createForPatient(pediatrician.id, patient.id, {
      reason: 'Consulta directa temporal',
      vitalSigns: {
        heartRateBpm: 92,
        temperatureC: 36.8,
        oxygenSaturationPercent: 98,
        pulsesDescription: 'Adecuados',
      },
      anthropometricMeasurement: {
        weightKg: 12.45,
        lengthHeightCm: 89.4,
        headCircumferenceCm: 48.2,
        measurementPosition: MeasurementPosition.STANDING_HEIGHT,
        weightForAgePercentile: 50,
        nutritionalDiagnosis: 'Adecuado',
      },
      diagnoses: [{ description: 'Diagnóstico de verificación' }],
      treatments: [{ description: 'Tratamiento de verificación' }],
    });
    if (directConsultation.diagnoses.length !== 1 || directConsultation.treatments.length !== 1) {
      throw new Error('Diagnosis or treatment was not persisted.');
    }
    if (
      directConsultation.vitalSigns?.heartRateBpm !== 92 ||
      directConsultation.anthropometricMeasurement?.weightKg !== 12.45 ||
      directConsultation.anthropometricMeasurement?.headCircumferenceCm !== 48.2 ||
      directConsultation.anthropometricMeasurement?.bmi !== 15.58
    ) {
      throw new Error('Clinical measurements were not persisted.');
    }

    console.log(
      'Consultation smoke test passed: appointment flow, clinical lists and measurements work.',
    );
  } finally {
    if (patientId) {
      await consultations.delete({ patientId });
    }
    if (appointmentId) {
      await appointments.delete({ id: appointmentId });
    }
    if (patientId) {
      await patients.delete({ id: patientId });
    }
  }
}

verifyConsultations()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown consultation error';
    console.error(`Consultation smoke test failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
