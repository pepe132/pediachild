import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found';
import { apiLimiter, originProtection } from './middlewares/security';
import { createAuthRouter } from './modules/auth/auth.routes';
import { AuthService, type AuthServiceContract } from './modules/auth/auth.service';
import { Session } from './modules/auth/session.entity';
import { User } from './modules/auth/user.entity';
import { healthRouter } from './modules/health/health.routes';
import { appDataSource } from './database/data-source';
import { Patient } from './modules/patients/patient.entity';
import { createPatientRouter } from './modules/patients/patient.routes';
import { PatientService, type PatientServiceContract } from './modules/patients/patient.service';
import { Appointment } from './modules/appointments/appointment.entity';
import { createAppointmentRouter } from './modules/appointments/appointment.routes';
import {
  AppointmentService,
  type AppointmentServiceContract,
} from './modules/appointments/appointment.service';
import {
  createConsultationRouter,
  createPatientConsultationRouter,
  createStartConsultationRouter,
} from './modules/consultations/consultation.routes';
import {
  ConsultationService,
  type ConsultationServiceContract,
} from './modules/consultations/consultation.service';
import { createClinicalHistoryRouter } from './modules/clinical-histories/clinical-history.routes';
import { ClinicalHistoryService, type ClinicalHistoryServiceContract } from './modules/clinical-histories/clinical-history.service';
import { createGrowthRouter } from './modules/growth/growth.routes';
import { GrowthService } from './modules/growth/growth.service';

export function createApp(
  authService?: AuthServiceContract,
  patientService?: PatientServiceContract,
  appointmentService?: AppointmentServiceContract,
  consultationService?: ConsultationServiceContract,
  clinicalHistoryService?: ClinicalHistoryServiceContract,
) {
  const app = express();
  app.set('trust proxy', 1);
  const resolvedAuthService =
    authService ??
    new AuthService(appDataSource.getRepository(User), appDataSource.getRepository(Session));
  const resolvedPatientService =
    patientService ?? new PatientService(appDataSource.getRepository(Patient));
  const resolvedAppointmentService =
    appointmentService ??
    new AppointmentService(
      appDataSource.getRepository(Appointment),
      appDataSource.getRepository(Patient),
    );
  const resolvedConsultationService =
    consultationService ?? new ConsultationService(appDataSource);
  const resolvedClinicalHistoryService =
    clinicalHistoryService ?? new ClinicalHistoryService(appDataSource);

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(apiLimiter);
  app.use(originProtection);

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', createAuthRouter(resolvedAuthService));
  app.use('/api/v1/patients', createPatientRouter(resolvedAuthService, resolvedPatientService));
  app.use('/api/v1/patients/:patientId/growth', createGrowthRouter(resolvedAuthService, new GrowthService(appDataSource)));
  app.use(
    '/api/v1/patients/:patientId/clinical-history',
    createClinicalHistoryRouter(resolvedAuthService, resolvedClinicalHistoryService),
  );
  app.use(
    '/api/v1/appointments',
    createAppointmentRouter(resolvedAuthService, resolvedAppointmentService),
  );
  app.use(
    '/api/v1/patients/:patientId/consultations',
    createPatientConsultationRouter(resolvedAuthService, resolvedConsultationService),
  );
  app.use(
    '/api/v1/appointments/:appointmentId/start-consultation',
    createStartConsultationRouter(resolvedAuthService, resolvedConsultationService),
  );
  app.use(
    '/api/v1/consultations',
    createConsultationRouter(resolvedAuthService, resolvedConsultationService),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
