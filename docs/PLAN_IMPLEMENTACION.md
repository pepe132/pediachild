# Plan general de implementación — PediaChild

## 1. Objetivo

PediaChild será una aplicación web responsive con diseño tipo SaaS, orientada principalmente a escritorio pero utilizable también en tabletas y celulares, para que un pediatra pueda:

- iniciar y cerrar sesión;
- registrar pacientes;
- crear y digitalizar expedientes e historias clínicas;
- registrar consultas con signos vitales, diagnósticos y tratamientos;
- consultar una tabla con todos los pacientes;
- registrar y administrar citas;
- consultar la agenda por fecha;
- buscar y filtrar pacientes por nombre y fecha;
- abrir el detalle de un paciente y revisar su información e historial clínico.

El primer alcance será un **MVP sencillo, minimalista y seguro**, preparado para ampliarse cuando se entregue el formato completo de historia clínica.

## 2. Documentación técnica

El plan se divide en los siguientes documentos:

- [Plan del backend](docs/BACKEND.md): API REST, PostgreSQL, TypeORM, autenticación, modelo de datos, endpoints, validaciones, seguridad, pruebas y despliegue.
- [Plan del frontend](docs/FRONTEND.md): pantallas, navegación, tabla de pacientes, formularios, estado de la interfaz, diseño y pruebas.
- [System design](docs/SYSTEM_DESIGN.md): arquitectura, módulos, aislamiento por pediatra, flujos, transacciones, seguridad, despliegue y escalabilidad.
- [Historia clínica](docs/HISTORIA_CLINICA.md): análisis del formato recibido, separación de datos, modelo propuesto y preguntas clínicas pendientes.

El formato recibido de historia clínica y sus decisiones pendientes se documentan en `docs/HISTORIA_CLINICA.md`.

## 3. Arquitectura general

Se utilizará un solo repositorio con dos proyectos independientes:

```text
pediachild/
├── backend/                 # API REST
├── frontend/                # Aplicación web React
├── docs/
│   ├── BACKEND.md
│   └── FRONTEND.md
├── .gitignore
├── README.md
└── PLAN_IMPLEMENTACION.md
```

Flujo principal:

```text
Pediatra → React → API REST Express → PostgreSQL
```

Esta separación permite desarrollar, probar y desplegar cada aplicación de forma independiente sin mantener repositorios distintos.

## 4. Tecnologías acordadas

### Backend

- Node.js y TypeScript.
- Express.
- Zod para validaciones.
- TypeORM para entidades, relaciones y migraciones.
- PostgreSQL administrado en Railway.
- Cookie segura de sesión para autenticación.

Sequelize sería una alternativa válida, pero la propuesta inicial utilizará TypeORM por su integración natural con clases y tipos de TypeScript.

### Frontend

- React y TypeScript.
- Vite.
- React Router.
- TanStack Query.
- React Hook Form y Zod.
- CSS sencillo o Tailwind CSS, decisión pendiente antes de comenzar el diseño visual.
- Una sola aplicación React responsive para computadora, tableta y celular.
- Experiencia visual tipo SaaS con navegación lateral en escritorio y navegación compacta en móvil.
- PWA instalable como evolución posterior, sin requerir una aplicación móvil nativa para el MVP.

## 5. Alcance funcional del MVP

### Autenticación

- Inicio de sesión con correo o nombre de usuario y contraseña.
- Cierre de sesión.
- Cuenta inicial creada mediante una semilla o proceso administrativo.
- Un solo pediatra utilizará inicialmente el sistema, pero el diseño permitirá incorporar más pediatras posteriormente.
- Cada pediatra solamente podrá consultar y modificar sus propios pacientes.
- API y pantallas privadas protegidas.
- Recuperación de contraseña fuera del MVP, salvo que se confirme como requisito.

### Pacientes

- Alta y edición de pacientes.
- Edad digitada manualmente con unidad en días, meses o años.
- Fecha de nacimiento opcional.
- Tabla paginada con todos los pacientes.
- Búsqueda por nombre.
- Filtros por fecha.
- Acceso al detalle del paciente.
- Desactivación en lugar de eliminación física para conservar trazabilidad.

### Expediente y consultas

- Datos generales del paciente.
- Historia clínica basada en el formato recibido, con algunas definiciones clínicas pendientes de confirmar.
- Una o varias consultas por paciente.
- Consultas modificables durante el MVP.
- Edad del paciente registrada en cada consulta.
- Signos vitales por consulta.
- Uno o varios diagnósticos por consulta.
- Uno o varios tratamientos por consulta.
- Fecha, pediatra responsable y notas.
- Historial cronológico en el detalle del paciente.
- Fotografías y capturas de laboratorios o radiografías incluidas como adjuntos privados.
- Generación de PDF fuera del MVP.

### Citas

- Crear una cita para un paciente.
- Consultar la agenda por fecha.
- Editar o reprogramar una cita.
- Cancelar una cita.
- Marcar que el paciente no asistió.
- Iniciar una consulta clínica desde una cita.
- Mantener separada la cita programada de la consulta clínica realizada.

## 6. Fases de implementación

### Fase 0 — Cierre de requerimientos

- Recibir el formato completo de historia clínica.
- Resolver las preguntas pendientes de este documento.
- Acordar campos obligatorios, unidades y flujo de captura.
- Crear bocetos sencillos de las pantallas.

**Resultado:** alcance del MVP y modelo de datos aprobados.

### Fase 1 — Base técnica

- Crear `backend` y `frontend`.
- Configurar TypeScript, lint, formato, variables de entorno y pruebas.
- Configurar PostgreSQL y TypeORM.
- Crear migración inicial y usuario semilla.
- Preparar la comunicación entre frontend y API.

**Resultado:** ambos proyectos se ejecutan localmente y la API conecta con la base.

### Fase 2 — Autenticación

- Implementar login, logout y consulta de sesión.
- Proteger endpoints y rutas del frontend.
- Añadir límites a intentos de acceso y pruebas.

**Resultado:** solo un usuario autenticado puede acceder a la aplicación.

### Fase 3 — Pacientes

- Implementar modelo, migración y endpoints.
- Construir alta, edición, tabla, búsqueda, filtros y paginación.
- Añadir validaciones en backend y frontend.

**Resultado:** se pueden administrar los datos generales de pacientes.

### Fase 4 — Expediente e historia clínica

- Traducir el formato recibido a campos y secciones.
- Crear migraciones y endpoints.
- Construir el formulario por secciones.

**Resultado:** el pediatra puede guardar y editar la historia clínica.

### Fase 5 — Consultas clínicas

- Implementar consultas, signos vitales, diagnósticos y tratamientos.
- Guardar la consulta completa mediante una transacción.
- Mostrar el historial cronológico en el detalle del paciente.

**Resultado:** cada paciente conserva múltiples consultas sin perder información anterior.

### Fase 6 — Citas y agenda

- Implementar creación, edición y reprogramación de citas.
- Mostrar la agenda diaria y filtros por fecha.
- Implementar los estados programada, confirmada, atendida, cancelada e inasistencia.
- Permitir iniciar una consulta desde una cita.
- Vincular la consulta resultante con su cita de origen.

**Resultado:** el pediatra puede administrar su agenda y convertir una cita atendida en consulta clínica.

### Fase 7 — Calidad y despliegue

- Probar los flujos críticos.
- Revisar seguridad y permisos.
- Completar estados de carga, error y ausencia de datos.
- Desplegar API y PostgreSQL.
- Desplegar frontend y configurar dominios y CORS.
- Configurar respaldos, monitoreo y procedimiento de restauración.

**Resultado:** MVP verificable en un ambiente de producción controlado.

## 7. Criterios de aceptación iniciales

- Un usuario válido puede iniciar y cerrar sesión.
- Un usuario no autenticado no puede leer ni modificar expedientes.
- El pediatra puede crear y editar un paciente.
- La edad digitada se guarda con su unidad.
- Cada consulta conserva la edad registrada en ese momento.
- La tabla permite buscar pacientes por nombre y filtrar por las fechas acordadas.
- Al seleccionar una fila se abre el expediente completo del paciente.
- El pediatra puede registrar varias consultas para un paciente.
- El pediatra puede crear, reprogramar y cancelar citas.
- Una cita atendida puede originar una consulta clínica vinculada.
- Cada consulta conserva sus signos vitales, diagnósticos y tratamientos.
- Los errores de validación aparecen junto al campo correspondiente.
- Un nuevo despliegue no ocasiona pérdida de información.
- Existe un respaldo restaurable antes de utilizar datos reales.

## 8. Información pendiente por confirmar

### Operación y usuarios

1. ¿Se requerirán roles adicionales, como recepcionista o administrador, en una versión posterior?
2. ¿Cómo se dará de alta o recuperará una cuenta cuando el producto se venda a otros pediatras?

### Paciente y tutor

5. Además del nombre y la edad digitada, ¿qué datos generales son obligatorios?
6. ¿También se capturará la fecha de nacimiento cuando esté disponible?
7. ¿Se registrarán sexo, dirección, teléfono, correo, número de expediente o identificador oficial?
8. Al tratarse de pacientes pediátricos, ¿qué información del padre, madre o tutor se necesita?
9. ¿Cómo se detectarán pacientes duplicados?

### Historia y consulta

10. ¿Cuál es el formato completo de historia clínica y qué campos serán obligatorios?
11. ¿Una captura representa el expediente inicial, una consulta o ambos?
12. ¿Qué signos vitales exactos se utilizarán y con qué unidades?
13. ¿Los diagnósticos y tratamientos serán texto libre o usarán catálogos?
14. ¿Los medicamentos requieren dosis, vía, frecuencia y duración separadas?
15. Confirmado: se podrán modificar valores, diagnósticos y tratamientos sin mostrar versiones anteriores ni autor del cambio.

### Tabla, filtros y reportes

16. ¿Se necesita ordenar por última consulta, nombre o fecha de registro?
17. ¿Se requerirá exportar, imprimir o generar reportes en una versión posterior?

### Producción y cumplimiento

18. ¿En qué país o jurisdicción se utilizará?
19. ¿Cuál es la cantidad aproximada de pacientes y consultas diarias?
20. ¿Existe dominio propio y cuál es el presupuesto mensual máximo?
21. ¿Qué tiempo de conservación y política de respaldos se requiere?

## 9. Decisiones recomendadas por ahora

- Monorepositorio sencillo con `backend` y `frontend`.
- PostgreSQL y TypeORM.
- Autenticación mediante cookie segura.
- Arquitectura multiusuario desde el inicio, aunque el MVP tenga un solo pediatra.
- Pacientes y consultas aislados por pediatra propietario.
- Edad digitada con unidad y conservada también en cada consulta.
- Fecha de nacimiento opcional.
- Separación entre paciente, historia clínica y consultas.
- Diagnósticos y tratamientos como listas relacionadas con cada consulta.
- Borrado lógico y trazabilidad en lugar de eliminación permanente.
- Consultas editables durante el MVP.
- Módulo de citas y agenda incluido en el MVP.
- Filtros separados por fecha de registro y fecha de consulta.
- Adjuntos privados de imagen para laboratorios y radiografías incluidos en el MVP.
- Sin generación de PDF en el MVP.
- Interfaz web adaptable, optimizada primero para escritorio.
- Diseño clínico y minimalista tipo SaaS.
- Sin pagos, planes ni suscripciones durante el MVP.

No se debe cerrar definitivamente el modelo de historia clínica hasta recibir su formato, porque sus secciones pueden modificar las tablas, validaciones y pantallas.
