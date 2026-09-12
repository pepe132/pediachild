# Plan del backend — PediaChild

## 1. Responsabilidad

El backend será una API REST responsable de:

- autenticar al pediatra;
- aislar los datos de cada pediatra propietario;
- validar y guardar pacientes y expedientes;
- administrar historias clínicas y consultas;
- administrar citas y la agenda del pediatra;
- conservar signos vitales, diagnósticos y tratamientos;
- proporcionar búsquedas, filtros y paginación;
- proteger la información clínica y mantener trazabilidad.

## 2. Tecnologías

- **Node.js + TypeScript**: entorno del servidor.
- **Express**: API REST.
- **Zod**: validación de solicitudes y variables de entorno.
- **TypeORM**: entidades, relaciones y migraciones.
- **PostgreSQL**: base de datos relacional.
- **Argon2** o **bcrypt**: hash de contraseñas.
- **Cookie `httpOnly` segura**: almacenamiento de la sesión.
- **Vitest + Supertest**: pruebas unitarias y de integración.
- **Pino**: logs técnicos sin incluir información clínica sensible.

Sequelize también podría utilizarse, pero TypeORM será la opción principal por su integración con TypeScript, clases y decoradores.

## 3. Base de datos y alojamiento

Se recomienda PostgreSQL administrado en Railway porque el proyecto ya dispone de esa plataforma y permite alojar la API y la base en un mismo proyecto.

Antes de usar datos reales se deberán confirmar:

- precio vigente y presupuesto disponible;
- región de alojamiento;
- respaldos automáticos y procedimiento de restauración;
- requisitos legales para información clínica en la jurisdicción aplicable;
- condiciones contractuales necesarias para alojar datos de salud.

SQLite puede utilizarse en prototipos, pero no es la primera opción para producción debido a concurrencia, respaldos y despliegue remoto.

## 4. Modelo inicial de datos

No se guardará todo el expediente en una sola tabla. Los datos permanentes del paciente se separarán del historial de consultas.

### `users`

- `id` (UUID)
- `name`
- `email` o `username` (único)
- `password_hash`
- `role`
- `active`
- `created_at`
- `updated_at`

### `patients`

- `id` (UUID)
- `first_name`
- `last_name`
- `age_value`
- `age_unit` (`DAYS`, `MONTHS` o `YEARS`)
- `date_of_birth` (opcional)
- `place_of_birth` (opcional)
- `sex` (si se confirma como requisito)
- datos de contacto y tutor pendientes de confirmar
- `created_by`
- `pediatrician_id` (propietario del paciente)
- `active`
- `created_at`
- `updated_at`

El especialista capturará la edad directamente. En pediatría se guardarán valor y unidad. La fecha de nacimiento será complementaria y opcional.

La fecha de nacimiento y el sexo pasarán a ser obligatorios únicamente si se habilita el cálculo automático de percentiles OMS. La edad digitada se conservará, pero no se usará por sí sola para calcularlos. Véase [CURVAS_OMS.md](CURVAS_OMS.md).

### `clinical_histories`

- `id`
- `patient_id`
- informante y parentesco
- hermanos y abuelos
- notas de neurodesarrollo y escolaridad
- estado de vacunación, vacunas faltantes y notas
- `created_at`
- `updated_at`

La historia actual es única por paciente. Se complementa con las tablas `family_member_histories`, `non_pathological_histories`, `nutrition_histories`, `food_frequencies`, `perinatal_histories` y `pathological_history_items`. El guardado reemplaza todas sus secciones dentro de una sola transacción.

El análisis detallado del documento recibido y la separación propuesta en antecedentes familiares, no patológicos, nutricionales, perinatales y patológicos se encuentra en [HISTORIA_CLINICA.md](HISTORIA_CLINICA.md).

### `consultations`

- `id`
- `patient_id`
- `pediatrician_id`
- `appointment_id` (opcional y único, cuando la consulta se origine desde una cita)
- `consultation_date`
- `patient_age_value`
- `patient_age_unit` (`DAYS`, `MONTHS` o `YEARS`)
- `reason`
- `current_illness`
- `physical_examination`
- `notes`
- `created_at`
- `updated_at`

Guardar la edad en cada consulta conserva el dato clínico tal como fue registrado en ese momento.

La nota podrá incluir opcionalmente los componentes de SAMPLE, notas de laboratorio y notas de imagenología. Las plantillas de síntomas serán ayudas del frontend y no tablas clínicas independientes. Véase [NOTA_INGRESO.md](NOTA_INGRESO.md).

### `vital_signs`

- `id`
- `consultation_id`
- `temperature_c`
- `heart_rate_bpm`
- `respiratory_rate_rpm`
- `systolic_pressure_mmhg`
- `diastolic_pressure_mmhg`
- `oxygen_saturation_percent`
- `pulses_description`
- `capillary_refill_seconds`

Los campos podrán ser opcionales cuando clínicamente no apliquen. Los rangos servirán para detectar posibles errores de captura, pero los límites deberán aprobarse con el especialista.

### `anthropometric_measurements`

- `id`
- `consultation_id`, único
- `weight_kg`
- `length_height_cm`
- `bmi` (calculado por el backend a partir de peso y talla)
- `head_circumference_cm`
- `measurement_position` (`RECUMBENT_LENGTH` o `STANDING_HEIGHT`)
- `weight_for_age_percentile`
- `weight_for_length_height_percentile`
- `length_height_for_age_percentile`
- `nutritional_diagnosis`

Los percentiles del MVP son manuales y aceptan las referencias 3, 15, 50, 85 y 97. La medición original siempre se conserva separada de su evaluación.

### `diagnoses`

- `id`
- `consultation_id`
- `description`
- `code` (opcional, si posteriormente se utiliza un catálogo)
- `type` o `status` (opcional)

### `treatments`

- `id`
- `consultation_id`
- `name` o `description`
- `dose` (opcional)
- `route` (opcional)
- `frequency` (opcional)
- `duration` (opcional)
- `instructions` (opcional)

### `appointments`

- `id` (UUID)
- `patient_id`
- `pediatrician_id`
- `scheduled_at`
- `duration_minutes`
- `reason`
- `notes` (opcional)
- `status` (`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED` o `NO_SHOW`)
- `created_at`
- `updated_at`

Una cita representa un evento programado; una consulta representa la atención clínica realizada. Cuando el pediatra inicie una consulta desde una cita, ambas quedarán vinculadas sin convertirlas en la misma entidad.

### Auditoría

Todas las entidades clínicas conservarán como mínimo fechas de creación y modificación. El MVP permitirá editar valores, diagnósticos y tratamientos, pero no mostrará un historial de autores o versiones anteriores. La bitácora técnica de accesos puede mantenerse sin exponer datos clínicos.

### `clinical_attachments`

> Estado: pospuesto para una fase posterior al MVP. No se implementará almacenamiento de archivos en la primera entrega.

- `id` (UUID)
- `consultation_id`
- `pediatrician_id`
- `category` (`LABORATORY` o `IMAGING`)
- nombre original y tipo MIME
- tamaño en bytes
- clave privada del almacenamiento
- `created_at`

Las notas de laboratorios e imagenología continuarán en la consulta durante el MVP. En una fase posterior, los adjuntos serán complementarios, privados y accesibles solamente después de verificar que la consulta pertenece al pediatra autenticado.

## 5. API REST inicial

Prefijo: `/api/v1`.

### Estado del servicio

```text
GET    /api/v1/health
```

### Autenticación

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Pacientes

```text
GET    /api/v1/patients?search=&from=&to=&page=&limit=&sort=
POST   /api/v1/patients
GET    /api/v1/patients/:patientId
PATCH  /api/v1/patients/:patientId
```

Se utilizarán filtros separados por fecha de registro y fecha de consulta, con nombres explícitos como `registeredFrom`, `registeredTo`, `consultationFrom` y `consultationTo`.

### Historia clínica

```text
GET    /api/v1/patients/:patientId/clinical-history
PUT    /api/v1/patients/:patientId/clinical-history
```

Ambos endpoints están implementados y protegidos por sesión y propiedad del paciente. `GET` devuelve `null` cuando todavía no existe historia; `PUT` crea o reemplaza la historia completa. Vacunación incompleta exige indicar las vacunas faltantes, Bristol acepta valores del 1 al 7 y las frecuencias alimentarias de 0 a 7 días por semana.

### Consultas

```text
GET    /api/v1/patients/:patientId/consultations
POST   /api/v1/patients/:patientId/consultations
GET    /api/v1/consultations/:consultationId
PATCH  /api/v1/consultations/:consultationId
```

La creación o edición de una consulta recibirá sus signos vitales, diagnósticos y tratamientos. El backend guardará toda la operación dentro de una transacción.

Las consultas serán editables en el MVP. Antes de utilizar datos reales deberá definirse si se conserva una bitácora con los valores anteriores de cada modificación.

### Citas

```text
GET    /api/v1/appointments?from=&to=&status=&page=&limit=
POST   /api/v1/appointments
GET    /api/v1/appointments/:appointmentId
PATCH  /api/v1/appointments/:appointmentId
POST   /api/v1/appointments/:appointmentId/cancel
POST   /api/v1/appointments/:appointmentId/no-show
POST   /api/v1/appointments/:appointmentId/start-consultation
```

`start-consultation` creará una consulta vinculada y marcará la cita como atendida dentro de una sola transacción. La operación deberá ser idempotente para impedir dos consultas originadas por la misma cita.

## 6. Validaciones

El backend será la autoridad final, aunque el frontend también valide los formularios.

- Nombre y apellidos obligatorios, recortados y con longitud máxima.
- Edad numérica no negativa y acompañada por su unidad.
- Fecha de nacimiento válida y no futura cuando se proporcione.
- UUID válidos.
- Fechas de consulta válidas.
- Signos vitales numéricos con unidades definidas.
- Diagnósticos y tratamientos como arreglos sin elementos completamente vacíos.
- Longitud máxima para notas y descripciones.
- Paginación limitada para evitar consultas excesivas.
- Normalización de búsquedas por nombre.
- Errores por campo sin revelar información interna de la base.

## 7. Autenticación y seguridad

- Contraseñas con hash fuerte, nunca texto plano.
- Cookie `httpOnly`, `secure` y `sameSite` configurada para el despliegue.
- HTTPS obligatorio en producción.
- CORS restringido al dominio del frontend.
- Protección contra intentos repetidos de inicio de sesión.
- Secretos exclusivamente en variables de entorno.
- Autorización comprobada en cada endpoint privado.
- Validación de todas las entradas.
- Logs sin contraseñas, sesiones ni contenido clínico.
- Borrado lógico para pacientes en lugar de eliminación física.
- Respaldos verificados y prueba de restauración.
- Revisión legal antes de alojar información real.

## 8. Estructura propuesta

```text
backend/
├── src/
│   ├── config/
│   ├── database/
│   │   ├── data-source.ts
│   │   ├── migrations/
│   │   └── seeds/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── clinical-histories/
│   │   └── consultations/
│   ├── shared/
│   ├── app.ts
│   └── server.ts
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

Cada módulo podrá contener su entidad, rutas, controlador, servicio, esquemas Zod y pruebas. Esto evita controladores y servicios globales demasiado grandes.

## 9. Pruebas prioritarias

- Inicio y cierre de sesión.
- Rechazo de credenciales incorrectas.
- Bloqueo de endpoints sin sesión.
- Alta y edición válida de pacientes.
- Errores por información inválida.
- Búsqueda, filtros, ordenamiento y paginación.
- Creación transaccional de consultas completas.
- Creación, reprogramación, cancelación e inasistencia de citas.
- Conversión transaccional e idempotente de una cita en consulta.
- Conservación de varias consultas del mismo paciente.
- Creación, lectura y reemplazo transaccional de la historia clínica por secciones.
- Rechazo de historias clínicas pertenecientes a otro pediatra.
- Restricción de acceso de acuerdo con los roles que se definan.

## 10. Despliegue

- API desplegada como servicio de Railway.
- PostgreSQL administrado en el mismo proyecto o entorno.
- Variables de entorno distintas para desarrollo, pruebas y producción.
- Migraciones ejecutadas de forma controlada durante el despliegue.
- Endpoint de salud para monitoreo.
- Respaldo creado antes de migraciones de producción.
- Procedimiento documentado de restauración y reversión.
