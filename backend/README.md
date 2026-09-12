# PediaChild Backend

API REST de PediaChild construida con Node.js, TypeScript, Express, TypeORM y PostgreSQL.

## Requisitos

- Node.js 22 o superior.
- PostgreSQL.

## Configuración local

1. Copiar `.env.example` como `.env`.
2. Crear una base PostgreSQL llamada `pediachild`.
3. Ajustar `DATABASE_URL`, `SESSION_SECRET` y los datos `INITIAL_USER_*`.
4. Ejecutar la migración con `npm run db:migrate`.
5. Crear el pediatra inicial con `npm run seed:pediatrician`.
6. Ejecutar `npm run dev`.

En este equipo PostgreSQL 17 está instalado y `psql.exe` se encuentra en:

```text
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

Desde PowerShell puede crearse la base con el siguiente comando; PostgreSQL solicitará la contraseña local sin guardarla en el historial:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h localhost -d postgres -c 'CREATE DATABASE pediachild;'
```

Después, `DATABASE_URL` debe usar la contraseña definida al instalar PostgreSQL:

```text
postgresql://postgres:YOUR_PASSWORD@localhost:5432/pediachild
```

Si la contraseña contiene caracteres especiales, deben codificarse para que la URL sea válida.

No se debe subir `.env` al repositorio.

El servidor escucha inicialmente en `http://localhost:3000` y expone:

```text
GET /api/v1/health
```

## Comandos

```text
npm run dev
npm run typecheck
npm run test
npm run build
npm start
npm run db:create
npm run db:migrate
npm run db:revert
npm run seed:pediatrician
npm run verify:auth
npm run verify:appointments
npm run verify:consultations
```

El arranque normal requiere conexión con PostgreSQL. Las pruebas HTTP base crean la aplicación sin abrir un puerto ni requerir una base de datos.

## Autenticación

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

La contraseña se protege con `scrypt`. El navegador recibe una cookie `httpOnly`; la base de datos almacena únicamente el hash del token de sesión.

## Pacientes

Todas las rutas requieren sesión y limitan los resultados al pediatra autenticado.

```text
GET   /api/v1/patients
POST  /api/v1/patients
GET   /api/v1/patients/:patientId
PATCH /api/v1/patients/:patientId
```

El listado acepta:

```text
search
registeredFrom
registeredTo
page
limit
active
sort=name|createdAt
order=asc|desc
```

La edad se captura mediante `ageValue` y `ageUnit`, donde la unidad puede ser `DAYS`, `MONTHS` o `YEARS`. La fecha de nacimiento es opcional.

## Citas

Todas las rutas requieren sesión y utilizan el pediatra autenticado como propietario.

```text
GET   /api/v1/appointments
POST  /api/v1/appointments
GET   /api/v1/appointments/:appointmentId
PATCH /api/v1/appointments/:appointmentId
POST  /api/v1/appointments/:appointmentId/confirm
POST  /api/v1/appointments/:appointmentId/cancel
POST  /api/v1/appointments/:appointmentId/no-show
```

El listado acepta `from`, `to`, `status`, `patientId`, `page` y `limit`. Las fechas deben enviarse en ISO 8601 con zona horaria.

PostgreSQL impide que un pediatra tenga citas activas traslapadas. Las citas canceladas o marcadas como inasistencia liberan ese horario. Una cita programada o confirmada puede iniciar una consulta mediante el endpoint correspondiente.

## Consultas

```text
GET   /api/v1/patients/:patientId/consultations
POST  /api/v1/patients/:patientId/consultations
POST  /api/v1/appointments/:appointmentId/start-consultation
GET   /api/v1/consultations/:consultationId
PATCH /api/v1/consultations/:consultationId
POST  /api/v1/consultations/:consultationId/complete
```

Una consulta puede crearse directamente desde el paciente o a partir de una cita. El segundo flujo crea la consulta, la vincula y marca la cita como atendida dentro de una sola transacción.

Los diagnósticos y tratamientos se reciben como listas dentro de la consulta y se guardan transaccionalmente. Signos vitales y somatometría se incorporarán cuando se confirmen los campos clínicos pendientes.
