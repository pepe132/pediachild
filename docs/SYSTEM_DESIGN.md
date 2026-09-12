# System design — PediaChild

## 1. Objetivos y alcance

PediaChild comenzará con un solo pediatra, pero se diseñará desde el inicio para incorporar posteriormente a más especialistas sin reconstruir la base de datos.

El cliente será una sola aplicación React responsive con experiencia tipo SaaS. Atenderá computadora, tableta y celular mediante navegador; una aplicación móvil nativa queda fuera del MVP.

Objetivos:

- mantener sencillo el MVP;
- impedir que un pediatra acceda a pacientes de otro;
- conservar múltiples consultas por paciente;
- administrar citas y agenda;
- permitir editar consultas;
- proteger datos clínicos reales cuando el sistema sea entregado;
- escalar gradualmente según el uso medido.

Quedan fuera del MVP la generación y almacenamiento de archivos PDF en el servidor, las notificaciones en tiempo real, las aplicaciones móviles nativas y los archivos de laboratorios o imagenología. La receta médica sí tendrá una vista imprimible desde el navegador, que permitirá imprimirla o guardarla localmente como PDF sin persistir otro archivo clínico.

También quedan fuera del MVP los pagos, planes, suscripciones, facturación y registro autoservicio de nuevos pediatras.

## 2. Arquitectura elegida

Se utilizará un **monolito modular con arquitectura por capas**:

```text
HTTP / Express
      ↓
Routes + Controllers
      ↓
Application Services
      ↓
Repositories
      ↓
TypeORM + PostgreSQL
```

Los controladores traducirán HTTP a llamadas de aplicación, pero no contendrán reglas de negocio ni consultas directas a TypeORM. Los servicios aplicarán reglas, autorización y transacciones. Los repositorios encapsularán la persistencia.

Un monolito modular mantiene límites claros sin introducir la operación y comunicación adicional de microservicios.

## 3. Componentes

```text
┌──────────────────────┐
│ React Web App        │
└──────────┬───────────┘
           │ HTTPS + cookie de sesión
           ▼
┌──────────────────────────────────────┐
│ Express API                          │
│                                      │
│  Auth ───── Patients ── Appointments │
│                │                     │
│                ├── Clinical History  │
│                └── Consultations     │
│                       ├── Vitals      │
│                       ├── Diagnoses   │
│                       └── Treatments  │
└──────────────────┬───────────────────┘
                   │ TypeORM
                   ▼
          ┌──────────────────┐
          │ PostgreSQL       │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │ Backups          │
          └──────────────────┘
```

No se incorporarán Redis, colas o almacenamiento de objetos hasta que exista una necesidad concreta.

## 4. Módulos

### `auth`

- iniciar y cerrar sesión;
- obtener el usuario actual;
- verificar credenciales;
- crear y validar sesiones;
- proporcionar el pediatra autenticado a los demás módulos.

### `patients`

- registrar y modificar pacientes;
- listar solamente pacientes propios;
- buscar por nombre;
- filtrar por fecha de registro y consulta;
- paginar y ordenar resultados;
- desactivar sin eliminar físicamente.

### `clinical-histories`

- mantener una historia clínica principal por paciente;
- validar propiedad antes de leer o modificar;
- incorporar los campos definitivos cuando se reciba el formato clínico.

El formato ya fue recibido y analizado en [HISTORIA_CLINICA.md](HISTORIA_CLINICA.md). Su implementación se dividirá internamente en antecedentes familiares, no patológicos, nutricionales, perinatales y patológicos; los signos vitales y la somatometría permanecerán dentro del contexto de consulta.

### `consultations`

- registrar varias consultas por paciente;
- conservar la edad capturada en cada consulta;
- administrar signos vitales, diagnósticos y tratamientos;
- modificar consultas;
- guardar operaciones compuestas mediante transacciones.

### `appointments`

- programar citas para pacientes propios;
- consultar la agenda por fecha y estado;
- editar o reprogramar;
- cancelar o marcar inasistencia;
- iniciar una consulta vinculada;
- impedir que una misma cita origine más de una consulta.

## 5. Propiedad y aislamiento de datos

Aunque inicialmente exista un usuario, el sistema será multiusuario desde el comienzo:

```text
Pediatra 1 ──┬── Paciente A ── Consultas
             │             └── Citas
             └── Paciente B ── Consultas y citas

Pediatra 2 ──┬── Paciente C ── Consultas
             └── Paciente D ── Consultas
```

Cada paciente tendrá un `pediatrician_id`. Toda operación combinará el identificador solicitado con el usuario autenticado:

```text
patient.id = :patientId
AND patient.pediatrician_id = authenticatedUser.id
```

El frontend nunca enviará un `pediatrician_id` para determinar al propietario. El backend lo obtendrá exclusivamente de la sesión.

Las consultas heredarán la propiedad mediante el paciente. Cada lectura o modificación validará esa cadena. Para no revelar que existe un expediente ajeno, un recurso no perteneciente al usuario se responderá normalmente como `404`.

## 6. Flujo de autenticación

```text
1. El pediatra envía usuario y contraseña.
2. La API valida la entrada.
3. Auth compara la contraseña con su hash.
4. La API crea una sesión y devuelve una cookie segura.
5. El navegador incluye la cookie en solicitudes posteriores.
6. Un middleware obtiene al usuario autenticado.
7. Los servicios filtran datos por ese usuario.
```

La cookie será `httpOnly`, `secure` en producción y tendrá una política `sameSite` adecuada al despliegue. No se guardarán tokens en `localStorage`.

Para el MVP la sesión puede persistirse en PostgreSQL. Esto evita añadir Redis mientras una sola instancia y la carga esperada no lo necesiten.

## 7. Flujo de creación de paciente

```text
React
  → POST /api/v1/patients
  → middleware de sesión
  → validación Zod
  → PatientsService
  → asigna authenticatedUser.id como propietario
  → PatientsRepository
  → PostgreSQL
```

## 8. Flujo de consulta clínica

Para crear o modificar una consulta:

```text
1. Autenticar al usuario.
2. Validar el cuerpo completo.
3. Comprobar que el paciente le pertenece.
4. Abrir una transacción.
5. Crear o modificar la consulta.
6. Guardar signos vitales.
7. Guardar diagnósticos y tratamientos.
8. Confirmar la transacción.
9. Responder con la consulta resultante.
```

Si falla un paso, se revierte toda la transacción para evitar datos clínicos parciales.

Las consultas podrán editarse. El especialista no requiere mostrar versiones anteriores ni el autor de cada modificación.

## 9. Búsqueda, filtros e índices

La tabla utilizará paginación desde el servidor; no descargará todos los pacientes al navegador.

Filtros previstos:

- nombre;
- rango de fecha de registro;
- rango de fecha de consulta;
- estado activo o inactivo, si se requiere;
- ordenamiento por nombre, registro o última consulta.

Índices iniciales candidatos:

- `patients.pediatrician_id`;
- nombre normalizado del paciente;
- `patients.created_at`;
- `consultations.patient_id`;
- `consultations.consultation_date`.
- `appointments.pediatrician_id`;
- `appointments.scheduled_at`;
- combinación de pediatra, fecha programada y estado para la agenda.

Los índices definitivos se ajustarán con las consultas y mediciones reales.

## 10. Consistencia

Se utilizarán transacciones para:

- crear una consulta con signos vitales, diagnósticos y tratamientos;
- modificar todos los componentes de una consulta;
- crear un paciente con historia o primera consulta si el flujo definitivo lo requiere.
- iniciar una consulta desde una cita y marcarla como atendida.

La relación `consultations.appointment_id` será opcional y única. Así una consulta puede existir sin cita previa, pero una cita no puede generar dos consultas.

Las claves foráneas, valores únicos y campos obligatorios de PostgreSQL complementarán las validaciones de Zod.

## 11. Manejo de errores

La API utilizará una estructura consistente:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay información inválida.",
    "fields": {
      "ageValue": "La edad es obligatoria."
    }
  }
}
```

Estados principales:

- `400`: solicitud inválida;
- `401`: sesión ausente o inválida;
- `403`: operación no permitida;
- `404`: recurso inexistente o ajeno;
- `409`: conflicto o duplicado;
- `500`: error interno sin detalles sensibles.

## 12. Seguridad y privacidad

- HTTPS obligatorio en producción.
- Contraseñas con hash fuerte.
- Cookies seguras y protección CSRF conforme al despliegue.
- CORS restringido al frontend.
- Límite de intentos de inicio de sesión.
- Validación de todas las entradas.
- Consultas limitadas por propietario.
- Secretos en variables de entorno.
- Ningún dato clínico en logs técnicos.
- Borrado lógico de pacientes.
- Respaldos y pruebas de restauración.
- Revisión legal antes de capturar datos reales.

El desarrollo y las pruebas utilizarán datos ficticios. Antes de entregar el sistema al especialista se realizará una revisión específica de producción, auditoría y protección de datos.

## 13. Despliegue

```text
Internet
   │
   ├── Frontend React
   │
   └── Railway
         ├── Express API
         └── PostgreSQL
```

Se mantendrán ambientes y variables separados para desarrollo y producción. Los dominios del frontend y la API determinarán la configuración final de cookies y CORS.

## 14. Escalabilidad

La primera versión funcionará con una instancia de API y PostgreSQL. Podrá crecer mediante:

- índices y optimización de consultas;
- paginación obligatoria;
- varias instancias sin estado de la API;
- almacenamiento compartido de sesiones;
- colas para futuras exportaciones;
- almacenamiento de objetos privado para adjuntos clínicos.

Estas piezas solamente se incorporarán cuando exista una necesidad medida.

El frontend podrá evolucionar a PWA instalable. No se implementará funcionamiento clínico sin conexión en la primera versión debido a los riesgos de sincronización, conflictos y almacenamiento local de información sensible.

## 15. Decisiones registradas

- **Monolito modular:** suficiente para el alcance, con límites internos claros.
- **PostgreSQL:** apropiado para relaciones y transacciones clínicas.
- **TypeORM:** integrado con TypeScript, entidades y migraciones.
- **Aislamiento por propietario:** evita una migración compleja al sumar pediatras y previene accesos cruzados.
- **Sesiones sin Redis inicialmente:** reduce infraestructura; PostgreSQL puede sostener el MVP.
- **Archivos clínicos privados:** las fotografías o capturas de laboratorios e imagenología se almacenarán fuera de PostgreSQL en almacenamiento de objetos privado. La base conservará metadatos y la clave del objeto, y la API autorizará cada carga y descarga. La generación de PDF permanece fuera del MVP.

## 16. Pendientes que no bloquean el inicio

- Formato y campos de la historia clínica.
- Jurisdicción y requisitos normativos.
- Política técnica de registro de accesos sin mostrar un historial de cambios clínicos al usuario.
- Alta y recuperación de cuentas para futuros clientes.
- Roles adicionales; el MVP tendrá únicamente `PEDIATRICIAN`.
